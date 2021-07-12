// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {
    AboutScreen,
    ChannelScreen,
    GeneralSettingsScreen,
} from '@support/ui/screen';

describe('About', () => {
    beforeAll(async () => {
        const {user} = await Setup.apiInit();

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3264 should be able to display about info', async () => {
        const {
            aboutAppVersion,
            aboutBuildDateTitle,
            aboutBuildDateValue,
            aboutBuildHashTitle,
            aboutBuildHashValue,
            aboutBuildHashEnterpriseTitle,
            aboutBuildHashEnterpriseValue,
            aboutDatabase,
            aboutLicensee,
            aboutLogo,
            aboutScrollView,
            aboutServerVersion,
            aboutSubtitle,
            aboutTitle,
        } = AboutScreen;

        // # Open about screen
        await ChannelScreen.openSettingsSidebar();
        await GeneralSettingsScreen.open();
        await AboutScreen.open();

        // * Verify about info
        await expect(aboutLogo).toBeVisible();
        await expect(aboutSubtitle).toBeVisible();
        await expect(aboutTitle).toBeVisible();
        await expect(aboutSubtitle).toBeVisible();
        await expect(aboutAppVersion).toBeVisible();
        await expect(aboutServerVersion).toBeVisible();
        await expect(aboutDatabase).toBeVisible();
        await expect(aboutLicensee).toBeVisible();
        await aboutScrollView.scrollTo('bottom');
        await expect(aboutBuildHashTitle).toBeVisible();
        await expect(aboutBuildHashValue).toBeVisible();
        await expect(aboutBuildHashEnterpriseTitle).toBeVisible();
        await expect(aboutBuildHashEnterpriseValue).toBeVisible();
        await expect(aboutBuildDateTitle).toBeVisible();
        await expect(aboutBuildDateValue).toBeVisible();

        // # Go back to channel
        await AboutScreen.back();
        await GeneralSettingsScreen.close();
    });
});
