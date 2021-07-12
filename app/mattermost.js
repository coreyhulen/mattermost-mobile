// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Linking} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {Provider} from 'react-redux';

import {resetToChannel, resetToSelectServer} from '@actions/navigation';
import {setDeepLinkURL} from '@actions/views/root';
import {loadMe, logout} from '@actions/views/user';
import {NavigationTypes} from '@constants';
import {CHANNEL, THREAD} from '@constants/screen';
import {getAppCredentials} from '@init/credentials';
import {setupPermanentSidebar} from '@init/device';
import emmProvider from '@init/emm_provider';
import '@init/fetch';
import globalEventHandler from '@init/global_event_handler';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {registerScreens} from '@screens';
import configureStore from '@store';
import EphemeralStore from '@store/ephemeral_store';
import getStorage from '@store/mmkv_adapter';
import Store from '@store/store';
import {waitForHydration} from '@store/utils';
import telemetry from '@telemetry';
import {validatePreviousVersion} from '@utils/general';
import {captureJSException} from '@utils/sentry';

const init = async () => {
    const credentials = await getAppCredentials();
    if (EphemeralStore.appStarted) {
        launchApp(credentials);
        return;
    }

    const MMKVStorage = await getStorage();
    const {store} = configureStore(MMKVStorage);
    await setupPermanentSidebar();

    globalEventHandler.configure({
        launchApp,
    });

    registerScreens(store, Provider);

    if (!EphemeralStore.appStarted) {
        launchAppAndAuthenticateIfNeeded(credentials);
    }
};

const launchApp = (credentials) => {
    const store = Store.redux;
    waitForHydration(store, async () => {
        Linking.getInitialURL().then((url) => {
            if (url) {
                store.dispatch(setDeepLinkURL(url));
            }
        });

        if (credentials) {
            const {previousVersion} = store.getState().app;
            const valid = validatePreviousVersion(previousVersion);
            if (valid) {
                store.dispatch(loadMe());
                await globalEventHandler.configureAnalytics();
                // eslint-disable-next-line no-console
                console.log('Launch app in Channel screen');
                resetToChannel();
            } else {
                const error = new Error(`Previous app version "${previousVersion}" is invalid.`);
                captureJSException(error, false, store);
                store.dispatch(logout());
            }
        } else {
            resetToSelectServer(emmProvider.allowOtherServers);
        }

        telemetry.startSinceLaunch(credentials ? 'Launch on Channel Screen' : 'Launch on Server Screen');
    });

    EphemeralStore.appStarted = true;
};

const launchAppAndAuthenticateIfNeeded = async (credentials) => {
    await emmProvider.handleManagedConfig();
    await launchApp(credentials);

    if (emmProvider.enabled) {
        if (emmProvider.jailbreakProtection) {
            emmProvider.checkIfDeviceIsTrusted();
        }

        if (emmProvider.inAppPinCode) {
            await emmProvider.handleAuthentication();
        }
    }
};

Navigation.events().registerAppLaunchedListener(() => {
    init();

    // Keep track of the latest componentId to appear/disappear
    Navigation.events().registerComponentDidAppearListener(componentDidAppearListener);
    Navigation.events().registerComponentDidDisappearListener(componentDidDisappearListener);
});

export function componentDidAppearListener({componentId}) {
    EphemeralStore.addNavigationComponentId(componentId);

    switch (componentId) {
    case 'MainSidebar':
        EventEmitter.emit(NavigationTypes.MAIN_SIDEBAR_DID_OPEN, this.handleSidebarDidOpen);
        EventEmitter.emit(NavigationTypes.BLUR_POST_DRAFT);
        break;
    case 'SettingsSidebar':
        EventEmitter.emit(NavigationTypes.BLUR_POST_DRAFT);
        break;
    case THREAD:
        if (EphemeralStore.hasModalsOpened()) {
            for (const modal of EphemeralStore.navigationModalStack) {
                const disableSwipe = {
                    modal: {
                        swipeToDismiss: false,
                    },
                };
                Navigation.mergeOptions(modal, disableSwipe);
            }
        }
        break;
    }
}

export function componentDidDisappearListener({componentId}) {
    if (componentId !== CHANNEL) {
        EphemeralStore.removeNavigationComponentId(componentId);
    }

    if (componentId === 'MainSidebar') {
        EventEmitter.emit(NavigationTypes.MAIN_SIDEBAR_DID_CLOSE);
    }

    if (componentId === THREAD) {
        if (EphemeralStore.hasModalsOpened()) {
            for (const modal of EphemeralStore.navigationModalStack) {
                const enableSwipe = {
                    modal: {
                        swipeToDismiss: true,
                    },
                };
                Navigation.mergeOptions(modal, enableSwipe);
            }
        }
    }
}
