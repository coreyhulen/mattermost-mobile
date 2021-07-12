// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {shallowWithIntl} from '@test/intl-test-helper';

import ForgotPassword from './forgot_password.js';

describe('ForgotPassword', () => {
    const actions = {
        sendPasswordResetEmail: jest.fn(),
    };

    const baseProps = {
        actions,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ForgotPassword {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('snapshot for error on failure of email regex', () => {
        const wrapper = shallowWithIntl(
            <ForgotPassword {...baseProps}/>,
        );

        wrapper.setState({email: 'bar'});
        wrapper.instance().submitResetPassword();
        wrapper.update();
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('Should call sendPasswordResetEmail', () => {
        const wrapper = shallowWithIntl(
            <ForgotPassword {...baseProps}/>,
        );

        wrapper.setState({email: 'test@test.com'});
        wrapper.instance().submitResetPassword();
        expect(actions.sendPasswordResetEmail).toBeCalledWith('test@test.com');
    });

    test('match snapshot after success of sendPasswordResetEmail', async () => {
        const sendPasswordResetEmail = async () => {
            return {
                data: {},
            };
        };
        const wrapper = shallowWithIntl(
            <ForgotPassword
                {...baseProps}
                actions={{
                    ...actions,
                    sendPasswordResetEmail,
                }}
            />,
        );

        wrapper.setState({email: 'test@test.com'});
        wrapper.instance().submitResetPassword();
        await sendPasswordResetEmail();
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
