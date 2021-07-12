// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Post,
    Setup,
} from '@support/server_api';
import {ChannelScreen} from '@support/ui/screen';

describe('Scrolling', () => {
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

    it('MM-T3147 should scroll to bottom when new messages is received while post input is focused', async () => {
        // # Post a message as sysadmin
        const testMessage = Date.now().toString();
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: testMessage,
        });

        // * Verify message is visible
        await expect(element(by.text(testMessage))).toBeVisible();

        // # Tap on post input to focus and bring up keyboard
        await ChannelScreen.postInput.tap();

        // * Verify message is still visible
        await expect(element(by.text(testMessage))).toBeVisible();
    });
});
