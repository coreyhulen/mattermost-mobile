// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import 'babel-polyfill';
import Analytics from 'analytics-react-native';
import Orientation from 'react-native-orientation';
import {Provider} from 'react-redux';
import {Navigation} from 'react-native-navigation';
import {IntlProvider} from 'react-intl';
import {
    Alert,
    AppState,
    InteractionManager,
    NativeModules,
    Platform
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {setJSExceptionHandler, setNativeExceptionHandler} from 'react-native-exception-handler';
import StatusBarSizeIOS from 'react-native-status-bar-size';
import semver from 'semver';

import {General} from 'mattermost-redux/constants';
import {setAppState, setDeviceToken, setServerVersion} from 'mattermost-redux/actions/general';
import {markChannelAsRead} from 'mattermost-redux/actions/channels';
import {logError} from 'mattermost-redux/actions/errors';
import {logout} from 'mattermost-redux/actions/users';
import {close as closeWebSocket} from 'mattermost-redux/actions/websocket';
import {Client, Client4} from 'mattermost-redux/client';
import EventEmitter from 'mattermost-redux/utils/event_emitter';

import {
    goToNotification,
    loadConfigAndLicense,
    queueNotification,
    setStatusBarHeight,
    purgeOfflineStore
} from 'app/actions/views/root';
import {setChannelDisplayName} from 'app/actions/views/channel';
import {handleLoginIdChanged} from 'app/actions/views/login';
import {handleServerUrlChanged} from 'app/actions/views/select_server';
import {NavigationTypes, ViewTypes} from 'app/constants';
import {getTranslations} from 'app/i18n';
import initialState from 'app/initial_state';
import PushNotifications from 'app/push_notifications';
import {registerScreens} from 'app/screens';
import configureStore from 'app/store';
import mattermostManaged from 'app/mattermost_managed';

import {captureException, initializeSentry, LOGGER_JAVASCRIPT, LOGGER_NATIVE} from 'app/utils/sentry';
import Config from 'assets/config';

const {StatusBarManager} = NativeModules;
const store = configureStore(initialState);
const AUTHENTICATION_TIMEOUT = 5 * 60 * 1000;

registerScreens(store, Provider);

export default class Mattermost {
    constructor() {
        if (Platform.OS === 'android') {
            // This is to remove the warnings for the scaleY property used in android.
            // The property is necessary because some Android devices won't render the posts
            // properly if we use transform: {scaleY: -1} in the stylesheet.
            console.ignoredYellowBox = ['`scaleY`']; //eslint-disable-line
        }
        this.isConfigured = false;
        this.allowOtherServers = true;

        Orientation.lockToPortrait();
        this.unsubscribeFromStore = store.subscribe(this.listenForHydration);
        AppState.addEventListener('change', this.handleAppStateChange);
        EventEmitter.on(General.CONFIG_CHANGED, this.handleConfigChanged);
        EventEmitter.on(NavigationTypes.NAVIGATION_RESET, this.handleReset);
        EventEmitter.on(General.DEFAULT_CHANNEL, this.handleResetDisplayName);
        EventEmitter.on(NavigationTypes.RESTART_APP, this.restartApp);

        mattermostManaged.addEventListener('managedConfigDidChange', this.handleManagedConfig);

        this.handleAppStateChange(AppState.currentState);
        Client4.setUserAgent(DeviceInfo.getUserAgent());

        if (Platform.OS === 'ios') {
            StatusBarSizeIOS.addEventListener('willChange', this.handleStatusBarHeightChange);
            StatusBarManager.getHeight(
                (data) => {
                    this.handleStatusBarHeightChange(data.height);
                }
            );
        }

        initializeSentry(store);
        setJSExceptionHandler(this.errorHandler, true);
        setNativeExceptionHandler(this.nativeErrorHandler);
    }

    errorHandler = (e, isFatal) => {
        captureException(e, LOGGER_JAVASCRIPT);

        const intl = this.getIntl();
        closeWebSocket()(store.dispatch, store.getState);
        logError(e)(store.dispatch);

        if (isFatal) {
            Alert.alert(
                intl.formatMessage({id: 'mobile.error_handler.title', defaultMessage: 'Unexpected error occurred'}),
                intl.formatMessage({id: 'mobile.error_handler.description', defaultMessage: '\nClick relaunch to open the app again. After restart, you can report the problem from the settings menu.\n'}),
                [{
                    text: intl.formatMessage({id: 'mobile.error_handler.button', defaultMessage: 'Relaunch'}),
                    onPress: () => {
                        // purge the store
                        store.dispatch(purgeOfflineStore());
                    }
                }],
                {cancelable: false}
            );
        }
    };

    nativeErrorHandler = (e) => {
        captureException(e, LOGGER_NATIVE);
    };

    getIntl = () => {
        const state = store.getState();
        let locale = DeviceInfo.getDeviceLocale().split('-')[0];
        if (state.views.i18n.locale) {
            locale = state.views.i18n.locale;
        }

        const intlProvider = new IntlProvider({locale, messages: getTranslations(locale)}, {});
        const {intl} = intlProvider.getChildContext();
        return intl;
    };

    configureAnalytics = (config) => {
        if (config && config.DiagnosticsEnabled === 'true' && config.DiagnosticId && Config.SegmentApiKey) {
            if (!global.analytics) {
                global.analytics = new Analytics(Config.SegmentApiKey);
                global.analytics.identify({
                    userId: config.DiagnosticId,
                    context: {
                        ip: '0.0.0.0'
                    },
                    page: {
                        path: '',
                        referrer: '',
                        search: '',
                        title: '',
                        url: ''
                    },
                    anonymousId: '00000000000000000000000000'
                });
            }
        } else {
            global.analytics = null;
        }
    };

    configurePushNotifications = () => {
        PushNotifications.configure({
            onRegister: this.onRegisterDevice,
            onNotification: this.onPushNotification,
            popInitialNotification: true,
            requestPermissions: true
        });
    };

    handleAppStateChange = async (appState) => {
        const {dispatch, getState} = store;
        const isActive = appState === 'active';
        setAppState(isActive)(dispatch, getState);
        try {
            if (!isActive && !this.inBackgroundSince) {
                this.inBackgroundSince = Date.now();
            } else if (isActive && this.inBackgroundSince && (Date.now() - this.inBackgroundSince) >= AUTHENTICATION_TIMEOUT) {
                this.inBackgroundSince = null;
                if (this.mdmEnabled) {
                    const config = await mattermostManaged.getConfig();
                    const authNeeded = config.inAppPinCode && config.inAppPinCode === 'true';
                    if (authNeeded) {
                        const authenticated = await this.handleAuthentication(config.vendor);
                        if (!authenticated) {
                            mattermostManaged.quitApp();
                        }
                    }
                }
            }
        } catch (error) {
            // do nothing
        }
    };

    handleAuthentication = async (vendor) => {
        const isSecured = await mattermostManaged.isDeviceSecure();

        const intl = this.getIntl();
        if (isSecured) {
            try {
                await mattermostManaged.authenticate({
                    reason: intl.formatMessage({
                        id: 'mobile.managed.secured_by',
                        defaultMessage: 'Secured by {vendor}'
                    }, {vendor}),
                    fallbackToPasscode: true,
                    suppressEnterPassword: true
                });
            } catch (err) {
                mattermostManaged.quitApp();
                return false;
            }
        }

        return true;
    };

    handleConfigChanged = async (serverVersion) => {
        const {dispatch, getState} = store;
        const version = serverVersion.match(/^[0-9]*.[0-9]*.[0-9]*(-[a-zA-Z0-9.-]*)?/g)[0];
        const intl = this.getIntl();

        if (serverVersion) {
            if (semver.valid(version) && semver.lt(version, Config.MinServerVersion)) {
                Alert.alert(
                    intl.formatMessage({id: 'mobile.server_upgrade.title', defaultMessage: 'Server upgrade required'}),
                    intl.formatMessage({id: 'mobile.server_upgrade.description', defaultMessage: '\nA server upgrade is required to use the Mattermost app. Please ask your System Administrator for details.\n'}),
                    [{
                        text: intl.formatMessage({id: 'mobile.server_upgrade.button', defaultMessage: 'OK'}),
                        onPress: this.handleVersionUpgrade
                    }],
                    {cancelable: false}
                );
            } else {
                setServerVersion(serverVersion)(dispatch, getState);
                const data = await loadConfigAndLicense()(dispatch, getState);
                this.configureAnalytics(data.config);
            }
        }
    };

    handleManagedConfig = async (serverConfig) => {
        const {dispatch, getState} = store;
        const state = getState();

        let authNeeded = false;
        let blurApplicationScreen = false;
        let jailbreakProtection = false;
        let vendor = null;
        let serverUrl = null;
        let username = null;

        try {
            const config = await mattermostManaged.getConfig();
            if (config) {
                this.mdmEnabled = true;
                authNeeded = config.inAppPinCode && config.inAppPinCode === 'true';
                blurApplicationScreen = config.blurApplicationScreen && config.blurApplicationScreen === 'true';
                jailbreakProtection = config.jailbreakProtection && config.jailbreakProtection === 'true';
                vendor = config.vendor || 'Mattermost';

                if (!state.entities.general.credentials.token) {
                    serverUrl = config.serverUrl;
                    username = config.username;

                    if (config.allowOtherServers && config.allowOtherServers === 'false') {
                        this.allowOtherServers = false;
                    }
                }
            }
        } catch (error) {
            return true;
        }

        if (this.mdmEnabled) {
            if (jailbreakProtection) {
                const isTrusted = mattermostManaged.isTrustedDevice();

                if (!isTrusted) {
                    const intl = this.getIntl();
                    Alert.alert(
                        intl.formatMessage({
                            id: 'mobile.managed.blocked_by',
                            defaultMessage: 'Blocked by {vendor}'
                        }, {vendor}),
                        intl.formatMessage({
                            id: 'mobile.managed.jailbreak',
                            defaultMessage: 'Jailbroken devices are not trusted by {vendor}, please exit the app.'
                        }, {vendor}),
                        [{
                            text: intl.formatMessage({id: 'mobile.managed.exit', defaultMessage: 'Exit'}),
                            style: 'destructive',
                            onPress: () => {
                                mattermostManaged.quitApp();
                            }
                        }],
                        {cancelable: false}
                    );
                    return false;
                }
            }

            if (authNeeded && !serverConfig) {
                if (Platform.OS === 'android') {
                    //Start a fake app as we need at least one activity for android
                    await this.startFakeApp();
                }
                const authenticated = await this.handleAuthentication(vendor);
                if (!authenticated) {
                    return false;
                }
            }

            if (blurApplicationScreen) {
                mattermostManaged.blurAppScreen(true);
            }

            if (serverUrl) {
                handleServerUrlChanged(serverUrl)(dispatch, getState);
            }

            if (username) {
                handleLoginIdChanged(username)(dispatch, getState);
            }
        }

        return true;
    };

    handleReset = () => {
        this.resetBadgeAndVersion();
        this.startApp('fade');
    };

    handleResetDisplayName = (displayName) => {
        store.dispatch(setChannelDisplayName(displayName));
    };

    handleStatusBarHeightChange = (nextStatusBarHeight) => {
        store.dispatch(setStatusBarHeight(nextStatusBarHeight));
    };

    handleVersionUpgrade = async () => {
        const {dispatch, getState} = store;

        Client4.serverVersion = '';
        PushNotifications.setApplicationIconBadgeNumber(0);

        if (getState().entities.general.credentials.token) {
            InteractionManager.runAfterInteractions(() => {
                logout()(dispatch, getState);
            });
        } else {
            this.resetBadgeAndVersion();
        }
    };

    // We need to wait for hydration to occur before load the router.
    listenForHydration = () => {
        const state = store.getState();
        if (state.views.root.hydrationComplete) {
            this.unsubscribeFromStore();
            this.handleManagedConfig().then((shouldStart) => {
                if (shouldStart) {
                    this.startApp();
                }
            });
        }
    };

    onRegisterDevice = (data) => {
        const {dispatch, getState} = store;
        let prefix;
        if (Platform.OS === 'ios') {
            prefix = General.PUSH_NOTIFY_APPLE_REACT_NATIVE;
            if (DeviceInfo.getBundleId().includes('rnbeta')) {
                prefix = `${prefix}beta`;
            }
        } else {
            prefix = General.PUSH_NOTIFY_ANDROID_REACT_NATIVE;
        }
        setDeviceToken(`${prefix}:${data.token}`)(dispatch, getState);
        this.isConfigured = true;
    };

    onPushNotification = (deviceNotification) => {
        const {data, foreground, message, userInfo, userInteraction} = deviceNotification;
        const {dispatch, getState} = store;
        const state = getState();
        const notification = {
            data,
            message
        };

        if (userInfo) {
            notification.localNotification = userInfo.localNotification;
        }

        if (data.type === 'clear') {
            markChannelAsRead(data.channel_id)(dispatch, getState);
        } else if (foreground) {
            EventEmitter.emit(ViewTypes.NOTIFICATION_IN_APP, notification);
        } else if (userInteraction) {
            if (!notification.localNotification) {
                if (!state.views.root.appInitializing) {
                    // go to notification if the app is initialized

                    if (!Client4.getUrl()) {
                        // Make sure the Client has the server url set
                        Client4.setUrl(state.entities.general.credentials.url);
                    }

                    goToNotification(notification)(dispatch, getState);
                    EventEmitter.emit(ViewTypes.NOTIFICATION_TAPPED);
                } else if (state.entities.general.credentials.token) {
                    // queue notification if app is not initialized but we are logged in
                    queueNotification(notification)(dispatch, getState);
                }
            }
        }
    };

    resetBadgeAndVersion = () => {
        const {dispatch, getState} = store;
        Client4.serverVersion = '';
        Client.serverVersion = '';
        Client.token = null;
        Client4.userId = '';
        PushNotifications.setApplicationIconBadgeNumber(0);
        PushNotifications.cancelAllLocalNotifications();
        setServerVersion('')(dispatch, getState);
    };

    restartApp = async () => {
        Navigation.dismissModal({animationType: 'none'});

        const {dispatch, getState} = store;
        await loadConfigAndLicense()(dispatch, getState);
        this.startApp('fade');
    };

    startFakeApp = async () => {
        return Navigation.startSingleScreenApp({
            screen: {
                screen: 'Root',
                navigatorStyle: {
                    navBarHidden: true,
                    statusBarHidden: false,
                    statusBarHideWithNavBar: false
                }
            },
            passProps: {
                justInit: true
            }
        });
    };

    startApp = (animationType = 'none') => {
        Navigation.startSingleScreenApp({
            screen: {
                screen: 'Root',
                navigatorStyle: {
                    navBarHidden: true,
                    statusBarHidden: false,
                    statusBarHideWithNavBar: false
                }
            },
            passProps: {
                allowOtherServers: this.allowOtherServers
            },
            animationType
        });

        if (!this.isConfigured) {
            this.configurePushNotifications();
        }
    };
}
