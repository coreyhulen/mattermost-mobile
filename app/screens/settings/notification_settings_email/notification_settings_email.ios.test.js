// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import SectionItem from '@screens/settings/section_item';

import NotificationSettingsEmailIos from './notification_settings_email.ios.js';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('NotificationSettingsEmailIos', () => {
    const baseProps = {
        currentUser: {id: 'current_user_id'},
        notifyProps: {
            email: 'true',
        },
        emailInterval: '30',
        enableEmailBatching: false,
        actions: {
            updateMe: jest.fn(),
            savePreferences: jest.fn(),
        },
        sendEmailNotifications: true,
        theme: Preferences.THEMES.default,
        componentId: 'component-id',
    };

    test('should match snapshot, renderEmailSection', () => {
        const wrapper = shallow(
            <NotificationSettingsEmailIos {...baseProps}/>,
        );

        expect(wrapper.instance().renderEmailSection()).toMatchSnapshot();
    });

    test('should save preference on back button only if email interval has changed', () => {
        const wrapper = shallow(
            <NotificationSettingsEmailIos {...baseProps}/>,
        );

        const instance = wrapper.instance();

        // should not save preference if email interval has not changed.
        instance.componentDidDisappear();
        expect(baseProps.actions.updateMe).toHaveBeenCalledTimes(0);
        expect(baseProps.actions.savePreferences).toHaveBeenCalledTimes(0);

        // should save preference if email interval has changed.
        wrapper.setState({newInterval: '0'});
        instance.componentDidDisappear();
        expect(baseProps.actions.updateMe).toHaveBeenCalledTimes(1);
        expect(baseProps.actions.savePreferences).toHaveBeenCalledTimes(1);
    });

    test('should call actions.updateMe and actions.savePreferences on saveEmailNotifyProps', () => {
        const savePreferences = jest.fn();
        const updateMe = jest.fn();
        const props = {...baseProps, actions: {savePreferences, updateMe}};
        const wrapper = shallow(
            <NotificationSettingsEmailIos {...props}/>,
        );

        wrapper.setState({email: 'true', newInterval: 30});
        wrapper.instance().saveEmailNotifyProps();

        expect(updateMe).toHaveBeenCalledTimes(1);
        expect(updateMe.mock.calls[0][0].notify_props.email).toBe('true');

        expect(savePreferences).toHaveBeenCalledTimes(1);
        expect(savePreferences).toBeCalledWith('current_user_id', [{category: 'notifications', name: 'email_interval', user_id: 'current_user_id', value: 30}]);
    });

    test('should match state on setEmailInterval', () => {
        const wrapper = shallow(
            <NotificationSettingsEmailIos {...baseProps}/>,
        );

        wrapper.setState({interval: '0'});
        wrapper.instance().setEmailInterval('30');
        expect(wrapper.state({interval: '30'}));

        wrapper.instance().setEmailInterval('0');
        expect(wrapper.state({interval: '0'}));

        wrapper.instance().setEmailInterval('3600');
        expect(wrapper.state({interval: '3600'}));
    });

    test('should match state on action of SectionItem', () => {
        const wrapper = shallow(
            <NotificationSettingsEmailIos
                {...baseProps}
                sendEmailNotifications={false}
                enableEmailBatching={false}
            />,
        );

        expect(wrapper.find(SectionItem).exists()).toBe(false);

        wrapper.setProps({sendEmailNotifications: true});
        expect(wrapper.find(SectionItem).exists()).toBe(true);
        expect(wrapper.find(SectionItem).length).toBe(2);

        wrapper.setProps({enableEmailBatching: true});
        expect(wrapper.find(SectionItem).exists()).toBe(true);
        expect(wrapper.find(SectionItem).length).toBe(4);

        wrapper.setState({email: 'false', interval: '0'});

        wrapper.find(SectionItem).first().prop('action')('30');
        expect(wrapper.state({email: 'true', interval: '30'}));

        wrapper.find(SectionItem).first().prop('action')('0');
        expect(wrapper.state({email: 'true', interval: '0'}));

        wrapper.find(SectionItem).last().prop('action')('3600');
        expect(wrapper.state({email: 'true', interval: '3600'}));
    });

    test('should call props.actions.savePreferences on saveUserNotifyProps', () => {
        const props = {...baseProps, actions: {savePreferences: jest.fn(), updateMe: jest.fn()}};
        const wrapper = shallow(
            <NotificationSettingsEmailIos {...props}/>,
        );

        wrapper.setState({email: 'true', newInterval: '3600'});
        wrapper.instance().saveEmailNotifyProps();
        expect(props.actions.savePreferences).toHaveBeenCalledTimes(1);
        expect(props.actions.savePreferences).toBeCalledWith(
            'current_user_id',
            [{category: 'notifications', name: 'email_interval', user_id: 'current_user_id', value: '3600'}],
        );
    });
});
