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
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Main Sidebar', () => {
    const {
        channelNavBarTitle,
        closeMainSidebar,
        goToChannel,
        openMainSidebar,
    } = ChannelScreen;
    const {
        searchInput,
        switchTeamsButton,
    } = MainSidebar;
    let testChannel;

    beforeAll(async () => {
        const {user, channel} = await Setup.apiInit();
        testChannel = channel;

        const {team: testOtherTeam} = await Team.apiCreateTeam();
        await Team.apiAddUserToTeam(user.id, testOtherTeam.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3412 should close the sidebar menu when selecting the same channel', async () => {
        // # Go to unread channel
        await goToChannel(testChannel.display_name);

        // # Go to the same channel again
        await goToChannel(testChannel.display_name);

        // * Verify sidebar menu is not open
        await expect(MainSidebar.mainSidebar).not.toBeVisible();

        // * Selected channel should remain the same
        await expect(channelNavBarTitle).toHaveText(testChannel.display_name);
    });

    it('MM-T435 should not show switch teams button when jump to search is focused', async () => {
        // # Open main sidebar
        await openMainSidebar();

        // # Tap on search input
        await expect(switchTeamsButton).toBeVisible();
        await searchInput.tap();

        // * Verify switch teams button is not visible
        await expect(switchTeamsButton).not.toBeVisible();

        // # Go back to channel
        await closeMainSidebar();
    });
});
