// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';

import Pluggable from './bindings';
import {GlobalState} from '@mm-redux/types/store';
import {getAppsBindings} from '@mm-redux/selectors/entities/apps';
import {AppBindingLocations} from '@mm-redux/constants/apps';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';
import {doAppCall} from '@actions/apps';
import {bindActionCreators, Dispatch} from 'redux';
import {appsEnabled} from '@utils/apps';

function mapStateToProps(state: GlobalState) {
    const apps = appsEnabled(state);
    const bindings = apps ? getAppsBindings(state, AppBindingLocations.POST_MENU_ITEM) : [];
    const currentUser = getCurrentUser(state);

    return {
        theme: getTheme(state),
        bindings,
        currentUser,
        appsEnabled: apps,
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        actions: bindActionCreators({
            doAppCall,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(Pluggable);
