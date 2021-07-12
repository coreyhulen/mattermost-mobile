// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Autocomplete from '@components/autocomplete';
import Preferences from '@mm-redux/constants/preferences';

import EditChannelInfo from './index';

describe('EditChannelInfo', () => {
    const baseProps = {
        testID: 'edit_channel_info',
        theme: Preferences.THEMES.default,
        deviceWidth: 400,
        deviceHeight: 600,
        channelType: 'O',
        enableRightButton: jest.fn(),
        saving: false,
        editing: true,
        error: '',
        displayName: 'display_name',
        currentTeamUrl: '/team_a',
        channelURL: '/team_a/channels/channel_a',
        purpose: 'purpose',
        header: 'header',
        isLandscape: false,
        onDisplayNameChange: jest.fn(),
        onChannelURLChange: jest.fn(),
        onPurposeChange: jest.fn(),
        onHeaderChange: jest.fn(),
        oldDisplayName: 'old_display_name',
        oldChannelURL: '/team_a/channels/channel_old',
        oldHeader: 'old_header',
        oldPurpose: 'old_purpose',
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <EditChannelInfo {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should have called onHeaderChangeText on text change from Autocomplete', () => {
        const wrapper = shallow(
            <EditChannelInfo {...baseProps}/>,
        );

        const instance = wrapper.instance();
        instance.enableRightButton = jest.fn();

        const autocomplete = wrapper.find(Autocomplete);

        expect(autocomplete.exists()).toEqual(true);
        expect(autocomplete.props().value).toEqual('header');
        expect(autocomplete.props().cursorPosition).toEqual(6);
        expect(autocomplete.props().nestedScrollEnabled).toEqual(true);

        autocomplete.props().onChangeText('header');
        expect(baseProps.onHeaderChange).toHaveBeenCalledTimes(1);
        expect(baseProps.onHeaderChange).toHaveBeenCalledWith('header');
        expect(instance.enableRightButton).toHaveBeenCalledTimes(1);
        expect(instance.enableRightButton).toHaveBeenCalledWith(true);
    });

    test('should call scrollHeaderToTop', () => {
        const wrapper = shallow(
            <EditChannelInfo {...baseProps}/>,
        );

        const instance = wrapper.instance();
        instance.scrollHeaderToTop = jest.fn();

        expect(instance.scrollHeaderToTop).not.toHaveBeenCalled();

        wrapper.setState({keyboardVisible: false});
        instance.onHeaderFocus();
        expect(instance.scrollHeaderToTop).not.toHaveBeenCalled();

        wrapper.setState({keyboardVisible: true});
        instance.onHeaderFocus();
        expect(instance.scrollHeaderToTop).toHaveBeenCalledTimes(1);

        wrapper.setState({headerHasFocus: false});
        instance.onKeyboardDidShow();
        expect(instance.scrollHeaderToTop).toHaveBeenCalledTimes(1);

        wrapper.setState({headerHasFocus: true});
        instance.onKeyboardDidShow();
        expect(instance.scrollHeaderToTop).toHaveBeenCalledTimes(2);
    });
});
