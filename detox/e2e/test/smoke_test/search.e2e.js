// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Post,
    Setup,
} from '@support/server_api';
import {
    Autocomplete,
    PostOptions,
} from '@support/ui/component';
import {
    ChannelScreen,
    PermalinkScreen,
    SearchScreen,
    ThreadScreen,
} from '@support/ui/screen';

describe('Search', () => {
    const {
        atMentionSuggestionList,
        channelMentionSuggestionList,
    } = Autocomplete;
    const {
        getRecentSearchItem,
        getSearchResultPostItem,
        searchFromModifier,
        searchInModifier,
        searchInput,
    } = SearchScreen;
    let testMessage;
    let testPartialSearchTerm;
    let testUser;
    let testChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();
        testUser = user;

        const {channel} = await Channel.apiGetChannelByName(team.id, 'town-square');
        testChannel = channel;

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    beforeEach(async () => {
        testPartialSearchTerm = Date.now().toString();
        testMessage = `${testPartialSearchTerm} test`;
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3235 search on text, jump to result', async () => {
        // # Post message and search on text
        await postMessageAndSearchText(testMessage, testPartialSearchTerm);

        // # Open permalink from search result post item
        const lastPost = await Post.apiGetLastPostInChannel(testChannel.id);
        const {searchResultPostItem} = await getSearchResultPostItem(lastPost.post.id, testMessage);
        await expect(searchResultPostItem).toBeVisible();
        await searchResultPostItem.tap();

        // * Verify permalink post list has the message
        await PermalinkScreen.toBeVisible();
        const {postListPostItem: permalinkPostItem} = await PermalinkScreen.getPostListPostItem(lastPost.post.id, testMessage);
        await waitFor(permalinkPostItem).toBeVisible();

        // # Jump to recent messages
        await PermalinkScreen.jumpToRecentMessages();

        // * Verify user is on channel where message is posted
        await expect(ChannelScreen.channelNavBarTitle).toHaveText(testChannel.display_name);
        const {postListPostItem: channelPostItem} = await ChannelScreen.getPostListPostItem(lastPost.post.id, testMessage);
        await expect(channelPostItem).toBeVisible();
    });

    it('MM-T3236 search on sender, select from autocomplete, reply from search results', async () => {
        // # Post message and search on sender
        await postMessageAndSearchFrom(testMessage, testUser, atMentionSuggestionList, testPartialSearchTerm);

        // * Verify search result post has the message
        const lastPost = await Post.apiGetLastPostInChannel(testChannel.id);
        const {
            searchResultPostItem,
            searchResultPostItemHeaderReply,
        } = await getSearchResultPostItem(lastPost.post.id, testMessage);
        await expect(searchResultPostItem).toBeVisible();

        // # Open reply thread from search result post item
        const replyTestMessage = `reply-${testMessage}`;
        await searchResultPostItemHeaderReply.tap();

        // # Post a reply message
        await ThreadScreen.toBeVisible();
        await ThreadScreen.postMessage(replyTestMessage);

        // * Verify most recent post has the reply message
        const replyPost = await Post.apiGetLastPostInChannel(testChannel.id);
        const {postListPostItem} = await ThreadScreen.getPostListPostItem(replyPost.post.id, replyTestMessage);
        await expect(postListPostItem).toBeVisible();

        // # Go back to channel
        await ThreadScreen.back();
        await SearchScreen.cancel();
    });

    it('MM-T3237 search on channel, select from autocomplete, search in combination with a text string as well', async () => {
        // # Post message and search in channel
        await postMessageAndSearchIn(testMessage, testChannel, channelMentionSuggestionList, testPartialSearchTerm);

        // * Verify search result post has the message
        const lastPost = await Post.apiGetLastPostInChannel(testChannel.id);
        const {searchResultPostItem} = await getSearchResultPostItem(lastPost.post.id, testMessage);
        await expect(searchResultPostItem).toBeVisible();

        // # Go back to channel
        await SearchScreen.cancel();
    });

    it('MM-T3238 delete one previous search, tap on another', async () => {
        // # Post message and search in channel
        await postMessageAndSearchIn(testMessage, testChannel, channelMentionSuggestionList, testPartialSearchTerm);

        // # Post message and search on sender
        await SearchScreen.cancel();
        await postMessageAndSearchFrom(testMessage, testUser, atMentionSuggestionList, testPartialSearchTerm);

        // # Delete one previous text search
        const fromSearchTerms = `${searchFromModifier} ${testUser.username} ${testPartialSearchTerm}`;
        const previousTextSearch = await getRecentSearchItem(fromSearchTerms);
        await previousTextSearch.recentSearchItemRemoveButton.tap();

        // * Verify previous text search is removed
        await expect(previousTextSearch.recentSearchItem).not.toBeVisible();

        // # Tap on previous in search
        const inSearchTerms = `${searchInModifier} ${testChannel.name} ${testPartialSearchTerm}`;
        const previousInSearch = await getRecentSearchItem(inSearchTerms);
        await previousInSearch.recentSearchItem.tap();

        // * Verify search result post has the message
        const lastPost = await Post.apiGetLastPostInChannel(testChannel.id);
        const {searchResultPostItem} = await getSearchResultPostItem(lastPost.post.id, testMessage);
        await expect(searchResultPostItem).toBeVisible();

        // # Go back to channel
        await SearchScreen.cancel();
    });

    it('MM-T3240 should not be able to add a reaction on search results', async () => {
        // # Post message and search on text
        await postMessageAndSearchText(testMessage, testPartialSearchTerm);

        // * Verify add a reaction is not visible
        const lastPost = await Post.apiGetLastPostInChannel(testChannel.id);
        await SearchScreen.openPostOptionsFor(lastPost.post.id, testMessage);
        await expect(PostOptions.reactionPickerAction).not.toBeVisible();
        await PostOptions.close();

        // # Go back to channel
        await SearchScreen.cancel();
    });

    it('MM-T3239 should be able to scroll through long list of search results', async () => {
        // # Post messages
        const keyword = 'qa';
        const firstMessage = `${Date.now().toString()} ${keyword} first`;
        const firstPost = await Post.apiCreatePost({
            channelId: testChannel.id,
            message: firstMessage,
        });
        [...Array(50).keys()].forEach(async () => {
            const message = `${Date.now().toString()} ${keyword}`;
            await Post.apiCreatePost({
                channelId: testChannel.id,
                message,
            });
        });

        // # Perform search on keyword
        await SearchScreen.open();
        await searchInput.clearText();
        await searchInput.typeText(keyword);
        await searchInput.tapReturnKey();

        // * Verify user can scroll down multiple times until first matching post is seen
        const {searchResultPostItem} = await getSearchResultPostItem(firstPost.post.id, firstMessage);
        await waitFor(searchResultPostItem).toBeVisible().whileElement(by.id(SearchScreen.testID.searchResultsList)).scroll(1000, 'down');

        // # Go back to channel
        await SearchScreen.cancel();
    });
});

