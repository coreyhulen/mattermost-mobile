// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DeviceEventEmitter, Platform} from 'react-native';
import 'react-native-gesture-handler';
import {ComponentDidAppearEvent, ComponentDidDisappearEvent, Navigation} from 'react-native-navigation';

import {Navigation as NavigationConstants, Screens} from './app/constants';
import DatabaseManager from './app/database/manager';
import {getAllServerCredentials} from './app/init/credentials';
import GlobalEventHandler from './app/init/global_event_handler';
import {initialLaunch} from './app/init/launch';
import ManagedApp from './app/init/managed_app';
import NetworkManager from './app/init/network_manager';
import PushNotifications from './app/init/push_notifications';
import {registerScreens} from './app/screens';
import EphemeralStore from './app/store/ephemeral_store';
import setFontFamily from './app/utils/font_family';
import {setupChannelMockData} from './test/mock_database_data';

declare const global: { HermesInternal: null | {} };

if (__DEV__) {
    const LogBox = require('react-native/Libraries/LogBox/LogBox');
    LogBox.ignoreLogs([
        '`-[RCTRootView cancelTouches]`',
        'scaleY',
    ]);
    LogBox.ignoreLogs(['Require cycle: node_modules/zod/lib/src/index.js']);
}

setFontFamily();

if (global.HermesInternal) {
    // Polyfills required to use Intl with Hermes engine
    require('@formatjs/intl-getcanonicallocales/polyfill');
    require('@formatjs/intl-locale/polyfill');
    require('@formatjs/intl-pluralrules/polyfill');
    require('@formatjs/intl-numberformat/polyfill');
    require('@formatjs/intl-datetimeformat/polyfill');
    require('@formatjs/intl-datetimeformat/add-golden-tz');
}

if (Platform.OS === 'android') {
    const ShareExtension = require('share_extension/index.tsx').default;
    const AppRegistry = require('react-native/Libraries/ReactNative/AppRegistry');
    AppRegistry.registerComponent('MattermostShare', () => ShareExtension);
}

Navigation.events().registerAppLaunchedListener(async () => {
    GlobalEventHandler.init();
    ManagedApp.init();
    registerNavigationListeners();
    registerScreens();

    const serverCredentials = await getAllServerCredentials();
    const serverUrls = serverCredentials.map((credential) => credential.serverUrl);

    await DatabaseManager.init(serverUrls);
    await NetworkManager.init(serverCredentials);

    //fixme:  Remove setupMockData when not testing ?
    // await setupChannelMockData();

    PushNotifications.init();

    initialLaunch();
});

const registerNavigationListeners = () => {
    Navigation.events().registerComponentDidAppearListener(componentDidAppearListener);
    Navigation.events().registerComponentDidDisappearListener(componentDidDisappearListener);
};

function componentDidAppearListener({componentId}: ComponentDidAppearEvent) {
    EphemeralStore.addNavigationComponentId(componentId);

    switch (componentId) {
        case 'MainSidebar':
            DeviceEventEmitter.emit(NavigationConstants.MAIN_SIDEBAR_DID_OPEN);
            DeviceEventEmitter.emit(NavigationConstants.BLUR_POST_DRAFT);
            break;
        case 'SettingsSidebar':
            DeviceEventEmitter.emit(NavigationConstants.BLUR_POST_DRAFT);
            break;
    }
}

function componentDidDisappearListener({componentId}: ComponentDidDisappearEvent) {
    if (componentId !== Screens.CHANNEL) {
        EphemeralStore.removeNavigationComponentId(componentId);
    }

    if (componentId === 'MainSidebar') {
        DeviceEventEmitter.emit(NavigationConstants.MAIN_SIDEBAR_DID_CLOSE);
    }
}
