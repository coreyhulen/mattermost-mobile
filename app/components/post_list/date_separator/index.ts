// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {isTimezoneEnabled} from '@mm-redux/selectors/entities/timezone';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';
import {getUserCurrentTimezone} from '@mm-redux/utils/timezone_utils';

import DateSeparator from './date_separator';

import type {GlobalState} from '@mm-redux/types/store';

function mapStateToProps(state: GlobalState) {
    const enableTimezone = isTimezoneEnabled(state);

    let timezone;

    if (enableTimezone) {
        const currentUser = getCurrentUser(state);
        timezone = getUserCurrentTimezone(currentUser.timezone);
    }

    return {
        timezone,
    };
}

export default connect(mapStateToProps)(DateSeparator);

