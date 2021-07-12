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
    Team,
    User,
} from '@support/server_api';
import {Autocomplete} from '@support/ui/component';
import {
    ChannelScreen,
    SearchScreen,
    ThreadScreen,
} from '@support/ui/screen';

describe('Autocomplete', () => {
    const {
        goToChannel,
        openReplyThreadFor,
        postInput,
        postMessage,
    } = ChannelScreen;
    const {
        atMentionSuggestionList,
        emojiSuggestionList,
        slashSuggestionList,
    } = Autocomplete;
    let testUser;
    let testOtherUser;
    let testChannel;
    let townSquareChannel;

    beforeAll(async () => {
        const currentUser = User.generateRandomUser();
        delete currentUser.nickname;
        const {channel, team, user} = await Setup.apiInit({userOptions: {user: currentUser}});
        testChannel = channel;
        testUser = user;

        ({user: testOtherUser} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    beforeEach(async () => {
        // # Clear text and verify that Autocomplete disappeared
        await postInput.clearText();
        await Autocomplete.toBeVisible(false);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T168 should have autocomplete items available from input boxes', async () => {
        // # Type ":ta" to activate emoji autocomplete
        await postInput.typeText(':ta');

        // * Verify emoji autocomplete is displayed
        await Autocomplete.toBeVisible();
        await expect(emojiSuggestionList).toExist();

        // # Type space to close emoji autocomplete
        await postInput.typeText(' ');

        // * Verify emoji autocomplete is not displayed
        await expect(emojiSuggestionList).not.toExist();

        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');

        // * Verify at mention autocomplete is displayed
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Post message, open reply thread, and type "/" to activate slash autocomplete
        const message = Date.now().toString();
        await postMessage(message, {quickReplace: true});
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(post.id, message);
        await ThreadScreen.postInput.typeText('/');

        // * Verify slash autocomplete is displayed
        await Autocomplete.toBeVisible();
        await expect(slashSuggestionList).toExist();

        // # Go back to channel
        await ThreadScreen.postInput.clearText();
        await ThreadScreen.back();
    });

    it('MM-T171 should have at-mention autocomplete available out of channel members', async () => {
        // # Go to test channel
        await goToChannel(testChannel.display_name);

        // # Activate at mention autocomplete for other user
        await postInput.typeText(`@${testOtherUser.username}`);

        // * Verify at mention autocomplete with other user is displayed
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();
        const {atMentionItem: testOtherUserAutocomplete} = Autocomplete.getAtMentionItem(testOtherUser.id);
        await expect(testOtherUserAutocomplete).toExist();
    });

    it('MM-T1798 should include self in user autocomplete', async () => {
        // # Activate at mention autocomplete for current user
        await postInput.typeText(`@${testUser.username}`);

        // * Verify at mention autocomplete with current user is displayed
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();
        const {
            atMentionItem,
            atMentionItemName,
            atMentionItemUsername,
        } = Autocomplete.getAtMentionItem(testUser.id);
        await expect(atMentionItem).toExist();
        await expect(atMentionItemName).toHaveText(`${testUser.first_name} ${testUser.last_name}`);
        await expect(atMentionItemUsername).toHaveText(`(you) @${testUser.username}`);
    });

    it('MM-T2349 should have autocomplete using nickname', async () => {
        // # Activate at mention autocomplete for other user using nickname
        await postInput.typeText(`@${testOtherUser.nickname}`);

        // * Verify at mention autocomplete with other user is displayed
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();
        const {
            atMentionItem,
            atMentionItemName,
            atMentionItemUsername,
        } = Autocomplete.getAtMentionItem(testOtherUser.id);
        await expect(atMentionItem).toExist();
        await expect(atMentionItemName).toHaveText(`${testOtherUser.first_name} ${testOtherUser.last_name} (${testOtherUser.nickname})`);
        await expect(atMentionItemUsername).toHaveText(` @${testOtherUser.username}`);
    });

    it('MM-T170 should be able to search usernames as case insensitive', async () => {
        const {
            searchInput,
            searchFromSection,
        } = SearchScreen;

        // # Search user using lowercase username
        await SearchScreen.open();
        await searchInput.clearText();
        await searchFromSection.tap();
        const lowerCaseSearchTerm = testUser.username;
        await searchInput.typeText(lowerCaseSearchTerm);

        // * Verify user is displayed using lowercase search term
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();
        const {atMentionItem: lowerCaseAtMention} = await Autocomplete.getAtMentionItem(testUser.id);
        await expect(lowerCaseAtMention).toBeVisible();

        // # Search user using uppercase username
        await searchInput.clearText();
        await searchFromSection.tap();
        const upperCaseSearchTerm = testUser.username.toUpperCase();
        await searchInput.typeText(upperCaseSearchTerm);

        // * Verify user is displayed using uppercase search term
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();
        const {atMentionItem: upperCaseAtMention} = await Autocomplete.getAtMentionItem(testUser.id);
        await expect(upperCaseAtMention).toBeVisible();

        // # Go back to channel
        await SearchScreen.cancel();
    });
});
