// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import SlideUpPanel from '@components/slide_up_panel';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import ReactionList from './reaction_list';

describe('ReactionList', () => {
    const baseProps = {
        actions: {
            getMissingProfilesByIds: jest.fn(),
        },
        allUserIds: ['user_id_1', 'user_id_2'],
        reactions: {'user_id_1-smile': {emoji_name: 'smile', user_id: 'user_id_1'}, 'user_id_2-+1': {emoji_name: '+1', user_id: 'user_id_2'}},
        theme: Preferences.THEMES.default,
        teammateNameDisplay: 'username',
        userProfiles: [{id: 'user_id_1', username: 'username_1'}, {id: 'user_id_2', username: 'username_2'}],
        componentId: 'component-id',
        isLandscape: false,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ReactionList {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(SlideUpPanel).exists()).toEqual(true);
    });

    test('should match snapshot, renderReactionRows', () => {
        const wrapper = shallowWithIntl(
            <ReactionList {...baseProps}/>,
        );

        expect(wrapper.instance().renderReactionRows()).toMatchSnapshot();
    });

    test('should match state on handleOnSelectReaction', () => {
        const wrapper = shallowWithIntl(
            <ReactionList {...baseProps}/>,
        );

        wrapper.setState({selected: 'smile'});
        wrapper.instance().handleOnSelectReaction('+1');
        expect(wrapper.state('selected')).toEqual('+1');
    });
});
