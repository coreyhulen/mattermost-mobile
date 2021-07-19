// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Preferences, Screens} from '@constants';
import * as NavigationActions from '@screens/navigation';
import {waitFor, renderWithIntl, fireEvent} from '@test/intl-test-helper';

import Login from './index';

jest.mock('@actions/remote/user', () => {
    return {
        login: () => {
            return {
                data: undefined,
                error: {
                    server_error_id: 'mfa.validate_token.authenticate.app_error',
                },
            };
        },
    };
});

describe('Login', () => {
    const baseProps = {
        componentId: Screens.LOGIN,
        config: {
            EnableSignInWithEmail: 'true',
            EnableSignInWithUsername: 'true',
        },
        license: {
            IsLicensed: 'false',
        },
        theme: Preferences.THEMES.default,
        serverUrl: 'https://locahost:8065',
    };

    test('Login screen should match snapshot', () => {
        const {toJSON} = renderWithIntl(
            <Login {...baseProps}/>,
        );

        expect(toJSON()).toMatchSnapshot();
    });

    test('should show "I forgot my password" with only email login enabled', () => {
        const props = {
            ...baseProps,
            config: {
                ...baseProps.config,
                EnableSignInWithUsername: 'false',
            },
        };

        const {getByTestId} = renderWithIntl(<Login {...props}/>, {locale: 'es'});

        expect(getByTestId('login.forgot')).toBeDefined();
    });

    test('should show "I forgot my password" with only username login enabled', () => {
        const props = {
            ...baseProps,
            config: {
                ...baseProps.config,
                EnableSignInWithEmail: 'false',
            },
        };

        const {getByTestId} = renderWithIntl(<Login {...props}/>, {locale: 'fr'});

        expect(getByTestId('login.forgot')).toBeDefined();
    });

    test('should not show "I forgot my password" without email or username login enabled', () => {
        const props = {
            ...baseProps,
            config: {
                ...baseProps.config,
                EnableSignInWithEmail: 'false',
                EnableSignInWithUsername: 'false',
            },
        };

        const {getByTestId} = renderWithIntl(<Login {...props}/>);
        let forgot;

        try {
            forgot = getByTestId('login.forgot');
        } catch {
            // do nothing
        }

        expect(forgot).toBeUndefined();
    });

    test('should go to MFA screen when login response returns MFA error', async () => {
        const goToScreen = jest.spyOn(NavigationActions, 'goToScreen');

        const {getByTestId} = renderWithIntl(<Login {...baseProps}/>);
        const loginInput = getByTestId('login.username.input');
        const passwordInput = getByTestId('login.password.input');
        const loginButton = getByTestId('login.signin.button');
        const loginId = 'user';
        const password = 'password';

        fireEvent.changeText(loginInput, loginId);
        fireEvent.changeText(passwordInput, password);

        await waitFor(() => fireEvent.press(loginButton), {timeout: 300});

        expect(goToScreen).toHaveBeenCalledWith(
            'MFA',
            'Multi-factor Authentication',
            {
                goToChannel: expect.anything(),
                loginId,
                password,
                config: {EnableSignInWithEmail: 'true', EnableSignInWithUsername: 'true'},
                license: {IsLicensed: 'false'},
                serverUrl: baseProps.serverUrl,
                theme: baseProps.theme,
            },
        );
    });

    test('should go to ForgotPassword screen when forgotPassword is called', () => {
        const goToScreen = jest.spyOn(NavigationActions, 'goToScreen');

        const {getByTestId} = renderWithIntl(<Login {...baseProps}/>);
        const forgot = getByTestId('login.forgot');

        fireEvent.press(forgot);

        expect(goToScreen).
            toHaveBeenCalledWith(
                'ForgotPassword',
                'Password Reset',
                {
                    serverUrl: baseProps.serverUrl,
                    theme: baseProps.theme,
                },
            );
    });
});
