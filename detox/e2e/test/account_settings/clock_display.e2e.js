// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import moment from 'moment-timezone';

import {
    Channel,
    Post,
    Setup,
    System,
    User,
} from '@support/server_api';
import {
    ChannelScreen,
    ClockDisplaySettingsScreen,
    DisplaySettingsScreen,
    GeneralSettingsScreen,
} from '@support/ui/screen';
import {isAndroid, isIos} from '@support/utils';

describe('Clock Display', () => {
    const testDate = Date.UTC(new Date().getFullYear() + 1, 0, 5, 14, 37); // Jan 5, 2:37pm
    const testTimezone = 'UTC';
    const testFullDate = moment(testDate).tz(testTimezone).format();
    const testMilitaryTime = moment(testDate).tz(testTimezone).format('HH:mm');
    const testNormalTime = moment(testDate).tz(testTimezone).format('h:mm A');
    const testMessage = `Hello from ${testFullDate}, ${testTimezone}`;
    let testChannel;

    beforeAll(async () => {
        // # Enable timezone
        await System.apiUpdateConfig({DisplaySettings: {ExperimentalTimezone: true}});

        const {team, user} = await Setup.apiInit();
        ({channel: testChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Set user's timezone
        await User.apiPatchUser(user.id, {timezone: {automaticTimezone: '', manualTimezone: testTimezone, useAutomaticTimezone: 'false'}});

        // # Post message with a future date as sysadmin
        await User.apiAdminLogin();
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: testMessage,
            createAt: testDate,
        });

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T291 should be able to set clock display to 12-hour', async () => {
        // # Set clock display to normal (12-hour)
        await setClockDisplayTo('normal');

        // * Verify clock display is normal
        await verifyClockDisplay(testChannel, testMessage, testNormalTime);
    });

    it('MM-T292 should be able to set clock display to 24-hour', async () => {
        // # Set clock display to military (24-hour)
        await setClockDisplayTo('military');

        // * Verify clock display is military
        await verifyClockDisplay(testChannel, testMessage, testMilitaryTime);
    });
});

async function setClockDisplayTo(clockKey) {
    const {
        clockModalSaveButton,
        getClockActionFor,
    } = ClockDisplaySettingsScreen;

    // # Open clock display settings screen
    await ChannelScreen.openSettingsSidebar();
    await GeneralSettingsScreen.open();
    await DisplaySettingsScreen.open();
    await ClockDisplaySettingsScreen.open();

    // # Tap on clock option
    await getClockActionFor(clockKey).tap();

    // # Tap on Save button if Android
    if (isAndroid()) {
        await clockModalSaveButton.tap();
    }

    // # Go back to channel
    await ClockDisplaySettingsScreen.back();
    if (isIos()) {
        await DisplaySettingsScreen.back();
    }
    await GeneralSettingsScreen.close();
}

async function verifyClockDisplay(testChannel, testMessage, clockDisplay) {
    // * Verify clock display
    const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
    const {postListPostItemHeaderDateTime} = await ChannelScreen.getPostListPostItem(post.id, testMessage);
    await expect(postListPostItemHeaderDateTime).toHaveText(clockDisplay);
}
