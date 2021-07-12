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
    ChannelInfoScreen,
    ChannelMembersScreen,
    ChannelScreen,
} from '@support/ui/screen';
import {getRandomId} from '@support/utils';

describe('Channel Manage Members', () => {
    const searchTerm = getRandomId();
    const {
        removeMembers,
        searchInput,
    } = ChannelMembersScreen;
    let testChannel;
    let testUser;
    let testOtherUser;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel = channel;
        testUser = user;

        ({user: testOtherUser} = await User.apiCreateUser({prefix: searchTerm}));
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);
        await Channel.apiAddUserToChannel(testOtherUser.id, testChannel.id);

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3198 should be able to remove a member', async () => {
        // # Go to channel
        await ChannelScreen.goToChannel(testChannel.display_name);

        // * Verify initial member count is 3
        await ChannelInfoScreen.open();
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('3')))).toBeVisible();

        // # Remove 1 member
        await ChannelInfoScreen.manageMembersAction.tap();
        await searchInput.typeText(searchTerm);
        await removeMembers([testOtherUser.username]);

        // * Verify member count is 2 and member is removed
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('2')))).toBeVisible();
        await ChannelInfoScreen.manageMembersAction.tap();
        await searchInput.typeText(searchTerm);
        await expect(element(by.text('No Results'))).toBeVisible();
        await ChannelMembersScreen.back();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });
});
