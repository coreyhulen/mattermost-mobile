// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {unsetCustomStatus} from '@actions/views/custom_status';
import {setStatus} from '@mm-redux/actions/users';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUser, getStatusForUserId} from '@mm-redux/selectors/entities/users';
import {isCustomStatusEnabled, isCustomStatusExpired, isCustomStatusExpirySupported, makeGetCustomStatus} from '@selectors/custom_status';

import {logout} from 'app/actions/views/user';

import SettingsSidebar from './settings_sidebar';

function makeMapStateToProps() {
    const getCustomStatus = makeGetCustomStatus();
    return (state) => {
        const currentUser = getCurrentUser(state) || {};
        const status = getStatusForUserId(state, currentUser.id);

        const customStatusEnabled = isCustomStatusEnabled(state);
        const customStatus = customStatusEnabled ? getCustomStatus(state) : undefined;
        return {
            currentUser,
            locale: currentUser?.locale,
            status,
            theme: getTheme(state),
            isCustomStatusEnabled: customStatusEnabled,
            customStatus,
            isCustomStatusExpired: customStatusEnabled ? isCustomStatusExpired(state, customStatus) : true,
            isCustomStatusExpirySupported: customStatusEnabled ? isCustomStatusExpirySupported(state) : false,
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            logout,
            setStatus,
            unsetCustomStatus,
        }, dispatch),
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps, null, {forwardRef: true})(SettingsSidebar);
