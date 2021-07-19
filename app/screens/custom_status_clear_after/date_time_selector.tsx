// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment, {Moment} from 'moment-timezone';
import React, {useState} from 'react';
import {View, Button, Platform} from 'react-native';
import {useSelector} from 'react-redux';

import Preferences from '@mm-redux/constants/preferences';
import {getBool} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserTimezone} from '@mm-redux/selectors/entities/timezone';
import {Theme} from '@mm-redux/types/preferences';
import {GlobalState} from '@mm-redux/types/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {getCurrentMomentForTimezone, getUtcOffsetForTimeZone} from '@utils/timezone';

type Props = {
    theme: Theme;
    handleChange: (currentDate: Moment) => void;
}

type AndroidMode = 'date' | 'time';

const CUSTOM_STATUS_TIME_PICKER_INTERVALS_IN_MINUTES = 30;
export function getRoundedTime(value: Moment) {
    const roundedTo = CUSTOM_STATUS_TIME_PICKER_INTERVALS_IN_MINUTES;
    const start = moment(value);
    const diff = start.minute() % roundedTo;
    if (diff === 0) {
        return value;
    }
    const remainder = roundedTo - diff;
    return start.add(remainder, 'm').seconds(0).milliseconds(0);
}

const DateTimeSelector = (props: Props) => {
    const {theme} = props;
    const styles = getStyleSheet(theme);
    const militaryTime = useSelector((state: GlobalState) => getBool(state, Preferences.CATEGORY_DISPLAY_SETTINGS, 'use_military_time'));
    const timezone = useSelector(getCurrentUserTimezone);
    const currentTime = getCurrentMomentForTimezone(timezone);
    const timezoneOffSetInMinutes = timezone ? getUtcOffsetForTimeZone(timezone) : undefined;

    const minimumDate = getRoundedTime(currentTime);

    const [date, setDate] = useState<Moment>(minimumDate);
    const [mode, setMode] = useState<AndroidMode>('date');
    const [show, setShow] = useState<boolean>(false);

    const onChange = (_: React.ChangeEvent<HTMLInputElement>, selectedDate: Date) => {
        const currentDate = selectedDate || date;
        setShow(Platform.OS === 'ios');
        setDate(moment(currentDate));
        props.handleChange(moment(currentDate));
    };

    const showMode = (currentMode: AndroidMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
        props.handleChange(moment(date));
    };

    const showTimepicker = () => {
        showMode('time');
        props.handleChange(moment(date));
    };

    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <Button
                    testID={'clear_after.menu_item.date_and_time.button.date'}
                    onPress={showDatepicker}
                    title='Select Date'
                    color={theme.buttonBg}
                />
                <Button
                    testID={'clear_after.menu_item.date_and_time.button.time'}
                    onPress={showTimepicker}
                    title='Select Time'
                    color={theme.buttonBg}
                />
            </View>
            {show && (
                <DateTimePicker
                    testID='dateTimePicker'
                    value={date.toDate()}
                    mode={mode}
                    is24Hour={militaryTime}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChange}
                    textColor={theme.centerChannelColor}
                    minimumDate={minimumDate.toDate()}
                    minuteInterval={CUSTOM_STATUS_TIME_PICKER_INTERVALS_IN_MINUTES}
                    timeZoneOffsetInMinutes={timezoneOffSetInMinutes}
                />
            )}
        </View>
    );
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
            paddingTop: 10,
            backgroundColor: theme.centerChannelBg,
        },
        buttonContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            marginBottom: 10,
        },
    };
});
export default DateTimeSelector;
