// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import FormattedText from '@components/formatted_text';
import Preferences from '@mm-redux/constants/preferences';

import SSOWithRedirectURL from './sso_with_redirect_url';

describe('SSO with redirect url', () => {
    const baseProps = {
        customUrlScheme: 'mmauth://',
        intl: {},
        loginError: '',
        loginUrl: '',
        onCSRFToken: jest.fn(),
        onMMToken: jest.fn(),
        setLoginError: jest.fn(),
        theme: Preferences.THEMES.default,
    };

    test('should show message when user navigates to the page', () => {
        const wrapperWithBaseProps = shallow(<SSOWithRedirectURL {...baseProps}/>);
        expect(wrapperWithBaseProps.find(FormattedText).find({id: 'mobile.oauth.switch_to_browser'}).exists()).toBe(true);
    });

    test('should show "try again" and hide default message when error text is displayed', () => {
        const wrapperWithBaseProps = shallow(<SSOWithRedirectURL {...baseProps}/>);
        expect(wrapperWithBaseProps.find(FormattedText).find({id: 'mobile.oauth.try_again'}).exists()).toBe(false);
        const wrapper = shallow(
            <SSOWithRedirectURL
                {...baseProps}
                loginError='some error'
            />,
        );
        expect(wrapper.find(FormattedText).find({id: 'mobile.oauth.try_again'}).exists()).toBe(true);
        expect(wrapper.find(FormattedText).find({id: 'mobile.oauth.switch_to_browser'}).exists()).toBe(false);
    });
});
