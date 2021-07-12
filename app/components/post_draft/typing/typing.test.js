// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';
import {Animated} from 'react-native';

import {TYPING_VISIBLE} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';

import Typing from './typing';

describe('Typing', () => {
    const baseProps = {
        typing: ['user1', 'user2'],
        theme: {
            centerChannelColor: 'blue',
        },
        registerTypingAnimation: jest.fn(() => {
            return jest.fn();
        }),
    };

    EventEmitter.emit = jest.fn();

    test('should render component without error', () => {
        const wrapper = shallow(
            <Typing {...baseProps}/>,
        );

        expect(wrapper.find(Animated.View).exists()).toBe(true);
    });

    test('should not emit TYPING_VISIBLE when typing props is not empty and previous is not empty', () => {
        const props = {
            ...baseProps,
            typing: ['user2'],
        };
        const wrapper = shallow(
            <Typing {...props}/>,
        );

        wrapper.setProps({typing: ['user2 and user3']});
        expect(EventEmitter.emit).not.toHaveBeenCalled();
    });

    test('should emit TYPING_VISIBLE with true when typing props is not empty and previous is empty', () => {
        const props = {
            ...baseProps,
            typing: [],
        };
        const wrapper = shallow(
            <Typing {...props}/>,
        );

        wrapper.setProps({typing: ['user2']});
        expect(EventEmitter.emit).toHaveBeenCalledWith(TYPING_VISIBLE, true);
    });

    test('should emit TYPING_VISIBLE with false when typing props is empty', () => {
        const wrapper = shallow(
            <Typing {...baseProps}/>,
        );

        wrapper.setProps({typing: []});
        expect(EventEmitter.emit).toHaveBeenCalledWith(TYPING_VISIBLE, false);
    });

    test('should add/remove typing animation on mount/unmount', () => {
        const wrapper = shallow(
            <Typing {...baseProps}/>,
        );
        const instance = wrapper.instance();

        expect(baseProps.registerTypingAnimation).toHaveBeenCalledTimes(1);
        expect(instance.removeTypingAnimation).not.toHaveBeenCalled();

        wrapper.unmount();
        expect(instance.removeTypingAnimation).toHaveBeenCalledTimes(1);
    });
});
