// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {loadConfigAndLicense} from '@actions/views/root';
import {handleServerUrlChanged} from '@actions/views/select_server';
import {scheduleExpiredNotification} from '@actions/views/session';
import {getPing, resetPing, setServerVersion} from '@mm-redux/actions/general';
import {login} from '@mm-redux/actions/users';
import {getConfig, getLicense} from '@mm-redux/selectors/entities/general';

import SelectServer from './select_server';

function mapStateToProps(state) {
    const config = getConfig(state);
    const license = getLicense(state);

    return {
        ...state.views.selectServer,
        config,
        deepLinkURL: state.views.root.deepLinkURL,
        hasConfigAndLicense: Object.keys(config).length > 0 && Object.keys(license).length > 0,
        license,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getPing,
            scheduleExpiredNotification,
            handleServerUrlChanged,
            loadConfigAndLicense,
            login,
            resetPing,
            setServerVersion,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectServer);
