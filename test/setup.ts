// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable react/no-multi-comp */

import * as ReactNative from 'react-native';

import MockAsyncStorage from 'mock-async-storage';
import 'react-native-gesture-handler/jestSetup';
import {Client} from '@client/rest';

require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();
require('isomorphic-fetch');

// @ts-expect-error no window exist in global
global.window = {};

/* eslint-disable no-console */
jest.mock('@react-native-community/async-storage', () => new MockAsyncStorage());
jest.mock('@database/manager');
jest.doMock('react-native', () => {
    const {
        Platform,
        StyleSheet,
        ViewPropTypes,
        PermissionsAndroid,
        requireNativeComponent,
        Alert: RNAlert,
        InteractionManager: RNInteractionManager,
        NativeModules: RNNativeModules,
        Linking: RNLinking,
    } = ReactNative;

    const Alert = {
        ...RNAlert,
        alert: jest.fn(),
    };

    const InteractionManager = {
        ...RNInteractionManager,
        runAfterInteractions: jest.fn((cb) => cb()),
    };

    const NativeModules = {
        ...RNNativeModules,
        UIManager: {
            RCTView: {
                directEventTypes: {},
            },
        },
        PlatformConstants: {
            forceTouchAvailable: false,
        },
        RNGestureHandlerModule: {
            State: {
                BEGAN: 'BEGAN',
                FAILED: 'FAILED',
                ACTIVE: 'ACTIVE',
                END: 'END',
            },
        },
        KeyboardObserver: {},
        JailMonkey: {
            trustFall: jest.fn().mockReturnValue(true),
        },
        RNCNetInfo: {
            getCurrentState: jest.fn().mockResolvedValue({isConnected: true}),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
            addEventListener: jest.fn(),
        },
        RNKeychainManager: {
            SECURITY_LEVEL_ANY: 'ANY',
            SECURITY_LEVEL_SECURE_SOFTWARE: 'SOFTWARE',
            SECURITY_LEVEL_SECURE_HARDWARE: 'HARDWARE',
        },
        RNReactNativeHapticFeedback: {
            trigger: jest.fn(),
        },
        RNDocumentPicker: {
            pick: jest.fn(),
        },
        RNPermissions: {},
        RNFastStorage: {
            setupLibrary: jest.fn(),
            setStringAsync: jest.fn(),
        },
        Appearance: {
            getColorScheme: jest.fn().mockReturnValue('light'),
        },
        MattermostManaged: {
            getConstants: () => ({
                appGroupIdentifier: 'group.mattermost.rnbeta',
                appGroupSharedDirectory: {
                    sharedDirectory: '',
                    databasePath: '',
                },
            }),
        },
        APIClient: {
            getConstants: () => ({
                EVENTS: {
                    UPLOAD_PROGRESS: 'APIClient-UploadProgress',
                    CLIENT_ERROR: 'APIClient-Error',
                },
                RETRY_TYPES: {
                    EXPONENTIAL_RETRY: 'exponential',
                    LINEAR_RETRY: 'linear',
                },
            }),
        },
        WebSocketClient: {
            getConstants: () => ({
                EVENTS: {
                    OPEN_EVENT: 'WebSocketClient-Open',
                    CLOSE_EVENT: 'WebSocketClient-Close',
                    ERROR_EVENT: 'WebSocketClient-Error',
                    MESSAGE_EVENT: 'WebSocketClient-Message',
                    READY_STATE_EVENT: 'WebSocketClient-ReadyState',
                    CLIENT_ERROR: 'WebSocketClient-Error',
                },
                READY_STATE: {
                    CONNECTING: 0,
                    OPEN: 1,
                    CLOSING: 2,
                    CLOSED: 3,
                },
            }),
        },
    };

    const Linking = {
        ...RNLinking,
        openURL: jest.fn(),
    };

    return Object.setPrototypeOf({
        Platform: {
            ...Platform,
            OS: 'ios',
            Version: 12,
            constants: {
                reactNativeVersion: {
                    major: 0,
                    minor: 64,
                },
            },
        },
        StyleSheet,
        ViewPropTypes,
        PermissionsAndroid,
        requireNativeComponent,
        Alert,
        InteractionManager,
        NativeModules,
        Linking,
    }, ReactNative);
});

jest.mock('react-native-vector-icons', () => {
    const React = jest.requireActual('react');
    const PropTypes = jest.requireActual('prop-types');
    class CompassIcon extends React.PureComponent {
        render() {
            return React.createElement('Icon', this.props);
        }
    }
    CompassIcon.propTypes = {
        name: PropTypes.string,
        size: PropTypes.number,
        style: PropTypes.oneOfType([PropTypes.array, PropTypes.number, PropTypes.object]),
    };
    CompassIcon.getImageSource = jest.fn().mockResolvedValue({});
    return {
        createIconSet: () => CompassIcon,

        createIconSetFromFontello: () => CompassIcon,
    };
});

