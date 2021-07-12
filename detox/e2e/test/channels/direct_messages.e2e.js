// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Preference,
    Setup,
    Team,
    User,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {
    ChannelInfoScreen,
    ChannelScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';

describe('Direct Messages', () => {
    const {
        closeMainSidebar,
        goToChannel,
        openMainSidebar,
    } = ChannelScreen;
    const {
        closeMoreDirectMessagesButton,
        getUserAtIndex,
        searchInput,
        startButton,
    } = MoreDirectMessagesScreen;
    const {getChannelByDisplayName} = MainSidebar;
    let testUser;
    let testOtherUser;

    beforeAll(async () => {
        const {user, team} = await Setup.apiInit();
        testUser = user;

        ({user: testOtherUser} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T1800 should remove closed DMs from main sidebar', async () => {
        // # Create a DM with the other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testOtherUser.username);
        await getUserAtIndex(0).tap();
        await startButton.tap();

        // # Close DM channel
        await goToChannel(testOtherUser.username);
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.closeDirectOrGroupMessage();

        // * Verify DM channel is removed
        await openMainSidebar();
        await expect(getChannelByDisplayName(testOtherUser.username)).not.toBeVisible();

        // # Go back to channel
        await closeMainSidebar();
    });

    it('MM-T442 should display full name / nickname on DM search result', async () => {
        // # Set teammate name display to full name
        await Preference.apiSaveTeammateNameDisplayPreference(testUser.id, 'full_name');

        // # DM search other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testOtherUser.username);

        // * Verify search result contains other user's full name
        await expect(element(by.text(`${testOtherUser.first_name} ${testOtherUser.last_name}`))).toBeVisible();

        // # Set teammate name display to nickname
        await Preference.apiSaveTeammateNameDisplayPreference(testUser.id, 'nickname_full_name');

        // # DM search other user again
        await searchInput.clearText();
        await searchInput.typeText(testOtherUser.username);

        // * Verify search result contains other user's nickname
        await expect(element(by.text(testOtherUser.nickname))).toBeVisible();

        // # Go back to channel
        await closeMoreDirectMessagesButton.tap();
    });
});
