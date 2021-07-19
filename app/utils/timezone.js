// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getTimeZone} from 'react-native-localize';
import moment from 'moment-timezone';

export function getDeviceTimezone() {
    return getTimeZone();
}

export function getDeviceUtcOffset() {
    return moment().utcOffset();
}

export function getUtcOffsetForTimeZone(timezone) {
    return moment.tz(timezone).utcOffset();
}

export function getCurrentMomentForTimezone(timezone) {
    return timezone ? moment.tz(timezone) : moment();
}
