// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import ReactionPicker from './reaction_picker';

describe('Reactions', () => {
    const baseProps = {
        addReaction: jest.fn(),
        openReactionScreen: jest.fn(),
        recentEmojis: [],
        theme: Preferences.THEMES.default,
    };

    test('Should match snapshot with default emojis', () => {
        const wrapper = shallow(<ReactionPicker {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('Should match snapshot with default emojis', () => {
        const props = {
            ...baseProps,
            recentEmojis: [
                'rocket',
                '100',
            ],
        };
        const wrapper = shallow(<ReactionPicker {...props}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
