// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Linking} from 'react-native';
import configureMockStore from 'redux-mock-store';
import merge from 'deepmerge';

import initialState from '@store/initial_state';
import {renderWithReduxIntl} from 'test/testing_library';

import SSOComponent from './index';

describe('SSO', () => {
    const baseProps = {
        config: {},
        license: {
            IsLicensed: 'true',
        },
    };

    test('implement with webview when version is less than 5.32 version', async () => {
        const mockStore = configureMockStore();
        const store = mockStore(
            merge(initialState, {
                entities: {
                    general: {
                        config: {
                            Version: '5.30.0',
                        },
                    },
                },
            }),
        );
        const basicWrapper = renderWithReduxIntl(<SSOComponent {...baseProps}/>, store);
        expect(basicWrapper.queryByTestId('sso.webview')).toBeTruthy();
        expect(basicWrapper.queryByTestId('sso.redirect_url')).toBeFalsy();
    });

    test('implement with OS browser & redirect url from version 5.33', async () => {
        (Linking.openURL as jest.Mock).mockResolvedValueOnce('');
        const mockStore = configureMockStore();
        const store = mockStore(
            merge(initialState, {
                entities: {
                    general: {
                        config: {
                            Version: '5.33.0',
                        },
                    },
                },
            }),
        );
        const basicWrapper = renderWithReduxIntl(<SSOComponent {...baseProps}/>, store);
        expect(basicWrapper.queryByTestId('sso.webview')).toBeFalsy();
        expect(basicWrapper.queryByTestId('sso.redirect_url')).toBeTruthy();
    });
});
