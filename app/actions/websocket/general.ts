// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {GeneralTypes} from '@mm-redux/action_types';
import {General} from '@mm-redux/constants';
import {GenericAction} from '@mm-redux/types/actions';
import {WebSocketMessage} from '@mm-redux/types/websocket';
import EventEmitter from '@mm-redux/utils/event_emitter';

export function handleConfigChangedEvent(msg: WebSocketMessage): GenericAction {
    const data = msg.data.config;

    EventEmitter.emit(General.CONFIG_CHANGED, data);
    return {
        type: GeneralTypes.CLIENT_CONFIG_RECEIVED,
        data,
    };
}

export function handleLicenseChangedEvent(msg: WebSocketMessage): GenericAction {
    const data = msg.data.license;

    return {
        type: GeneralTypes.CLIENT_LICENSE_RECEIVED,
        data,
    };
}
