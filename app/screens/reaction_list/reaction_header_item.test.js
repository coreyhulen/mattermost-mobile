// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';
import {TouchableOpacity} from 'react-native';

import {ALL_EMOJIS} from '@constants/emoji';
import Preferences from '@mm-redux/constants/preferences';

import ReactionHeaderItem from './reaction_header_item';

describe('ReactionHeaderItem', () => {
    const baseProps = {
        count: 3,
        emojiName: 'smile',
        highlight: false,
        onPress: jest.fn(),
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <ReactionHeaderItem {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(TouchableOpacity).exists()).toEqual(true);
    });

    test('should match snapshot, renderContent', () => {
        const wrapper = shallow(
            <ReactionHeaderItem {...baseProps}/>,
        );

        expect(wrapper.instance().renderContent()).toMatchSnapshot();

        wrapper.setProps({emojiName: ALL_EMOJIS});
        expect(wrapper.instance().renderContent()).toMatchSnapshot();
    });

    test('should call props.onPress on handleOnPress', () => {
        const onPress = jest.fn();
        const wrapper = shallow(
            <ReactionHeaderItem
                {...baseProps}
                onPress={onPress}
            />,
        );

        wrapper.instance().handleOnPress();
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith(baseProps.emojiName, baseProps.highlight);
    });
});
