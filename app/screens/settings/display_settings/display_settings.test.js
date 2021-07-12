// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {DeviceTypes} from '@constants';
import Preferences from '@mm-redux/constants/preferences';
import SettingsItem from '@screens/settings/settings_item';
import {shallowWithIntl} from '@test/intl-test-helper';

import DisplaySettings from './display_settings';

describe('DisplaySettings', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        enableTheme: false,
        enableTimezone: false,
        componentId: 'component-id',
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <DisplaySettings {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(SettingsItem).length).toBe(1);
        wrapper.setProps({enableTheme: true});
        expect(wrapper.find(SettingsItem).length).toBe(2);
        wrapper.setProps({enableTimezone: true});
        expect(wrapper.find(SettingsItem).length).toBe(3);
    });

    test('should match snapshot on Tablet devices', () => {
        DeviceTypes.IS_TABLET = true;

        const wrapper = shallowWithIntl(
            <DisplaySettings {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(SettingsItem).length).toBe(2);
        wrapper.setProps({enableTheme: true});
        expect(wrapper.find(SettingsItem).length).toBe(3);
        wrapper.setProps({enableTimezone: true});
        expect(wrapper.find(SettingsItem).length).toBe(4);
    });
});