jest.mock('react-native-unimodules', () => ({
    FileSystem: {
        cacheDirectory: 'root/cache',
        documentDirectory: 'root/documents',
        deleteAsync: jest.fn().mockResolvedValue(true),
        getInfoAsync: jest.fn().mockResolvedValue({exists: false}),
        makeDirectoryAsync: jest.fn().mockResolvedValue(true),
        readDirectoryAsync: jest.fn().mockResolvedValue([]),
    },
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native-device-info', () => {
    return {
        getVersion: () => '0.0.0',
        getBuildNumber: () => '0',
        getModel: () => 'iPhone X',
        hasNotch: () => true,
        isTablet: () => false,
        getApplicationName: () => 'Mattermost',
        getUserAgent: () => 'user-agent',
    };
});

jest.mock('react-native-localize', () => ({
    getTimeZone: () => 'World/Somewhere',
    getLocales: () => ([
        {countryCode: 'GB', languageTag: 'en-GB', languageCode: 'en', isRTL: false},
        {countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false},
        {countryCode: 'FR', languageTag: 'fr-FR', languageCode: 'fr', isRTL: false},
    ]),
}));

jest.mock('@react-native-cookies/cookies', () => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    openURL: jest.fn(),
    getInitialURL: jest.fn(),
    clearAll: jest.fn(),
    get: () => Promise.resolve(({
        res: {
            MMCSRF: {
                value: 'the cookie',
            },
        },
    })),
}));

jest.mock('react-native-navigation', () => {
    const RNN = jest.requireActual('react-native-navigation');
    RNN.Navigation.setLazyComponentRegistrator = jest.fn();
    RNN.Navigation.setDefaultOptions = jest.fn();
    RNN.Navigation.registerComponent = jest.fn();
    return {
        ...RNN,
        Navigation: {
            ...RNN.Navigation,
            events: () => ({
                registerAppLaunchedListener: jest.fn(),
                bindComponent: jest.fn(() => {
                    return {remove: jest.fn()};
                }),
            }),
            setRoot: jest.fn(),
            pop: jest.fn(),
            push: jest.fn(),
            showModal: jest.fn(),
            dismissModal: jest.fn(),
            dismissAllModals: jest.fn(),
            popToRoot: jest.fn(),
            mergeOptions: jest.fn(),
            showOverlay: jest.fn(),
            dismissOverlay: jest.fn(),
        },
    };
});

jest.mock('react-native-notifications', () => {
    let deliveredNotifications: ReactNative.PushNotification[] = [];

    return {
        Notifications: {
            registerRemoteNotifications: jest.fn(),
            addEventListener: jest.fn(),
            setDeliveredNotifications: jest.fn((notifications) => {
                deliveredNotifications = notifications;
            }),
            cancelAllLocalNotifications: jest.fn(),
            NotificationAction: jest.fn(),
            NotificationCategory: jest.fn(),
            events: () => ({
                registerNotificationOpened: jest.fn(),
                registerRemoteNotificationsRegistered: jest.fn(),
                registerNotificationReceivedBackground: jest.fn(),
                registerNotificationReceivedForeground: jest.fn(),
            }),
            ios: {
                getDeliveredNotifications: jest.fn().mockImplementation(() => Promise.resolve(deliveredNotifications)),
                removeDeliveredNotifications: jest.fn((ids) => {
                    // eslint-disable-next-line
                    // @ts-ignore
                    deliveredNotifications = deliveredNotifications.filter((n) => !ids.includes(n.identifier));
                }),
                setBadgeCount: jest.fn(),
            },
        },
    };
});

jest.mock('react-native-share', () => ({
    default: jest.fn(),
}));

jest.mock('@screens/navigation', () => ({
    resetToChannel: jest.fn(),
    resetToSelectServer: jest.fn(),
    resetToTeams: jest.fn(),
    goToScreen: jest.fn(),
    popTopScreen: jest.fn(),
    showModal: jest.fn(),
    showModalOverCurrentContext: jest.fn(),
    showSearchModal: jest.fn(),
    setButtons: jest.fn(),
    showOverlay: jest.fn(),
    mergeNavigationOptions: jest.fn(),
    popToRoot: jest.fn(() => Promise.resolve()),
    dismissModal: jest.fn(() => Promise.resolve()),
    dismissAllModals: jest.fn(() => Promise.resolve()),
    dismissOverlay: jest.fn(() => Promise.resolve()),
}));

jest.mock('@mattermost/react-native-emm');

jest.mock('@init/network_manager', () => {
    return {
        getClient: () => {},
        init: () => {},
    };
});

declare const global: {requestAnimationFrame: (callback: any) => void};
global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 0);
};
