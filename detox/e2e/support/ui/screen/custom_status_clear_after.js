// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment-timezone';

import {CustomStatusScreen} from '@support/ui/screen';

class ClearAfterScreen {
    testID = {
        clearAfterScreen: 'clear_after.screen',
        doneButton: 'clear_after.done.button',
        menuItemPrefix: 'clear_after.menu_item.',
        selectDateButton: 'clear_after.menu_item.date_and_time.button.date',
        selectTimeButton: 'clear_after.menu_item.date_and_time.button.time',
    }

    clearAfterScreen = element(by.id(this.testID.clearAfterScreen));
    doneButton = element(by.id(this.testID.doneButton));
    selectDateButton = element(by.id(this.testID.selectDateButton));
    selectTimeButton = element(by.id(this.testID.selectTimeButton));

    getClearAfterMenuItem = (duration) => {
        const menuItemID = `${this.testID.menuItemPrefix}${duration}`;
        return element(by.id(menuItemID));
    }

    toBeVisible = async () => {
        await expect(this.clearAfterScreen).toBeVisible();

        return this.clearAfterScreen;
    }

    open = async () => {
        // # Open clear after screen
        await CustomStatusScreen.openClearAfterModal();

        return this.toBeVisible();
    }

    tapSuggestion = async (duration) => {
        await this.getClearAfterMenuItem(duration).tap();
    }

    openDatePicker = async () => {
        await this.selectDateButton.tap();
    }

    openTimePicker = async () => {
        await this.selectTimeButton.tap();
    }

    close = async () => {
        await this.doneButton.tap();
        return expect(this.clearAfterScreen).not.toBeVisible();
    }

    getExpiryText = (minutes) => {
        const currentMomentTime = moment();
        const expiryMomentTime = currentMomentTime.clone().add(minutes, 'm');
        const tomorrowEndTime = currentMomentTime.clone().add(1, 'day').endOf('day');
        const todayEndTime = currentMomentTime.clone().endOf('day');

        let isTomorrow = false;
        let isToday = false;

        if (expiryMomentTime.isSame(todayEndTime)) {
            isToday = true;
        }
        if (expiryMomentTime.isAfter(todayEndTime) && expiryMomentTime.isSameOrBefore(tomorrowEndTime)) {
            isTomorrow = true;
        }

        const showTime = expiryMomentTime.format('h:mm A');
        const showTomorrow = isTomorrow ? 'Tomorrow at ' : '';
        const showToday = isToday ? 'Today' : '';

        let expiryText = '';
        expiryText += showToday;
        expiryText += showTomorrow;
        expiryText += showTime;
        return expiryText;
    }
}

const clearAfterScreen = new ClearAfterScreen();
export default clearAfterScreen;
