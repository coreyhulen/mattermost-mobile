// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';
import {Animated, Text} from 'react-native';

import Fade from './fade';

jest.useFakeTimers();

describe('Fade', () => {
    const baseProps = {
        visible: true,
        disabled: true,
    };

    function getWrapper(props = {}) {
        const dummyText = 'text';

        return shallow(
            <Fade
                {...baseProps}
                {...props}
            >
                <Text>{dummyText}</Text>
            </Fade>,
        );
    }

    test('should render {opacity: 1}', () => {
        const wrapper = getWrapper({visible: true});

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper).toHaveStyle('opacity', new Animated.Value(1));
    });

    test('should render {opacity: 0}', () => {
        const wrapper = getWrapper({visible: false});

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper).toHaveStyle('opacity', new Animated.Value(0));
    });

    test('should not change opacity when disabled flag is switched', () => {
        const wrapper = getWrapper({disabled: false});

        expect(wrapper).toHaveStyle('opacity', new Animated.Value(1));
        wrapper.setProps({disabled: true});
        expect(wrapper).toHaveStyle('opacity', new Animated.Value(1));
    });

    test('should not change opacity when props stay the same', () => {
        const wrapper = getWrapper({visible: true});

        expect(wrapper).toHaveStyle('opacity', new Animated.Value(1));
        wrapper.setProps({visible: true});
        expect(wrapper).toHaveStyle('opacity', new Animated.Value(1));
    });
});
