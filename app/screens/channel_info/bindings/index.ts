// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators, Dispatch, ActionCreatorsMapObject} from 'redux';

import {getAppsBindings} from '@mm-redux/selectors/entities/apps';
import {AppBindingLocations} from '@mm-redux/constants/apps';
import {getCurrentChannel} from '@mm-redux/selectors/entities/channels';
import {GlobalState} from '@mm-redux/types/store';
import {ActionResult, GenericAction, ActionFunc} from '@mm-redux/types/actions';
import {AppCallRequest} from '@mm-redux/types/apps';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';

import {appsEnabled} from '@utils/apps';
import {doAppCall} from '@actions/apps';

import Bindings from './bindings';

function mapStateToProps(state: GlobalState) {
    const apps = appsEnabled(state);
    const currentChannel = getCurrentChannel(state) || {};
    const bindings = apps ? getAppsBindings(state, AppBindingLocations.CHANNEL_HEADER_ICON) : [];
    const currentUser = getCurrentUser(state) || {};

    return {
        bindings,
        currentChannel,
        currentUser,
        appsEnabled: apps,
    };
}

type Actions = {
    doAppCall: (call: AppCallRequest, intl: any) => Promise<ActionResult>;
}

function mapDispatchToProps(dispatch: Dispatch<GenericAction>) {
    return {
        actions: bindActionCreators<ActionCreatorsMapObject<ActionFunc>, Actions>({
            doAppCall,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(Bindings);
