// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Platform} from 'react-native';
import createActionBuffer from 'redux-action-buffer';
import {PERSIST, REHYDRATE} from 'redux-persist';
import {ThunkMiddleware} from 'redux-thunk';

import messageRetention from './message_retention';
import createSentryMiddleware from './sentry';
import thunk from './thunk';

export function createMiddlewares(clientOptions: any): ThunkMiddleware[] {
    const {
        enableBuffer,
        enableThunk,
    } = clientOptions;
    const middleware: ThunkMiddleware[] = [];

    if (enableThunk) {
        middleware.push(thunk);
    }

    middleware.push(createSentryMiddleware(), messageRetention);
    if (Platform.OS === 'ios') {
        const iosExtension = require('./ios_extension').default;
        middleware.push(iosExtension);
    }

    if (enableBuffer) {
        middleware.push(createActionBuffer({breaker: REHYDRATE, passthrough: [PERSIST]}));
    }

    return middleware;
}
