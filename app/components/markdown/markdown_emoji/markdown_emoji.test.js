// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

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
});
