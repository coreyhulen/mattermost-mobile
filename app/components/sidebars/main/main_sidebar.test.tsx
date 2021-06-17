// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {DeviceTypes} from '@constants';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from 'test/intl-test-helper';

import MainSidebar from './main_sidebar.ios';

describe('MainSidebar', () => {
    const baseProps = {
        actions: {
            getTeams: jest.fn(),
            makeDirectChannel: jest.fn(),
            setChannelDisplayName: jest.fn(),
            setChannelLoading: jest.fn(),
            joinChannel: jest.fn(),
        },
        blurPostTextBox: jest.fn(),
        currentTeamId: 'current-team-id',
        currentUserId: 'current-user-id',
        deviceWidth: 10,
        isLandscape: false,
        teamsCount: 2,
        theme: Preferences.THEMES.default,
    };

    const loadShallow = (props) => {
        return shallowWithIntl(
            <MainSidebar {...(props || baseProps)}/>,
        );
    };

    test('should match, full snapshot', () => {
        const wrapper = loadShallow();

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should not set the permanentSidebar state if not Tablet', () => {
        const wrapper = loadShallow();

        wrapper.instance().handlePermanentSidebar();
        expect(wrapper.state('permanentSidebar')).toBeFalsy();
    });

    test('should set the permanentSidebar state if Tablet', async () => {
        const wrapper = loadShallow();

        DeviceTypes.IS_TABLET = true;

        await wrapper.instance().handlePermanentSidebar();

        expect(wrapper.state('permanentSidebar')).toBeDefined();

        // Reset to false for subsequent tests
        DeviceTypes.IS_TABLET = false;
    });

    test('should re-render when the theme changes', () => {
        const theme = Preferences.THEMES.default;
        const newTheme = Preferences.THEMES.organization;
        const props = {
            ...baseProps,
            theme,
        };

        const wrapper = loadShallow(props);

        const instance = wrapper.instance();
        instance.render = jest.fn();

        expect(instance.render).toHaveBeenCalledTimes(0);
        wrapper.setProps({theme: newTheme});
        expect(instance.render).toHaveBeenCalledTimes(1);
    });
});
