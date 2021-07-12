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
    ChannelInfoScreen,
    ChannelMembersScreen,
    ChannelScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';
import {getRandomId} from '@support/utils';

describe('Channel View Members', () => {
    const searchTerm = getRandomId();
    let testUser;
    let testOtherUser1;
    let testOtherUser2;

    beforeAll(async () => {
        const {user, team} = await Setup.apiInit({userOptions: {prefix: `${searchTerm}-3-`}});
        testUser = user;

        ({user: testOtherUser1} = await User.apiCreateUser({prefix: `${searchTerm}-1-`}));
        await Team.apiAddUserToTeam(testOtherUser1.id, team.id);

        ({user: testOtherUser2} = await User.apiCreateUser({prefix: `${searchTerm}-2-`}));
        await Team.apiAddUserToTeam(testOtherUser2.id, team.id);

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T878 should only be able to view members in GM channel', async () => {
        const {
            getUserAtIndex,
            searchInput,
            startButton,
        } = MoreDirectMessagesScreen;

        // # Open more direct messages screen
        await ChannelScreen.openMainSidebar();
        await MoreDirectMessagesScreen.open();

        // # Create a GM with with 2 other users
        await searchInput.typeText(searchTerm);
        await getUserAtIndex(0).tap();
        await searchInput.typeText(searchTerm);
        await getUserAtIndex(1).tap();
        await startButton.tap();

        // * Verify GM channel can only view members
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.manageMembersAction.tap();
        await expect(element(by.text('View Members'))).toBeVisible();
        await expect(ChannelMembersScreen.removeButton).not.toExist();

        // # Go back to channel
        await ChannelMembersScreen.back();
        await ChannelInfoScreen.close();
    });
});
