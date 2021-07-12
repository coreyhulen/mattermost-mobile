// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import semver from 'semver/preload';

import * as I18n from '@i18n';
import PushNotification from '@init/push_notifications';
import EventEmitter from '@mm-redux/utils/event_emitter';
import intitialState from '@store/initial_state';
import Store from '@store/store';

import mattermostBucket from 'app/mattermost_bucket';

import GlobalEventHandler from './global_event_handler';

jest.mock('app/init/credentials', () => ({
    getCurrentServerUrl: jest.fn().mockResolvedValue(''),
    getAppCredentials: jest.fn(),
    removeAppCredentials: jest.fn(),
}));

jest.mock('@utils/error_handling', () => ({
    default: {
        initializeErrorHandling: jest.fn(),
    },
}));

jest.mock('@mm-redux/actions/general', () => ({
    setAppState: jest.fn(),
    setServerVersion: jest.fn().mockReturnValue('setServerVersion'),
}));

jest.mock('@actions/views/root', () => ({
    startDataCleanup: jest.fn(),
    loadConfigAndLicense: jest.fn().mockReturnValue('loadConfigAndLicense'),
}));

const mockStore = configureMockStore([thunk]);
const store = mockStore(intitialState);
Store.redux = store;

// TODO: Add Android test as part of https://mattermost.atlassian.net/browse/MM-17110
describe('GlobalEventHandler', () => {
    it('should clear notifications and reset moment locale on logout', async () => {
        const clearNotifications = jest.spyOn(PushNotification, 'clearNotifications');
        const resetMomentLocale = jest.spyOn(I18n, 'resetMomentLocale');
        const removePreference = jest.spyOn(mattermostBucket, 'removePreference');
        const removeFile = jest.spyOn(mattermostBucket, 'removeFile');

        await GlobalEventHandler.onLogout();
        expect(clearNotifications).toHaveBeenCalled();
        expect(resetMomentLocale).toHaveBeenCalled();
        expect(removePreference).toHaveBeenCalledWith('cert');
        expect(removeFile).toHaveBeenCalledWith('entities');
    });

    it('should call onAppStateChange after configuration', () => {
        const onAppStateChange = jest.spyOn(GlobalEventHandler, 'onAppStateChange');

        Store.redux = store;
        GlobalEventHandler.configure({launchApp: jest.fn()});
        expect(Store.redux).not.toBeNull();
        expect(onAppStateChange).toHaveBeenCalledWith('active');
    });

    it('should handle onAppStateChange to active if the store set', () => {
        const appActive = jest.spyOn(GlobalEventHandler, 'appActive');
        const appInactive = jest.spyOn(GlobalEventHandler, 'appInactive');
        expect(Store.redux).not.toBeNull();

        GlobalEventHandler.onAppStateChange('active');
        expect(appActive).toHaveBeenCalled();
        expect(appInactive).not.toHaveBeenCalled();
    });

    it('should handle onAppStateChange to background if the store set', () => {
        const appActive = jest.spyOn(GlobalEventHandler, 'appActive');
        const appInactive = jest.spyOn(GlobalEventHandler, 'appInactive');
        expect(Store.redux).not.toBeNull();

        GlobalEventHandler.onAppStateChange('background');
        expect(appActive).not.toHaveBeenCalled();
        expect(appInactive).toHaveBeenCalled();
    });

    it('should not handle onAppStateChange if the store is not set', () => {
        const appActive = jest.spyOn(GlobalEventHandler, 'appActive');
        const appInactive = jest.spyOn(GlobalEventHandler, 'appInactive');
        Store.redux = null;

        GlobalEventHandler.onAppStateChange('active');
        expect(appActive).not.toHaveBeenCalled();
        expect(appInactive).not.toHaveBeenCalled();

        GlobalEventHandler.onAppStateChange('background');
        expect(appActive).not.toHaveBeenCalled();
        expect(appInactive).not.toHaveBeenCalled();
    });

    it('should set the user TimeZone when the app becomes active', () => {
        const onAppStateChange = jest.spyOn(GlobalEventHandler, 'onAppStateChange');
        const setUserTimezone = jest.spyOn(GlobalEventHandler, 'setUserTimezone');

        Store.redux = store;
        GlobalEventHandler.configure({launchApp: jest.fn()});
        expect(Store.redux).not.toBeNull();
        expect(onAppStateChange).toHaveBeenCalledWith('active');
        expect(setUserTimezone).toHaveBeenCalledTimes(1);
    });

    it('should register NOTIFICATION_IN_APP once', () => {
        const on = jest.spyOn(EventEmitter, 'on');

        // Reset the listener
        GlobalEventHandler.pushNotificationListener = false;

        GlobalEventHandler.turnOnInAppNotificationHandling();

        // call it a second time
        GlobalEventHandler.turnOnInAppNotificationHandling();

        expect(on).toBeCalledTimes(1);
        expect(on).toBeCalledWith('NOTIFICATION_IN_APP', GlobalEventHandler.handleInAppNotification);
    });

    it('should register NOTIFICATION_IN_APP once after unregister', () => {
        const on = jest.spyOn(EventEmitter, 'on');
        GlobalEventHandler.turnOnInAppNotificationHandling();
        GlobalEventHandler.turnOffInAppNotificationHandling();

        // call it a second time
        GlobalEventHandler.turnOnInAppNotificationHandling();
        GlobalEventHandler.turnOnInAppNotificationHandling();

        expect(on).toBeCalledTimes(1);
        expect(on).toBeCalledWith('NOTIFICATION_IN_APP', GlobalEventHandler.handleInAppNotification);
    });

    describe('onServerVersionChanged', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        const minVersion = semver.parse('5.31.0');
        const currentUserId = 'current-user-id';
        Store.redux.getState = jest.fn().mockReturnValue({
            entities: {
                users: {
                    currentUserId,
                    profiles: {
                        [currentUserId]: {},
                    },
                },
            },
        });
        Store.redux.dispatch = jest.fn().mockReturnValue({});

        const dispatch = jest.spyOn(Store.redux, 'dispatch');
        const configureAnalytics = jest.spyOn(GlobalEventHandler, 'configureAnalytics');

        it('should dispatch on invalid version with currentUserId', async () => {
            const invalidVersion = 'a.b.c';
            await GlobalEventHandler.onServerVersionChanged(invalidVersion);

            expect(dispatch).toHaveBeenCalledTimes(2);
            expect(dispatch).toHaveBeenCalledWith('setServerVersion');
            expect(dispatch).toHaveBeenCalledWith('loadConfigAndLicense');
        });

        it('should dispatch on gte min server version  with currentUserId', async () => {
            let version = minVersion.version;
            await GlobalEventHandler.onServerVersionChanged(version);
            expect(dispatch).toHaveBeenCalledTimes(2);
            expect(dispatch).toHaveBeenCalledWith('setServerVersion');
            expect(dispatch).toHaveBeenCalledWith('loadConfigAndLicense');

            version = semver.coerce(minVersion.major + 1).version;
            await GlobalEventHandler.onServerVersionChanged(version);
            expect(dispatch).toHaveBeenCalledTimes(4);
        });

        it('should not dispatch on empty, null, undefined server version', async () => {
            let version;
            await GlobalEventHandler.onServerVersionChanged(version);
            expect(dispatch).not.toHaveBeenCalled();
            expect(configureAnalytics).not.toHaveBeenCalled();

            version = '';
            await GlobalEventHandler.onServerVersionChanged(version);
            expect(dispatch).not.toHaveBeenCalled();
            expect(configureAnalytics).not.toHaveBeenCalled();

            version = null;
            await GlobalEventHandler.onServerVersionChanged(version);
            expect(dispatch).not.toHaveBeenCalled();
            expect(configureAnalytics).not.toHaveBeenCalled();
        });
    });
});
