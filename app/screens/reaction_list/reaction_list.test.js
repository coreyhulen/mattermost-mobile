// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {shallow} from 'enzyme';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

import ReactionList from './reaction_list';

jest.mock('react-intl');

describe('ReactionList', () => {
    const baseProps = {
        actions: {
            getMissingProfilesByIds: jest.fn(),
        },
        allUserIds: ['user_id_1', 'user_id_2'],
        navigator: {setOnNavigatorEvent: jest.fn()},
        reactions: [{emoji_name: 'smile', user_id: 'user_id_1'}, {emoji_name: '+1', user_id: 'user_id_2'}],
        theme: {
            centerChannelBg: '#aaa',
            centerChannelColor: '#eee',
        },
        teammateNameDisplay: 'username',
        userProfiles: [{id: 'user_id_1', username: 'username_1'}, {id: 'user_id_2', username: 'username_2'}],
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <ReactionList {...baseProps}/>,
            {context: {intl: {formatMessage: jest.fn()}}},
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(KeyboardAwareScrollView).exists()).toEqual(true);
    });

    test('should match snapshot, renderReactionRows', () => {
        const wrapper = shallow(
            <ReactionList {...baseProps}/>,
            {context: {intl: {formatMessage: jest.fn()}}},
        );

        expect(wrapper.instance().renderReactionRows()).toMatchSnapshot();
    });

    test('should match state on handleOnSelectReaction', () => {
        const wrapper = shallow(
            <ReactionList {...baseProps}/>,
            {context: {intl: {formatMessage: jest.fn()}}},
        );

        wrapper.setState({selected: 'smile'});
        wrapper.instance().handleOnSelectReaction('+1');
        expect(wrapper.state('selected')).toEqual('+1');
    });
});
