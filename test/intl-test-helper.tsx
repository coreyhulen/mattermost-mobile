// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Database} from '@nozbe/watermelondb';
import DatabaseProvider from '@nozbe/watermelondb/DatabaseProvider';
import {render} from '@testing-library/react-native';
import React, {ReactElement} from 'react';
import {IntlProvider} from 'react-intl';

import {getTranslations} from '@i18n';

export function renderWithIntl(
    ui: ReactElement,
    {locale = 'en', ...renderOptions} = {},
) {
    function Wrapper({children}: { children: ReactElement }) {
        return (
            <IntlProvider
                locale={locale}
                messages={getTranslations(locale)}
            >
                {children}
            </IntlProvider>
        );
    }

    return render(ui, {wrapper: Wrapper, ...renderOptions});
}

export function renderWithDatabase(ui: ReactElement, database: Database) {
    function Wrapper({children}: { children: ReactElement }) {
        return (
            <DatabaseProvider database={database}>
                {children}
            </DatabaseProvider>
        );
    }

    return render(ui, {wrapper: Wrapper});
}

// eslint-disable-next-line no-duplicate-imports
export * from '@testing-library/react-native';
