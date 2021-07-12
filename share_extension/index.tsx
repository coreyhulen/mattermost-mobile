// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';

import {getTranslations} from '@i18n';
import {General} from '@mm-redux/constants';
import {getCurrentLocale} from '@selectors/i18n';
import configureStore from '@store';
import getStorage from '@store/mmkv_adapter';
import Store from '@store/store';
import {waitForHydration} from '@store/utils';

import Extension from './screens/extension';

const ShareExtension = () => {
    const [init, setInit] = useState(false);
    const hydrate = useCallback((mmkvStore?: any) => {
        if (mmkvStore) {
            configureStore(mmkvStore);
        }

        waitForHydration(Store.redux, async () => {
            setInit(true);
        });
    }, []);

    useEffect(() => {
        if (Store.redux) {
            hydrate();
        } else {
            getStorage().then(hydrate);
        }
    }, []);

    if (!init) {
        return null;
    }

    const locale = getCurrentLocale(Store.redux!.getState()) || General.DEFAULT_LOCALE;
    return (
        <Provider store={Store.redux!}>
            <IntlProvider
                locale={locale}
                messages={getTranslations(locale)}
            >
                <Extension/>
            </IntlProvider>
        </Provider>
    );
};

export default ShareExtension;
