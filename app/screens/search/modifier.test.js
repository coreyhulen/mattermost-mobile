// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import Modifier from './modifier';

describe('Search RecentItem', () => {
    const item = {
        value: 'in:',
        modifier: 'channel-name',
        description: 'to find posts in specific channels',
    };

    const baseProps = {
        item,
        setModifierValue: jest.fn(),
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot and respond to events', () => {
        const wrapper = shallow(
            <Modifier {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        wrapper.find('ForwardRef').first().props().onPress();
        expect(baseProps.setModifierValue).toHaveBeenCalledTimes(1);
        expect(baseProps.setModifierValue).toHaveBeenCalledWith(item.value);
    });
});
