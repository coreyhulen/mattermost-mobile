// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {
    ChannelScreen,
    RecentMentionsScreen,
} from '@support/ui/screen';

describe('Recent Mentions', () => {
    beforeAll(async () => {
        const {user} = await Setup.apiInit();

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3372 should be able display empty recent mentions', async () => {
        // # Open recent mentions screen
        await ChannelScreen.openSettingsSidebar();
        await RecentMentionsScreen.open();

        // * Verify empty recent mentions
        await expect(element(by.text('No Mentions yet'))).toBeVisible();
        await expect(element(by.text('Messages where someone mentions you or includes your trigger words are saved here.'))).toBeVisible();

        // # Go back to channel
        await RecentMentionsScreen.close();
    });
});
