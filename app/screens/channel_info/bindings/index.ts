// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators, Dispatch, ActionCreatorsMapObject} from 'redux';

import {getAppsBindings} from '@mm-redux/selectors/entities/apps';
import {AppBindingLocations} from '@mm-redux/constants/apps';
import {getCurrentChannel} from '@mm-redux/selectors/entities/channels';
import {GlobalState} from '@mm-redux/types/store';
import {GenericAction, ActionFunc} from '@mm-redux/types/actions';
import {DoAppCall, PostEphemeralCallResponseForChannel} from 'types/actions/apps';

import {appsEnabled} from '@utils/apps';
import {doAppCall, postEphemeralCallResponseForChannel} from '@actions/apps';
import {handleGotoLocation} from '@mm-redux/actions/integrations';

import Bindings from './bindings';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';

function mapStateToProps(state: GlobalState) {
    const apps = appsEnabled(state);
    const currentChannel = getCurrentChannel(state) || {};
    const bindings = apps ? getAppsBindings(state, AppBindingLocations.CHANNEL_HEADER_ICON) : [];

    return {
        bindings,
        currentChannel,
        appsEnabled: apps,
        currentTeamId: getCurrentTeamId(state),
    };
}

type Actions = {
    doAppCall: DoAppCall;
    postEphemeralCallResponseForChannel: PostEphemeralCallResponseForChannel;
}

function mapDispatchToProps(dispatch: Dispatch<GenericAction>) {
    return {
        actions: bindActionCreators<ActionCreatorsMapObject<ActionFunc>, Actions>({
            doAppCall,
            postEphemeralCallResponseForChannel,
            handleGotoLocation,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(Bindings);