async function postMessageAndSearchFrom(testMessage, testUser, atMentionSuggestionList, testPartialSearchTerm) {
    const {
        getRecentSearchItem,
        searchFromModifier,
        searchFromSection,
        searchInput,
    } = SearchScreen;

    // # Post a message
    await ChannelScreen.postMessage(testMessage);

    // # Open search screen
    await SearchScreen.open();

    // # Tap "from:" modifier
    await searchInput.clearText();
    await searchFromSection.tap();

    // # Type beginning of search term
    const searchTerm = testUser.first_name;
    await searchInput.typeText(searchTerm);

    // # Select user from autocomplete
    await expect(atMentionSuggestionList).toExist();
    const {atMentionItem: userAtMentionAutocomplete} = await Autocomplete.getAtMentionItem(testUser.id);
    await userAtMentionAutocomplete.tap();

    // # Type end of search term
    await searchInput.typeText(testPartialSearchTerm);

    // # Search user
    await searchInput.tapReturnKey();
    await expect(atMentionSuggestionList).not.toExist();

    // * Verify recent search item is displayed
    const searchTerms = `${searchFromModifier} ${testUser.username} ${testPartialSearchTerm}`;
    const {recentSearchItem} = await getRecentSearchItem(searchTerms);
    await expect(recentSearchItem).toBeVisible();
}

async function postMessageAndSearchIn(testMessage, testChannel, channelMentionSuggestionList, testPartialSearchTerm) {
    const {
        getRecentSearchItem,
        searchInModifier,
        searchInSection,
        searchInput,
    } = SearchScreen;

    // # Post a message
    await ChannelScreen.postMessage(testMessage);

    // # Open search screen
    await SearchScreen.open();

    // # Tap "in:" modifier
    await searchInput.clearText();
    await searchInSection.tap();

    // # Type beginning of search term
    const searchTerm = testChannel.name;
    await searchInput.typeText(searchTerm);

    // # Select channel from autocomplete
    await expect(channelMentionSuggestionList).toExist();
    const channelMentionAutocomplete = await Autocomplete.getChannelMentionItem(testChannel.id);
    await channelMentionAutocomplete.tap();

    // # Type end of search term
    await searchInput.typeText(testPartialSearchTerm);

    // # Search channel
    await searchInput.tapReturnKey();
    await expect(channelMentionSuggestionList).not.toExist();

    // * Verify recent search item is displayed
    const searchTerms = `${searchInModifier} ${testChannel.name} ${testPartialSearchTerm}`;
    const {recentSearchItem} = await getRecentSearchItem(searchTerms);
    await expect(recentSearchItem).toBeVisible();
}

async function postMessageAndSearchText(testMessage, testPartialSearchTerm) {
    const {
        getRecentSearchItem,
        searchInput,
    } = SearchScreen;

    // # Post a message
    await ChannelScreen.postMessage(testMessage);

    // # Open search screen
    await SearchScreen.open();

    // # Type beginning of search term
    await searchInput.clearText();
    await searchInput.typeText(testPartialSearchTerm);

    // # Search text
    await searchInput.tapReturnKey();

    // * Verify recent search item is displayed
    const {recentSearchItem} = await getRecentSearchItem(testPartialSearchTerm);
    await expect(recentSearchItem).toBeVisible();
}
