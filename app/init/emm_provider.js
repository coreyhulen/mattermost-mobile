// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Alert, Platform} from 'react-native';

import {setServerUrl} from '@actions/views/select_server';
import LocalConfig from '@assets/config';
import {getTranslations} from '@i18n';
import mattermostManaged from '@mattermost-managed';
import {getCurrentLocale} from '@selectors/i18n';
import Store from '@store/store';
import {t} from '@utils/i18n';

import mattermostBucket from 'app/mattermost_bucket';

import {getAppCredentials} from './credentials';

class EMMProvider {
    constructor() {
        this.enabled = false;
        this.performingAuthentication = false;
        this.previousAppState = null;

        this.inAppPinCode = false;
        this.blurApplicationScreen = false;
        this.jailbreakProtection = false;
        this.vendor = null;

        this.allowOtherServers = true;
        this.emmServerUrl = null;
        this.inAppSessionAuth = false;
    }

    checkIfDeviceIsTrusted = () => {
        const isTrusted = mattermostManaged.isTrustedDevice();

        if (!isTrusted) {
            const state = Store.redux.getState();
            const locale = getCurrentLocale(state);
            const translations = getTranslations(locale);
            Alert.alert(
                translations[t('mobile.managed.blocked_by')].replace('{vendor}', this.vendor),
                translations[t('mobile.managed.jailbreak')].replace('{vendor}', this.vendor),
                [{
                    text: translations[t('mobile.managed.exit')],
                    style: 'destructive',
                    onPress: () => {
                        mattermostManaged.quitApp();
                    },
                }],
                {cancelable: false},
            );
        }
    };

    handleAuthentication = async (prompt = true) => {
        this.performingAuthentication = true;
        const isSecured = await mattermostManaged.isDeviceSecure();
        const state = Store.redux.getState();
        const locale = getCurrentLocale(state);
        const translations = getTranslations(locale);

        if (isSecured) {
            try {
                mattermostBucket.setPreference('emm', this.vendor);
                if (prompt) {
                    await mattermostManaged.authenticate({
                        reason: translations[t('mobile.managed.secured_by')].replace('{vendor}', this.vendor),
                        fallbackToPasscode: true,
                        suppressEnterPassword: true,
                    });
                }
            } catch (err) {
                mattermostManaged.quitApp();
                return false;
            }
        } else {
            await this.showNotSecuredAlert(translations);

            mattermostManaged.quitApp();
            return false;
        }

        this.performingAuthentication = false;
        return true;
    };

    handleManagedConfig = async () => {
        if (this.performingAuthentication) {
            return true;
        }

        const {dispatch} = Store.redux;

        if (LocalConfig.AutoSelectServerUrl) {
            dispatch(setServerUrl(LocalConfig.DefaultServerUrl));
            this.allowOtherServers = false;
        }

        const managedConfig = await mattermostManaged.getConfig();

        if (managedConfig && Object.keys(managedConfig).length) {
            this.enabled = true;
            this.inAppPinCode = managedConfig.inAppPinCode === 'true';

            this.blurApplicationScreen = managedConfig.blurApplicationScreen === 'true';
            this.jailbreakProtection = managedConfig.jailbreakProtection === 'true';
            this.vendor = managedConfig.vendor || 'Mattermost';

            this.inAppSessionAuth = managedConfig.inAppSessionAuth === 'true';

            const credentials = await getAppCredentials();
            if (!credentials) {
                this.emmServerUrl = managedConfig.serverUrl;

                if (managedConfig.allowOtherServers && managedConfig.allowOtherServers === 'false') {
                    this.allowOtherServers = false;
                }
            }

            if (this.blurApplicationScreen) {
                mattermostManaged.blurAppScreen(true);
            }

            if (this.emmServerUrl) {
                dispatch(setServerUrl(this.emmServerUrl));
            }
        }

        return true;
    };

    showNotSecuredAlert = (translations) => {
        return new Promise(async (resolve) => { /* eslint-disable-line no-async-promise-executor */
            const options = [];

            if (Platform.OS === 'android') {
                options.push({
                    text: translations[t('mobile.managed.settings')],
                    onPress: () => {
                        mattermostManaged.goToSecuritySettings();
                    },
                });
            }

            options.push({
                text: translations[t('mobile.managed.exit')],
                onPress: resolve,
                style: 'cancel',
            });

            let message;
            if (Platform.OS === 'ios') {
                const {supportsFaceId} = await mattermostManaged.supportsFaceId();

                if (supportsFaceId) {
                    message = translations[t('mobile.managed.not_secured.ios')];
                } else {
                    message = translations[t('mobile.managed.not_secured.ios.touchId')];
                }
            } else {
                message = translations[t('mobile.managed.not_secured.android')];
            }

            Alert.alert(
                translations[t('mobile.managed.blocked_by')].replace('{vendor}', this.vendor),
                message,
                options,
                {cancelable: false, onDismiss: resolve},
            );
        });
    }
}

export default new EMMProvider();
