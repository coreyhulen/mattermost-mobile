// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {userTyping as wsUserTyping} from 'mattermost-redux/actions/websocket';

export function userTyping(channelId, rootId) {
    return (dispatch, getState) => {
        const {websocket} = getState().device;
        if (websocket.connected) {
            wsUserTyping(channelId, rootId)(dispatch, getState());
        }
    };
}
