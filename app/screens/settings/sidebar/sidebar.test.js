// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import MainSidebar from '@components/sidebars/main/main_sidebar.ios';
import {DeviceTypes} from '@constants';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import SidebarSettings from './index';

jest.mock('app/mattermost_managed', () => ({
    isRunningInSplitView: jest.fn().mockResolvedValue(false),
    addEventListener: jest.fn(),
}));

describe('SidebarSettings', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
    };

    test('should match, full snapshot', async () => {
        const wrapper = shallowWithIntl(
            <SidebarSettings {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();

        await wrapper.instance().loadSetting();
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should set the Permanent Sidebar value to false', async () => {
        const wrapper = shallowWithIntl(
            <SidebarSettings {...baseProps}/>,
        );

        await wrapper.instance().loadSetting();
        expect(wrapper.state('enabled')).toBe(false);
    });

    test('should set the Permanent Sidebar value to true and update the sidebar', async () => {
        DeviceTypes.IS_TABLET = true;

        const wrapper = shallowWithIntl(
            <SidebarSettings {...baseProps}/>,
        );

        const mainProps = {
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

        const mainSidebar = shallowWithIntl(
            <MainSidebar {...mainProps}/>,
        );

        await wrapper.instance().loadSetting();
        expect(wrapper.state('enabled')).toBe(false);

        await wrapper.instance().saveSetting(true);

        expect(wrapper.state('enabled')).toBe(true);
        expect(mainSidebar.state('permanentSidebar')).toBe(true);
    });
});
