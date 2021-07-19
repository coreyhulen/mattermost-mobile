// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class DateTimePicker {
    changeTime = async (hour, minute) => {
        const keyboardIconButton = element(
            by.type('androidx.appcompat.widget.AppCompatImageButton'),
        );

        await keyboardIconButton.tap();

        const hourTextinput = element(
            by.type('androidx.appcompat.widget.AppCompatEditText'),
        ).atIndex(0);

        const minuteTextinput = element(
            by.type('androidx.appcompat.widget.AppCompatEditText'),
        ).atIndex(1);

        await hourTextinput.replaceText(hour);
        await minuteTextinput.replaceText(minute);
    }

    tapCancelButtonAndroid = async () => {
        await element(by.text('Cancel')).tap();
    }

    tapOkButtonAndroid = async () => {
        await element(by.text('OK')).tap();
    }
}

const dateTimePicker = new DateTimePicker();
export default dateTimePicker;
