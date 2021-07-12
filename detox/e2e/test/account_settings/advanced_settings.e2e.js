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
} from '@support/server_api';
import {
    AdvancedSettingsScreen,
    ChannelScreen,
    GeneralSettingsScreen,
} from '@support/ui/screen';

describe('Advanced Settings', () => {
    let townSquareChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T300 should be able to delete documents and data', async () => {
        // # Open advanced settings screen
        await ChannelScreen.openSettingsSidebar();
        await GeneralSettingsScreen.open();
        await AdvancedSettingsScreen.open();

        // # Delete documents and data
        await AdvancedSettingsScreen.deleteDocumentsAndData();

        // * Verify redirects to town square
        await ChannelScreen.toBeVisible();
        await expect(ChannelScreen.channelNavBarTitle).toHaveText(townSquareChannel.display_name);
    });
});
