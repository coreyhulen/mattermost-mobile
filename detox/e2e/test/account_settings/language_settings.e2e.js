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
    User,
} from '@support/server_api';
import {ChannelScreen} from '@support/ui/screen';

describe('Language Settings', () => {
    let testUser;
    let townSquareChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();
        testUser = user;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T304 no crash when setting language to zh-TW (Chinese Traditional)', async () => { // related issue https://mattermost.atlassian.net/browse/MM-35329
        // # Set user's locale
        await User.apiPatchUser(testUser.id, {locale: 'zh-TW'});

        // # Open channel screen
        await ChannelScreen.open(testUser);

        // * Verify town square channel loads
        await ChannelScreen.toBeVisible();
        await expect(ChannelScreen.channelNavBarTitle).toHaveText(townSquareChannel.display_name);
    });
});
