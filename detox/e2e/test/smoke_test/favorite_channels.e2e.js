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

describe('Favorite Channels', () => {
    const {
        closeMainSidebar,
        goToChannel,
        openMainSidebar,
    } = ChannelScreen;
    const {
        favoriteSwitchFalse,
        favoriteSwitchTrue,
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

    it('MM-T3191 should be able to favorite a channel', async () => {
        // # Open channel info screen
        await goToChannel(testChannel.display_name);
        await ChannelInfoScreen.open();

        // * Verify favorite switch is toggled off
        await expect(favoriteSwitchFalse).toBeVisible();
        await expect(favoriteSwitchTrue).not.toBeVisible();

        // # Toggle on favorite switch
        await favoriteSwitchFalse.tap();

        // * Verify favorite switch is toggled on
        await expect(favoriteSwitchTrue).toBeVisible();
        await expect(favoriteSwitchFalse).not.toBeVisible();

        // * Verify channel appears in favorite channels list
        await ChannelInfoScreen.close();
        await openMainSidebar();
        await expect(element(by.text('FAVORITE CHANNELS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, testChannel.display_name);

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T3192 should be able to un-favorite a channel', async () => {
        // # Open channel info screen
        await goToChannel(testChannel.display_name);
        await ChannelInfoScreen.open();

        // * Verify favorite switch is toggled on
        await expect(favoriteSwitchTrue).toBeVisible();
        await expect(favoriteSwitchFalse).not.toBeVisible();

        // # Toggle off favorite switch
        await favoriteSwitchTrue.tap();

        // * Verify favorite switch is toggled off
        await expect(favoriteSwitchFalse).toBeVisible();
        await expect(favoriteSwitchTrue).not.toBeVisible();

        // * Verify channel does not appear in favorite channels list
        await ChannelInfoScreen.close();
        await openMainSidebar();
        await expect(element(by.text('FAVORITE CHANNELS'))).not.toBeVisible();
        await hasChannelDisplayNameAtIndex(0, testChannel.display_name);

        // # Close main sidebar
        await closeMainSidebar();
    });
});
