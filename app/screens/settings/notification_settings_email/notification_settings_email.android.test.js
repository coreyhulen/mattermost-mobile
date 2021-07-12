// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import RadioButtonGroup from '@components/radio_button';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import NotificationSettingsEmailAndroid from './notification_settings_email.android.js';

describe('NotificationSettingsEmailAndroid', () => {
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

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid {...baseProps}/>,
        );

        const style = {
            divider: {},
            modal: {},
            modalBody: {},
            modalTitleContainer: {},
            modalTitle: {},
            modalOptionDisabled: {},
            modalHelpText: {},
            modalFooter: {},
            modalFooterContainer: {},
            modalFooterOptionContainer: {},
            modalFooterOption: {},
        };

        expect(wrapper.instance().renderEmailSection()).toMatchSnapshot();
        expect(wrapper.instance().renderEmailNotificationsModal(style)).toMatchSnapshot();
    });

    test('should match state on setEmailInterval', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid {...baseProps}/>,
        );

        wrapper.setState({interval: '0'});
        wrapper.instance().setEmailInterval('30');
        expect(wrapper.state({interval: '30'}));

        wrapper.instance().setEmailInterval('0');
        expect(wrapper.state({interval: '0'}));

        wrapper.instance().setEmailInterval('3600');
        expect(wrapper.state({interval: '3600'}));
    });

    test('should match state on select of RadioButtonGroup', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid
                {...baseProps}
                sendEmailNotifications={false}
            />,
        );
        expect(wrapper.find(RadioButtonGroup).exists()).toBe(false);
        wrapper.setProps({sendEmailNotifications: true});
        expect(wrapper.find(RadioButtonGroup).exists()).toBe(true);

        wrapper.setState({email: 'false', interval: '0'});

        wrapper.find(RadioButtonGroup).first().prop('onSelect')('30');
        expect(wrapper.state({email: 'true', interval: '30'}));

        wrapper.find(RadioButtonGroup).first().prop('onSelect')('0');
        expect(wrapper.state({email: 'false', interval: '0'}));

        wrapper.find(RadioButtonGroup).first().prop('onSelect')('3600');
        expect(wrapper.state({email: 'true', interval: '3600'}));
    });

    test('should match state on handleClose', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid {...baseProps}/>,
        );

        wrapper.setState({showEmailNotificationsModal: true, interval: '30', newInterval: '3600'});
        wrapper.instance().handleClose();
        expect(wrapper.state('showEmailNotificationsModal')).toEqual(false);
        expect(wrapper.state('newInterval')).toEqual('30');
    });

    test('should saveEmailNotifyProps and handleClose on handleSaveEmailNotification', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid {...baseProps}/>,
        );

        const instance = wrapper.instance();
        instance.saveEmailNotifyProps = jest.fn();

        instance.handleSaveEmailNotification();
        expect(instance.saveEmailNotifyProps).toHaveBeenCalledTimes(1);
    });

    test('should call actions.updateMe and actions.savePreferences on saveEmailNotifyProps', () => {
        const savePreferences = jest.fn();
        const updateMe = jest.fn();
        const props = {...baseProps, actions: {savePreferences, updateMe}};
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid {...props}/>,
        );

        wrapper.setState({email: 'true', newInterval: 30});
        wrapper.instance().saveEmailNotifyProps();

        expect(updateMe).toHaveBeenCalledTimes(1);
        expect(updateMe.mock.calls[0][0].notify_props.email).toBe('true');

        expect(savePreferences).toHaveBeenCalledTimes(1);
        expect(savePreferences).toBeCalledWith('current_user_id', [{category: 'notifications', name: 'email_interval', user_id: 'current_user_id', value: 30}]);
    });

    test('should match state on showEmailModal', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid {...baseProps}/>,
        );

        wrapper.setState({showEmailNotificationsModal: false});
        wrapper.instance().showEmailModal();
        expect(wrapper.state('showEmailNotificationsModal')).toEqual(true);
    });

    test('should not save preference on back button on Android', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsEmailAndroid {...baseProps}/>,
        );

        const instance = wrapper.instance();
        instance.saveEmailNotifyProps = jest.fn();
        instance.getPlatformOS = jest.fn(() => 'android');

        // Back button on Android should close the modal and trigger
        // componentDidDisappear.
        // Should not save preference on back button on Android as
        // saving email preference on Android is done via Save button
        instance.componentDidDisappear();
        expect(instance.saveEmailNotifyProps).toHaveBeenCalledTimes(0);

        wrapper.setState({newInterval: '0'});
        instance.componentDidDisappear();
        expect(instance.saveEmailNotifyProps).toHaveBeenCalledTimes(0);
    });
});
