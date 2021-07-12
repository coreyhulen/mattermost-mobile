// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Setup,
    Team,
    User,
} from '@support/server_api';
import {
    ChannelAddMembersScreen,
    ChannelInfoScreen,
    ChannelScreen,
} from '@support/ui/screen';

describe('Channel Add Members', () => {
    const {
        goToChannel,
        postMessage,
    } = ChannelScreen;
    const {
        addMembersAction,
        channelInfoScrollView,
    } = ChannelInfoScreen;
    const {
        addButton,
        getUserByDisplayUsername,
        searchInput,
    } = ChannelAddMembersScreen;
    let testChannel;
    let testAnotherUser;
    let testLastUser;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel = channel;

        [...Array(100).keys()].forEach(async (key) => {
            const {user: testOtherUser} = await User.apiCreateUser({prefix: `a-${key}-`});
            await Team.apiAddUserToTeam(testOtherUser.id, team.id);
        });
        ({user: testAnotherUser} = await User.apiCreateUser({prefix: 'b-other-'}));
        ({user: testLastUser} = await User.apiCreateUser({prefix: 'z-'}));
        await Team.apiAddUserToTeam(testAnotherUser.id, team.id);
        await Team.apiAddUserToTeam(testLastUser.id, team.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3196 should be able to add members to channel', async () => {
        // # Open add members screen
        await goToChannel(testChannel.display_name);
        await postMessage('divider');
        await ChannelInfoScreen.open();
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('2')))).toBeVisible();
        await channelInfoScrollView.scrollTo('bottom');
        await addMembersAction.tap();

        // # Add members to channel
        await searchInput.typeText('b-other');
        await getUserByDisplayUsername(`@${testAnotherUser.username}`).tap();
        await addButton.tap();

        // * Verify members are added
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('3')))).toBeVisible();

        // * Verify system message
        await ChannelInfoScreen.close();
        await expect(element(by.text(`@${testAnotherUser.username} added to the channel by you.`))).toBeVisible();
    });

    it('MM-T3197 should be able load users in long add members list', async () => {
        // # Open add members screen
        await goToChannel(testChannel.display_name);
        await ChannelInfoScreen.open();
        await channelInfoScrollView.scrollTo('bottom');
        await addMembersAction.tap();

        // * Verify user can scroll down multiple times until last user is seen
        await waitFor(getUserByDisplayUsername(`@${testLastUser.username}`)).toBeVisible().whileElement(by.id(ChannelAddMembersScreen.testID.usersList)).scroll(500, 'down');
        await ChannelAddMembersScreen.back();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });
});
