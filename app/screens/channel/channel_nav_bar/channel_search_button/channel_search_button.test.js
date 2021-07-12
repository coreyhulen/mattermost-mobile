// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {TouchableOpacity} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import ChannelSearchButton from './channel_search_button';

describe('ChannelSearchButton', () => {
    const baseProps = {
        actions: {clearSearch: jest.fn()},
        theme: Preferences.THEMES.default,
    };

    test('should match, full snapshot', () => {
        const wrapper = shallowWithIntl(
            <ChannelSearchButton {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(TouchableOpacity).first().exists()).toEqual(true);
    });

    test('Should be accessible', () => {
        const wrapper = shallowWithIntl(
            <ChannelSearchButton {...baseProps}/>,
        );
        expect(wrapper.find(TouchableOpacity).first().props().accessible).toBeTruthy();
    });

    test('Should have the correct accessibilityHint', () => {
        const wrapper = shallowWithIntl(
            <ChannelSearchButton {...baseProps}/>,
        );
        expect(wrapper.find(TouchableOpacity).first().props().accessibilityHint).toEqual('Opens the channel search modal');
    });

    test('Should have the correct accessibilityLabel', () => {
        const wrapper = shallowWithIntl(
            <ChannelSearchButton {...baseProps}/>,
        );
        expect(wrapper.find(TouchableOpacity).first().props().accessibilityLabel).toEqual('Search');
    });
});
