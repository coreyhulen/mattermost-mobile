// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {
    ChannelInfoScreen,
    ChannelScreen,
} from '@support/ui/screen';

describe('Mute Channels', () => {
    const {
        closeMainSidebar,
        goToChannel,
        openMainSidebar,
    } = ChannelScreen;
    const {
        muteSwitchFalse,
        muteSwitchTrue,
    } = ChannelInfoScreen;
    const {hasChannelDisplayNameAtIndex} = MainSidebar;
    let testChannel;

    beforeAll(async () => {
        const {channel, user} = await Setup.apiInit();
        testChannel = channel;

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3193 should be able to mute a channel', async () => {
        // # Open channel info screen
        await goToChannel(testChannel.display_name);
        await ChannelInfoScreen.open();

        // * Verify favorite switch is toggled off
        await expect(muteSwitchFalse).toBeVisible();
        await expect(muteSwitchTrue).not.toBeVisible();

        // # Toggle on mute switch
        await muteSwitchFalse.tap();

        // * Verify mute switch is toggled on
        await expect(muteSwitchTrue).toBeVisible();
        await expect(muteSwitchFalse).not.toBeVisible();

        // * Verify channel appears last in the channels list
        await ChannelInfoScreen.close();
        await openMainSidebar();
        await hasChannelDisplayNameAtIndex(2, testChannel.display_name);

        // # Close main sidebar
        await closeMainSidebar();
    });
});
