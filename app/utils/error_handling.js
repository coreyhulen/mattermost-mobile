// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Alert} from 'react-native';
import {setJSExceptionHandler, setNativeExceptionHandler} from 'react-native-exception-handler';

import {dismissAllModals} from '@actions/navigation';
import {purgeOfflineStore} from '@actions/views/root';
import {close as closeWebSocket} from '@actions/websocket';
import {Client4} from '@client/rest';
import {DEFAULT_LOCALE, getTranslations} from '@i18n';
import {logError} from '@mm-redux/actions/errors';
import {t} from '@utils/i18n';
import {
    captureException,
    captureJSException,
    initializeSentry,
    LOGGER_NATIVE,
} from '@utils/sentry';

class JavascriptAndNativeErrorHandler {
    initializeErrorHandling = (store) => {
        this.store = store;
        initializeSentry();
        setJSExceptionHandler(this.errorHandler, false);
        setNativeExceptionHandler(this.nativeErrorHandler, false);
    }

    nativeErrorHandler = (e) => {
        console.warn('Handling native error ' + JSON.stringify(e)); // eslint-disable-line no-console
        captureException(e, LOGGER_NATIVE, this.store);
    };

    errorHandler = (e, isFatal) => {
        if (__DEV__ && !e && !isFatal) {
            // react-native-exception-handler redirects console.error to call this, and React calls
            // console.error without an exception when prop type validation fails, so this ends up
            // being called with no arguments when the error handler is enabled in dev mode.
            return;
        }

        console.warn('Handling Javascript error', e, isFatal); // eslint-disable-line no-console
        captureJSException(e, isFatal, this.store);

        const {dispatch} = this.store;

        dispatch(closeWebSocket());

        if (Client4.getUrl()) {
            dispatch(logError(e));
        }

        if (isFatal && e instanceof Error) {
            const translations = getTranslations(DEFAULT_LOCALE);

            Alert.alert(
                translations[t('mobile.error_handler.title')],
                translations[t('mobile.error_handler.description')] + `\n\n${e.message}\n\n${e.stack}`,
                [{
                    text: translations[t('mobile.error_handler.button')],
                    onPress: async () => {
                        await dismissAllModals();

                        // purge the store
                        dispatch(purgeOfflineStore());
                    },
                }],
                {cancelable: false},
            );
        }
    };
}

export default new JavascriptAndNativeErrorHandler();
