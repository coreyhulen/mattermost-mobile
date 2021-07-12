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
    User,
} from '@support/server_api';
import {Autocomplete} from '@support/ui/component';
import {
    ChannelScreen,
    SearchScreen,
} from '@support/ui/screen';

describe('Guest Experience', () => {
    let testChannel;
    let testTeam;
    let testGuestUser;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();
        testGuestUser = user;
        testTeam = team;

        ({channel: testChannel} = await Channel.apiGetChannelByName(testTeam.id, 'town-square'));

        // # Demote user to guest
        await User.apiDemoteUserToGuest(testGuestUser.id);

        // # Open channel screen
        await ChannelScreen.open(testGuestUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T1404 Guest badge not shown next to system messages', async () => {
        // * Verify guest badge is not visible in system message
        const systemMessage = 'You and @sysadmin joined the team.';
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        const {postListPostItemHeaderGuestTag} = await ChannelScreen.getPostListPostItem(post.id, systemMessage);
        await expect(postListPostItemHeaderGuestTag).not.toBeVisible();
    });

    it('MM-T1397 Guest tag in search in:', async () => {
        const {
            getSearchResultPostItem,
            searchInSection,
            searchInput,
        } = SearchScreen;
        const {
            channelMentionSuggestionList,
            getChannelMentionItem,
        } = Autocomplete;

        // # Post a message as guest user
        const testMessage = Date.now().toString();
        await ChannelScreen.postMessage(testMessage);

        // * Verify guest badge is visible in channel
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        const {postListPostItemHeaderGuestTag} = await ChannelScreen.getPostListPostItem(post.id, testMessage);
        await expect(postListPostItemHeaderGuestTag).toBeVisible();

        // # Search ":in" channel and select channel from autocomplete
        await SearchScreen.open();
        await searchInput.clearText();
        await searchInSection.tap();
        await searchInput.typeText(testChannel.name);
        await expect(channelMentionSuggestionList).toExist();
        const channelMentionAutocomplete = await getChannelMentionItem(testChannel.id);
        await channelMentionAutocomplete.tap();
        await searchInput.tapReturnKey();

        // * Verify guest badge is visible in search results
        const {searchResultPostItemHeaderGuestTag} = await getSearchResultPostItem(post.id, testMessage);
        await expect(searchResultPostItemHeaderGuestTag).toBeVisible();

        // # Go back to channel
        await SearchScreen.cancel();
    });
});
