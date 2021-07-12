// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Linking} from 'react-native';

import configureStore from '@test/test_store';
import {renderWithReduxIntl} from '@test/testing_library';

import SSOComponent from './index';

describe('SSO', () => {
    const baseProps = {
        config: {},
        license: {
            IsLicensed: 'true',
        },
    };

    test('implement with webview when version is less than 5.32 version', async () => {
        const store = await configureStore({
            entities: {
                general: {
                    config: {
                        Version: '5.30.0',
                    },
                },
            },
        });
        const basicWrapper = renderWithReduxIntl(<SSOComponent {...baseProps}/>, store);
        expect(basicWrapper.queryByTestId('sso.webview')).toBeTruthy();
        expect(basicWrapper.queryByTestId('sso.redirect_url')).toBeFalsy();
    });

    test('implement with OS browser & redirect url from version 5.33', async () => {
        (Linking.openURL as jest.Mock).mockResolvedValueOnce('');
        const store = await configureStore({
            entities: {
                general: {
                    config: {
                        Version: '5.33.0',
                    },
                },
            },
        });
        const basicWrapper = renderWithReduxIntl(<SSOComponent {...baseProps}/>, store);
        expect(basicWrapper.queryByTestId('sso.webview')).toBeFalsy();
        expect(basicWrapper.queryByTestId('sso.redirect_url')).toBeTruthy();
    });
});
