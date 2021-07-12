// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {updateUser} from '@actions/views/edit_profile';
import {getSupportedTimezones} from '@mm-redux/actions/general';
import {getSupportedTimezones as getTimezones} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getUserTimezone} from '@mm-redux/selectors/entities/timezone';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';

import Timezone from './timezone';

function mapStateToProps(state) {
    const timezones = getTimezones(state);
    const currentUser = getCurrentUser(state) || {};
    const userTimezone = getUserTimezone(state, currentUser.id);

    return {
        user: currentUser,
        theme: getTheme(state),
        userTimezone,
        timezones,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getSupportedTimezones,
            updateUser,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Timezone);
