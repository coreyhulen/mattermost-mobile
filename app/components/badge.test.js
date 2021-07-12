// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';
import {Text, TouchableWithoutFeedback} from 'react-native';

import Badge from './badge';

describe('Badge', () => {
    const baseProps = {
        testID: 'badge',
        count: 100,
        countStyle: {color: '#145dbf', fontSize: 10},
        style: {backgroundColor: '#ffffff'},
        containerStyle: {borderColor: '#000000'},
        onPress: jest.fn(),
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <Badge {...baseProps}/>,
        );

        expect(wrapper.instance().renderText()).toMatchSnapshot();
        expect(wrapper.find(TouchableWithoutFeedback).exists()).toEqual(true);
        expect(wrapper.find(Text).first().props().children).toContain('99+');
    });
});
