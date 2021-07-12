// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {selectEmojisByName} from '@selectors/emojis';
import initialState from '@store/initial_state';
import {shallowWithIntl} from '@test/intl-test-helper';

import EmojiSuggestion from './emoji_suggestion';

jest.useFakeTimers();

describe('components/autocomplete/emoji_suggestion', () => {
    const state = {
        ...initialState,
        views: {
            recentEmojis: [],
        },
    };
    const emojis = selectEmojisByName(state);
    const baseProps = {
        actions: {
            addReactionToLatestPost: jest.fn(),
            autocompleteCustomEmojis: jest.fn(),
        },
        cursorPosition: 0,
        customEmojisEnabled: false,
        emojis,
        isSearch: false,
        theme: Preferences.THEMES.default,
        onChangeText: jest.fn(),
        onResultCountChange: jest.fn(),
        rootId: '',
        value: '',
        nestedScrollEnabled: false,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<EmojiSuggestion {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();

        wrapper.setProps({cursorPosition: 1, value: ':1'});
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('searchEmojis should return the right values on fuse', () => {
        const output1 = ['100', '1234', '1st_place_medal', '+1', '-1', 'clock1', 'clock10', 'clock1030', 'clock11', 'clock1130', 'clock12', 'clock1230', 'clock130', 'u7121', 'u7981'];
        const output2 = ['+1'];
        const output4 = ['checkered_flag', 'ballot_box_with_check', 'heavy_check_mark', 'white_check_mark'];

        const wrapper = shallowWithIntl(<EmojiSuggestion {...baseProps}/>);
        wrapper.instance().searchEmojis('');
        expect(wrapper.state('dataSource')).toEqual(baseProps.emojis);

        wrapper.instance().searchEmojis('1');
        jest.runAllTimers();
        setTimeout(() => {
            expect(wrapper.state('dataSource')).toEqual(output1);
        }, 100);

        wrapper.instance().searchEmojis('+');
        jest.runAllTimers();
        setTimeout(() => {
            expect(wrapper.state('dataSource')).toEqual(output2);
        }, 100);

        wrapper.instance().searchEmojis('check');
        jest.runAllTimers();
        setTimeout(() => {
            expect(wrapper.state('dataSource')).toEqual(output4);
        }, 100);
    });
});
