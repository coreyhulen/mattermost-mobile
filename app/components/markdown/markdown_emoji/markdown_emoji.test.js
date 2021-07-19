// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';

import MarkdownEmoji from './markdown_emoji';

describe('MarkdownEmoji', () => {
    const baseProps = {
        baseTextStyle: {color: '#3d3c40', fontSize: 15, lineHeight: 20},
        isEdited: false,
        isJumboEmoji: true,
        theme: Preferences.THEMES.default,
        value: ':smile:',
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <MarkdownEmoji {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should render with hardbreaks', () => {
        const wrapper = shallow(
            <MarkdownEmoji
                {...baseProps}
                value={`:fire: :fire:       
               :fire: :fire: :fire:
               `}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
