// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {refreshChannelWithRetry} from '@actions/views/channel';
import {RequestStatus} from '@mm-redux/constants';
import {getCurrentChannelId} from '@mm-redux/selectors/entities/channels';

import RetryBarIndicator from './retry_bar_indicator';

import type {GlobalState} from '@mm-redux/types/store';

function mapStateToProps(state: GlobalState) {
    const {websocket: websocketRequest} = state.requests.general;
    const channelId = getCurrentChannelId(state);
    const webSocketOnline = websocketRequest.status === RequestStatus.SUCCESS;

    const failed = state.views.channel.retryFailed && webSocketOnline;

    return {
        channelId,
        failed,
    };
}

const mapDispatchToProps = {
    refreshChannelWithRetry,
};

export default connect(mapStateToProps, mapDispatchToProps)(RetryBarIndicator);
