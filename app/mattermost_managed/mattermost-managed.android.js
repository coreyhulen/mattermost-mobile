// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules, DeviceEventEmitter} from 'react-native';

import {emptyFunction} from '@utils/general';

const {MattermostManaged} = NativeModules;

const listeners = [];
let cachedConfig = {};
let LocalAuth;
let JailMonkey;

export default {
    addEventListener: (name, callback) => {
        const listener = DeviceEventEmitter.addListener(name, (config) => {
            cachedConfig = config;
            if (callback && typeof callback === 'function') {
                callback(config);
            }
        });

        listeners.push(listener);
        return listener;
    },
    clearListeners: () => {
        listeners.forEach((listener) => {
            listener.remove();
        });
    },
    removeEventListener: (listenerId) => {
        const index = listeners.findIndex((listener) => listener === listenerId);
        if (index !== -1) {
            listenerId.remove();
            listeners.splice(index, 1);
        }
    },
    authenticate: (opts) => {
        if (!LocalAuth) {
            LocalAuth = require('react-native-local-auth');
        }

        return LocalAuth.auth(opts);
    },
    blurAppScreen: emptyFunction,
    appGroupIdentifier: null,
    hasSafeAreaInsets: null,
    isRunningInSplitView: MattermostManaged.isRunningInSplitView,
    getConfig: async () => {
        try {
            cachedConfig = await MattermostManaged.getConfig();
        } catch (error) {
            // do nothing...
        }

        return cachedConfig;
    },
    getCachedConfig: () => {
        return cachedConfig;
    },
    goToSecuritySettings: MattermostManaged.goToSecuritySettings,
    isDeviceSecure: async () => {
        try {
            if (!LocalAuth) {
                LocalAuth = require('react-native-local-auth');
            }

            return await LocalAuth.isDeviceSecure();
        } catch (err) {
            return false;
        }
    },
    isTrustedDevice: () => {
        if (__DEV__) {
            return true;
        }

        if (!JailMonkey) {
            JailMonkey = require('jail-monkey');
        }

        return JailMonkey.trustFall();
    },
    supportsFaceId: async () => false,
    quitApp: MattermostManaged.quitApp,
};
