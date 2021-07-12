// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import {SettingsSidebarDrawerButton} from './settings_sidebar_drawer_button';

describe('SettingsSidebarDrawerButton', () => {
    const baseProps = {
        openSidebar: jest.fn(),
        theme: Preferences.THEMES.default,
    };

    test('should match, full snapshot', () => {
        const wrapper = shallowWithIntl(
            <SettingsSidebarDrawerButton {...baseProps}/>,
        );
        expect(wrapper).toMatchSnapshot();
    });

    test('Should be accessible', () => {
        const wrapper = shallowWithIntl(
            <SettingsSidebarDrawerButton {...baseProps}/>,
        );
        expect(wrapper.props().accessible).toBeTruthy();
    });

    test('Should have the correct accessibilityHint', () => {
        const wrapper = shallowWithIntl(
            <SettingsSidebarDrawerButton {...baseProps}/>,
        );
        expect(wrapper.props().accessibilityHint).toEqual('Opens the more options right hand sidebar');
    });

    test('Should have the correct accessibilityLabel', () => {
        const wrapper = shallowWithIntl(
            <SettingsSidebarDrawerButton {...baseProps}/>,
        );
        expect(wrapper.props().accessibilityLabel).toEqual('More Options');
    });
});
