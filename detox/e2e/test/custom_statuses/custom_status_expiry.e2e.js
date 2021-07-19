// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment-timezone';

import {
    Setup,
    System,
} from '@support/server_api';
import {DateTimePicker} from '@support/ui/component';
import {
    ChannelInfoScreen,
    ChannelScreen,
    CustomStatusScreen,
    MoreDirectMessagesScreen,
    UserProfileScreen,
    ClearAfterScreen,
} from '@support/ui/screen';
import {wait, timeouts} from '@support/utils';

describe('Custom status expiry', () => {
    const {
        closeSettingsSidebar,
        openSettingsSidebar,
    } = ChannelScreen;
    const {
        getCustomStatusSuggestion,
        tapSuggestion,
    } = CustomStatusScreen;
    const defaultCustomStatuses = ['In a meeting', 'Out for lunch', 'Out sick', 'Working from home', 'On a vacation'];
    const defaultStatus = {
        emoji: 'hamburger',
        text: 'Out for lunch',
        duration: 'thirty_minutes',
    };
    let testUser;

    beforeAll(async () => {
        await System.apiUpdateConfig({TeamSettings: {EnableCustomUserStatuses: true}});
    });

    beforeEach(async () => {
        const {user} = await Setup.apiInit();
        testUser = user;

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterEach(async () => {
        await ChannelScreen.logout();
    });

    xit('MM-T4090 RN apps: Custom Status Expiry (mobile)', async () => {// enable only when running locally
        const expiryText = '(Until ' + ClearAfterScreen.getExpiryText(30) + ')';

        // # Open custom status screen
        await openSettingsSidebar();
        await CustomStatusScreen.open();

        // * Check if all the default suggestions are visible
        const isSuggestionPresentPromiseArray = [];
        defaultCustomStatuses.map(async (text) => {
            isSuggestionPresentPromiseArray.push(expect(getCustomStatusSuggestion(text)).toBeVisible());
        });
        await Promise.all(isSuggestionPresentPromiseArray);

        // * Tap a suggestion and check if it is selected
        await tapSuggestion(defaultStatus);
        await expect(element(by.id(`custom_status.duration.${defaultStatus.duration}`))).toBeVisible();

        // # Tap on Done button and check if the modal closes
        await CustomStatusScreen.close();

        // * Check if the selected emoji and text are visible in the sidebar
        await openSettingsSidebar();
        await expect(element(by.text(defaultStatus.text))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${defaultStatus.emoji}`))).toBeVisible();
        await expect(element(by.text(expiryText))).toBeVisible();

        // # Wait for status to get cleared
        await wait(timeouts.ONE_MIN * 31);
        await expect(element(by.text(expiryText))).toBeNotVisible();
        await closeSettingsSidebar();
    }, timeouts.ONE_MIN * 35);

    it('MM-T4091 RN apps: Custom Expiry Visibility (mobile)', async () => {
        const message = 'Hello';
        const expiryText = ClearAfterScreen.getExpiryText(30);

        // # Open custom status screen
        await openSettingsSidebar();
        await CustomStatusScreen.open();

        // * Check if all the default suggestions are visible
        const isSuggestionPresentPromiseArray = [];
        defaultCustomStatuses.map(async (text) => {
            isSuggestionPresentPromiseArray.push(expect(getCustomStatusSuggestion(text)).toBeVisible());
        });
        await Promise.all(isSuggestionPresentPromiseArray);

        // * Tap a suggestion and check if it is selected
        await tapSuggestion(defaultStatus);
        await expect(element(by.id(`custom_status.duration.${defaultStatus.duration}`))).toBeVisible();

        // # Tap on Done button and check if the modal closes
        await CustomStatusScreen.close();

        // * Check if the selected emoji, text and expiry time are visible in the sidebar
        await openSettingsSidebar();
        await expect(element(by.text(defaultStatus.text))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${defaultStatus.emoji}`))).toBeVisible();
        await expect(element(by.text('(Until ' + expiryText + ')'))).toBeVisible();

        // # Close settings sidebar
        await closeSettingsSidebar();

        // # Post a message and check if custom status and expiry time is present in the user popover
        await ChannelScreen.postMessage(message);

        // # Open user profile screen
        await openSettingsSidebar();
        await UserProfileScreen.open();
        await UserProfileScreen.toBeVisible();

        // * Check if custom status is present in the user profile screen and close it
        await expect(element(by.id(`custom_status.emoji.${defaultStatus.emoji}`)).atIndex(0)).toExist();
        await expect(element(by.text(defaultStatus.text).withAncestor(by.id(UserProfileScreen.testID.customStatus)))).toBeVisible();
        await expect(element(by.text('STATUS (UNTIL ' + expiryText + ')'))).toBeVisible();

        await UserProfileScreen.close();

        // # Open the main sidebar and click on more direct messages button
        await ChannelScreen.openMainSidebar();
        await MoreDirectMessagesScreen.open();

        // # Type the logged in user's username and tap it to open the DM
        await MoreDirectMessagesScreen.searchInput.typeText(testUser.username);
        await MoreDirectMessagesScreen.getUserAtIndex(0).tap();

        // # Open the channel info screen
        await ChannelInfoScreen.open();

        // * Check if the custom status is present in the channel info screen and then close the screen
        await expect(element(by.id(`custom_status.emoji.${defaultStatus.emoji}`)).atIndex(0)).toExist();
        await expect(element(by.text(defaultStatus.text).withAncestor(by.id(ChannelInfoScreen.testID.headerCustomStatus)))).toBeVisible();
        await expect(element(by.text('Until ' + expiryText))).toBeVisible();

        await ChannelInfoScreen.close();
    });

    it("MM-T4092 RN apps: Custom Status Expiry - Editing 'Clear After' Time (mobile)", async () => {
        // # Open custom status screen
        await openSettingsSidebar();
        await CustomStatusScreen.open();

        // * Check if all the default suggestions are visible
        const isSuggestionPresentPromiseArray = [];
        defaultCustomStatuses.map(async (text) => {
            isSuggestionPresentPromiseArray.push(expect(getCustomStatusSuggestion(text)).toBeVisible());
        });
        await Promise.all(isSuggestionPresentPromiseArray);

        // * Tap a suggestion and check if it is selected
        await tapSuggestion(defaultStatus);
        await expect(element(by.id(`custom_status.duration.${defaultStatus.duration}`))).toBeVisible();

        // # Click on the Clear After option and check if the modal opens
        await ClearAfterScreen.open();

        // # Select a different expiry time and check if it is shown in Clear After
        await ClearAfterScreen.tapSuggestion('four_hours');
        await ClearAfterScreen.close();

        // Check if selected duration is shown in clear after
        await expect(element(by.id('custom_status.duration.four_hours'))).toBeVisible();

        // * Open Clear After modal
        await ClearAfterScreen.open();

        // * Tap 'Custom' and check if it is selected
        await element(by.text('Custom')).tap();

        // * Check if select date and select time buttons are visible
        expect(element(by.id(ClearAfterScreen.testID.selectDateButton))).toBeVisible();
        expect(element(by.id(ClearAfterScreen.testID.selectTimeButton))).toBeVisible();

        const am_pm = moment().format('A').toString();

        // * Select some time in future in date time picker
        await ClearAfterScreen.openTimePicker();
        await DateTimePicker.changeTime('11', '30');
        await DateTimePicker.tapOkButtonAndroid();

        await ClearAfterScreen.close();
        await CustomStatusScreen.close();

        // # Close settings sidebar
        await closeSettingsSidebar();

        // * Check if the selected emoji and text are visible in the sidebar
        await openSettingsSidebar();
        await expect(element(by.text(defaultStatus.text))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${defaultStatus.emoji}`))).toBeVisible();
        await expect(element(by.text('(Until 11:30 ' + am_pm + ')'))).toBeVisible();

        // # Close settings sidebar
        await closeSettingsSidebar();
    });
});
