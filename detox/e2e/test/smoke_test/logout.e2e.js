// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {SettingsSidebar} from '@support/ui/component';
import {
    ChannelScreen,
    SelectServerScreen,
} from '@support/ui/screen';

describe('Logout', () => {
    beforeAll(async () => {
        const {user} = await Setup.apiInit();

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    it('MM-T3273 should be able to log out', async () => {
        await ChannelScreen.openSettingsSidebar();
        await SettingsSidebar.tapLogoutAction();
        await SelectServerScreen.toBeVisible();
    });
});
