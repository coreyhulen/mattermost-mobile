// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {markChannelViewedAndReadOnReconnect} from '@actions/views/channel';
import {setCurrentUserStatusOffline} from '@actions/views/user';
import {init as initWebSocket, close as closeWebSocket} from '@actions/websocket';
import {stopPeriodicStatusUpdates, startPeriodicStatusUpdates} from '@mm-redux/actions/users';
import {getCurrentChannelId} from '@mm-redux/selectors/entities/channels';

import NetworkIndicator from './network';

import type {GlobalState} from '@mm-redux/types/store';

function mapStateToProps(state: GlobalState) {
    const {websocket} = state.requests.general;

    return {
        channelId: getCurrentChannelId(state),
        errorCount: websocket.error,
        status: websocket.status,
    };
}

const mapDispatchToProps = {
    closeWebSocket,
    initWebSocket,
    markChannelViewedAndReadOnReconnect,
    setCurrentUserStatusOffline,
    startPeriodicStatusUpdates,
    stopPeriodicStatusUpdates,
};

export default connect(mapStateToProps, mapDispatchToProps)(NetworkIndicator);
