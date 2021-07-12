// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {
    ChannelInfoScreen,
    ChannelNotificationPreferenceScreen,
    ChannelScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';
import {isAndroid} from '@support/utils';

describe('Channel Notification Preference', () => {
    let testChannel;

    beforeAll(async () => {
        const {user, channel} = await Setup.apiInit();
        testChannel = channel;

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    beforeEach(async () => {
        // # Go to channel
        await ChannelScreen.goToChannel(testChannel.display_name);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    afterEach(async () => {
        // # Close channel info screen
        await ChannelInfoScreen.close();
    });

    it('MM-T3375_1 should display Mobile Notifications option for non-DM Channels', async () => {
        // # Open on notification preference screen
        await ChannelInfoScreen.open();
        await ChannelNotificationPreferenceScreen.open();

        const {
            titleText,
            headerText,
            optionDefaultText,
            optionAllText,
            optionMentionsText,
            optionNeverText,
        } = ChannelNotificationPreferenceScreen;

        // * Verify title, header, and options
        await expect(element(by.text(titleText))).toBeVisible();
        await expect(element(by.text(isAndroid() ? headerText : headerText.toUpperCase()))).toBeVisible();
        await expect(element(by.text(`${optionDefaultText} (Mentions)`))).toBeVisible();
        await expect(element(by.text(optionAllText))).toBeVisible();
        await expect(element(by.text(optionMentionsText))).toBeVisible();
        await expect(element(by.text(optionNeverText))).toBeVisible();

        // # Tap on back button
        ChannelNotificationPreferenceScreen.back();
    });

    it('MM-T3375_2 should not display Mobile Notifications option for DM Channel', async () => {
        // # Open more direct messages screen
        await ChannelScreen.openMainSidebar();
        await MoreDirectMessagesScreen.open();

        const {
            getUserAtIndex,
            startButton,
        } = MoreDirectMessagesScreen;

        // # Select 1 profile
        await getUserAtIndex(0).tap();

        // # Create a DM with selected profile
        await startButton.tap();

        // # Open channel info screen
        await ChannelInfoScreen.open();

        // * Verify Mobile Notifications is not displayed
        await expect(ChannelInfoScreen.notificationPreferenceAction).not.toBeVisible();
    });

    it('MM-T3377 should be able to select For all activity option and display All next to Mobile Notifications', async () => {
        // # Open on notification preference screen
        await ChannelInfoScreen.open();
        await ChannelNotificationPreferenceScreen.open();

        // # Tap on For all activity option
        await element(by.text(ChannelNotificationPreferenceScreen.optionAllText)).tap();

        // # Tap on back button
        ChannelNotificationPreferenceScreen.back();

        // * Verify notification level All abbreviation
        await ChannelInfoScreen.toBeVisible();
        await expect(element(by.id(ChannelInfoScreen.testID.notificationPreferenceAction).withDescendant(by.text('All')))).toBeVisible();
    });

    it('MM-T3378 should be able to select Only mentions and direct messages option and display Mentions next to Mobile Notifications', async () => {
        // # Open on notification preference screen
        await ChannelInfoScreen.open();
        await ChannelNotificationPreferenceScreen.open();

        // # Tap on For all activity option
        await element(by.text(ChannelNotificationPreferenceScreen.optionMentionsText)).tap();

        // # Tap on back button
        ChannelNotificationPreferenceScreen.back();

        // * Verify notification level Mentions abbreviation
        await ChannelInfoScreen.toBeVisible();
        await expect(element(by.id(ChannelInfoScreen.testID.notificationPreferenceAction).withDescendant(by.text('Mentions')))).toBeVisible();
    });

    it('MM-T3379 should be able to select Never option and display Never next to Mobile Notifications', async () => {
        // # Open on notification preference screen
        await ChannelInfoScreen.open();
        await ChannelNotificationPreferenceScreen.open();

        // # Tap on For all activity option
        await element(by.text(ChannelNotificationPreferenceScreen.optionNeverText)).tap();

        // # Tap on back button
        ChannelNotificationPreferenceScreen.back();

        // * Verify notification level Never abbreviation
        await ChannelInfoScreen.toBeVisible();
        await expect(element(by.id(ChannelInfoScreen.testID.notificationPreferenceAction).withDescendant(by.text('Never')))).toBeVisible();
    });
});
