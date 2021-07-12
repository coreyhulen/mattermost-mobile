// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Setup,
    Team,
    User,
} from '@support/server_api';
import {
    Alert,
    MainSidebar,
} from '@support/ui/component';
import {
    ChannelInfoScreen,
    ChannelMembersScreen,
    ChannelScreen,
} from '@support/ui/screen';
import {isAndroid} from '@support/utils';

describe('Channel Moderation', () => {
    const {
        channelNavBarTitle,
        goToChannel,
    } = ChannelScreen;
    const {manageMembersAction} = ChannelInfoScreen;
    const {getUserByDisplayUsername} = ChannelMembersScreen;
    let testUser;
    let testOtherUser;
    let testChannel;
    let townSquareChannel;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testUser = user;
        testChannel = channel;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        ({user: testOtherUser} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);
        await Channel.apiAddUserToChannel(testOtherUser.id, testChannel.id);

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3317_1 user is prompted alert when removed from channel while on it', async () => {
        // # Go to channel
        await goToChannel(testChannel.display_name);

        // * Verify user is a member of the channel
        await ChannelInfoScreen.open();
        await manageMembersAction.tap();
        await expect(getUserByDisplayUsername(`@${testUser.username} - you`)).toBeVisible();

        // # Go back to channel
        await ChannelMembersScreen.back();
        await ChannelInfoScreen.close();

        // # Remove user while on channel
        await Channel.apiRemoveUserFromChannel(testChannel.id, testUser.id);

        // * Verify user is prompted removal alert
        const removeFromChannelTitleText = `Removed from ${testChannel.display_name}`;
        const removeFromChannelDescriptionText = 'You were removed from the channel.';
        const removeFromChannelTitle = isAndroid() ? element(by.text(removeFromChannelTitleText)) : element(by.label(removeFromChannelTitleText)).atIndex(0);
        const removeFromChannelDescription = isAndroid() ? element(by.text(removeFromChannelDescriptionText)) : element(by.label(removeFromChannelDescriptionText)).atIndex(0);
        await expect(removeFromChannelTitle).toBeVisible();
        await expect(removeFromChannelDescription).toBeVisible();

        // # Tap on ok button
        await Alert.okButton.tap();

        // * Verify redirected to town square channel
        await expect(channelNavBarTitle).toHaveText(townSquareChannel.display_name);
    });

    it('MM-T3317_2 user is not prompted alert when removed from channel while not on it', async () => {
        const {
            closeMainSidebar,
            openMainSidebar,
        } = ChannelScreen;

        // # Open channel screen
        await ChannelScreen.logout();
        await ChannelScreen.open(testOtherUser);

        // # Go to channel
        await goToChannel(testChannel.display_name);

        // * Verify user is a member of the channel
        await ChannelInfoScreen.open();
        await manageMembersAction.tap();
        await expect(getUserByDisplayUsername(`@${testOtherUser.username} - you`)).toBeVisible();

        // # Go back to channel
        await ChannelMembersScreen.back();
        await ChannelInfoScreen.close();

        // # Go to town square channel
        await goToChannel(townSquareChannel.display_name);

        // # Remove user while on channel
        await Channel.apiRemoveUserFromChannel(testChannel.id, testOtherUser.id);

        // * Verify channel is not in the channels list anymore
        await openMainSidebar();
        await expect(MainSidebar.getChannelByDisplayName(testChannel.display_name)).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });
});
