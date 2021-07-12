// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Badge from '@components/badge';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import MainSidebarDrawerButton from './main_sidebar_drawer_button';

describe('MainSidebarDrawerButton', () => {
    const baseProps = {
        openSidebar: jest.fn(),
        badgeCount: 0,
        theme: Preferences.THEMES.default,
        visible: false,
    };

    test('should match, full snapshot', () => {
        const wrapper = shallowWithIntl(
            <MainSidebarDrawerButton {...baseProps}/>,
        );

        // no badge to show
        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(Badge).length).toEqual(0);

        // badge should render
        wrapper.setProps({badgeCount: 1, visible: true});
        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(Badge).length).toEqual(1);
    });

    test('Should be accessible', () => {
        const wrapper = shallowWithIntl(
            <MainSidebarDrawerButton {...baseProps}/>,
        );
        expect(wrapper.props().accessible).toBeTruthy();
    });

    test('Should have the correct accessibilityHint', () => {
        const wrapper = shallowWithIntl(
            <MainSidebarDrawerButton {...baseProps}/>,
        );
        expect(wrapper.props().accessibilityHint).toEqual('Opens the channels and teams drawer');
    });

    test('Should have the correct accessibilityLabel', () => {
        const wrapper = shallowWithIntl(
            <MainSidebarDrawerButton {...baseProps}/>,
        );
        expect(wrapper.props().accessibilityLabel).toEqual('Channels and teams');
    });
});
