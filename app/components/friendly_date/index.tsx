// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleProp, Text, ViewStyle} from 'react-native';
import {injectIntl, intlShape} from 'react-intl';

import {DateTypes} from '@constants';
import {isYesterday} from '@utils/datetime';

type Props = {
    intl: typeof intlShape;
    style?: StyleProp<ViewStyle>;
    sourceDate?: number | Date;
    value: number | Date;
};

function FriendlyDate({intl, style, sourceDate, value}: Props) {
    const formattedTime = getFriendlyDate(intl, value, sourceDate);
    return (
        <Text style={style}>{formattedTime}</Text>
    );
}

export function getFriendlyDate(intl: typeof intlShape, inputDate: number | Date, sourceDate?: number | Date): string {
    const today = sourceDate ? new Date(sourceDate) : new Date();
    const date = new Date(inputDate);
    const difference = (today.getTime() - date.getTime()) / 1000;

    // Message: Now
    if (difference < DateTypes.SECONDS.MINUTE) {
        return intl.formatMessage({
            id: 'friendly_date.now',
            defaultMessage: 'Now',
        });
    }

    // Message: Minutes Ago
    if (difference < DateTypes.SECONDS.HOUR) {
        const minutes = Math.floor(difference / DateTypes.SECONDS.MINUTE);
        return intl.formatMessage({
            id: 'friendly_date.minsAgo',
            defaultMessage: '{count} {count, plural, one {min} other {mins}} ago',
        }, {
            count: minutes,
        });
    }

    // Message: Hours Ago
    if (difference < DateTypes.SECONDS.DAY) {
        const hours = Math.floor(difference / DateTypes.SECONDS.HOUR);
        return intl.formatMessage({
            id: 'friendly_date.hoursAgo',
            defaultMessage: '{count} {count, plural, one {hour} other {hours}} ago',
        }, {
            count: hours,
        });
    }

    // Message: Days Ago
    if (difference < DateTypes.SECONDS.DAYS_31) {
        if (isYesterday(date)) {
            return intl.formatMessage({
                id: 'friendly_date.yesterday',
                defaultMessage: 'Yesterday',
            });
        }
        const completedAMonth = today.getMonth() !== date.getMonth() && today.getDate() >= date.getDate();
        if (!completedAMonth) {
            const days = Math.floor(difference / DateTypes.SECONDS.DAY) || 1;
            return intl.formatMessage({
                id: 'friendly_date.daysAgo',
                defaultMessage: '{count} {count, plural, one {day} other {days}} ago',
            }, {
                count: days,
            });
        }
    }

    // Message: Months Ago
    if (difference < DateTypes.SECONDS.DAYS_366) {
        const completedAnYear = today.getFullYear() !== date.getFullYear() &&
            today.getMonth() >= date.getMonth() &&
            today.getDate() >= date.getDate();
        if (!completedAnYear) {
            const months = Math.floor(difference / DateTypes.SECONDS.DAYS_30) || 1;
            return intl.formatMessage({
                id: 'friendly_date.monthsAgo',
                defaultMessage: '{count} {count, plural, one {month} other {months}} ago',
            }, {
                count: months,
            });
        }
    }

    // Message: Years Ago
    const years = Math.floor(difference / DateTypes.SECONDS.DAYS_365) || 1;
    return intl.formatMessage({
        id: 'friendly_date.yearsAgo',
        defaultMessage: '{count} {count, plural, one {year} other {years}} ago',
    }, {
        count: years,
    });
}

export default injectIntl(FriendlyDate);
