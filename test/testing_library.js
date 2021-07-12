// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render} from '@testing-library/react-native';

import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import intitialState from '@store/initial_state';

const mockStore = configureMockStore([thunk]);
const defaultStore = mockStore(intitialState);

export function renderWithIntl(component, locale = 'en') {
    return render(
        <IntlProvider locale={locale}>
            {component}
        </IntlProvider>,
    );
}

export function renderWithRedux(component, store = defaultStore) {
    return render(
        <Provider store={store}>
            {component}
        </Provider>,
    );
}

export function renderWithReduxIntl(component, store = defaultStore, locale = 'en') {
    return render(
        <Provider store={store}>
            <IntlProvider locale={locale}>
                {component}
            </IntlProvider>
        </Provider>,
    );
}
