// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment-timezone';
import React from 'react';
import {Text, TextStyle} from 'react-native';
import {useSelector} from 'react-redux';

import FormattedDate from '@components/formatted_date';
import FormattedText from '@components/formatted_text';
import FormattedTime from '@components/formatted_time';
import Preferences from '@mm-redux/constants/preferences';
import {getBool} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserTimezone} from '@mm-redux/selectors/entities/timezone';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {getCurrentMomentForTimezone} from '@utils/timezone';

import {Theme} from '@mm-redux/types/preferences';
import {GlobalState} from '@mm-redux/types/store';

type Props = {
    theme: Theme;
    time: Date;
    textStyles?: TextStyle;
    testID?: string;
    showPrefix?: boolean;
    withinBrackets?: boolean;
    showToday?: boolean;
    showTimeCompulsory?: boolean;
}

const CustomStatusExpiry = ({time, theme, textStyles = {}, showPrefix, withinBrackets, testID = '', showTimeCompulsory, showToday}: Props) => {
    const timezone = useSelector(getCurrentUserTimezone);
    const styles = createStyleSheet(theme);
    const militaryTime = useSelector((state: GlobalState) => getBool(state, Preferences.CATEGORY_DISPLAY_SETTINGS, 'use_military_time'));
    const currentMomentTime = getCurrentMomentForTimezone(timezone);

    const expiryMomentTime = timezone ? moment(time).tz(timezone) : moment(time);

    const plusSixDaysEndTime = currentMomentTime.clone().add(6, 'days').endOf('day');
    const tomorrowEndTime = currentMomentTime.clone().add(1, 'day').endOf('day');
    const todayEndTime = currentMomentTime.clone().endOf('day');
    const isCurrentYear = currentMomentTime.get('y') === expiryMomentTime.get('y');

    let dateComponent;
    if (showToday && expiryMomentTime.isSameOrBefore(todayEndTime)) {
        dateComponent = (
            <Text>
                <FormattedText
                    id='custom_status.expiry_time.today'
                    defaultMessage='Today'
                />
                {' '}
                <FormattedText
                    id='custom_status.expiry.at'
                    defaultMessage='at'
                />
                {' '}
            </Text>
        );
    } else if (expiryMomentTime.isSame(todayEndTime)) {
        dateComponent = (
            <FormattedText
                id='custom_status.expiry_time.today'
                defaultMessage='Today'
            />
        );
    } else if (expiryMomentTime.isAfter(todayEndTime) && expiryMomentTime.isSameOrBefore(tomorrowEndTime)) {
        dateComponent = (
            <Text>
                <FormattedText
                    id='custom_status.expiry_time.tomorrow'
                    defaultMessage='Tomorrow'
                />
                {' '}
                <FormattedText
                    id='custom_status.expiry.at'
                    defaultMessage='at'
                />
                {' '}
            </Text>
        );
    } else if (expiryMomentTime.isAfter(tomorrowEndTime)) {
        let format = 'dddd';
        if (expiryMomentTime.isAfter(plusSixDaysEndTime) && isCurrentYear) {
            format = 'MMM DD';
        } else if (!isCurrentYear) {
            format = 'MMM DD, YYYY';
        }

        dateComponent = (
            <FormattedDate
                format={format}
                timezone={timezone}
                value={expiryMomentTime.toDate()}
            />
        );

        dateComponent = showTimeCompulsory ? (
            <Text>
                {dateComponent}
                {' '}
                <FormattedText
                    id='custom_status.expiry.at'
                    defaultMessage='at'
                />
                {' '}
            </Text>
        ) : dateComponent;
    }

    const useTime = showTimeCompulsory || !(expiryMomentTime.isSame(todayEndTime) || expiryMomentTime.isAfter(tomorrowEndTime));

    return (
        <Text
            testID={testID}
            style={[styles.text, textStyles]}
        >
            {withinBrackets && '('}
            {showPrefix && (
                <FormattedText
                    id='custom_status.expiry.until'
                    defaultMessage='Until'
                />
            )}
            {showPrefix && ' '}
            {dateComponent}
            {useTime && (
                <FormattedTime
                    isMilitaryTime={militaryTime}
                    timezone={timezone || ''}
                    value={expiryMomentTime.toDate()}
                />
            )}
            {withinBrackets && ')'}
        </Text>
    );
};

export default CustomStatusExpiry;

const createStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        text: {
            fontSize: 15,
            color: theme.centerChannelColor,
        },
    };
});
