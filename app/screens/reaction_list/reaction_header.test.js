// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';
import {ScrollView} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';

import ReactionHeader from './reaction_header';

describe('ReactionHeader', () => {
    const baseProps = {
        selected: 'smile',
        onSelectReaction: jest.fn(),
        reactions: [{name: 'smile', count: 2}, {name: '+1', count: 1}],
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <ReactionHeader {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(ScrollView).exists()).toEqual(true);
    });

    test('should match snapshot, renderContent', () => {
        const wrapper = shallow(
            <ReactionHeader {...baseProps}/>,
        );

        expect(wrapper.instance().renderReactionHeaderItems()).toMatchSnapshot();
    });

    test('should call props.onSelectReaction on handlePress', () => {
        const onSelectReaction = jest.fn();
        const wrapper = shallow(
            <ReactionHeader
                {...baseProps}
                onSelectReaction={onSelectReaction}
            />,
        );

        wrapper.instance().handleOnPress();
        expect(onSelectReaction).toHaveBeenCalledTimes(1);
    });
});
