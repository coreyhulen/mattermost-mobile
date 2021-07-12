// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import RecentItem from './recent_item';

describe('Search RecentItem', () => {
    const item = {
        terms: 'test',
    };

    const baseProps = {
        item,
        removeSearchTerms: jest.fn(),
        setRecentValue: jest.fn(),
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot and respond to events', () => {
        const wrapper = shallow(
            <RecentItem {...baseProps}/>,
        );

        expect(wrapper).toMatchSnapshot();
        wrapper.find('ForwardRef').first().props().onPress();
        expect(baseProps.setRecentValue).toHaveBeenCalledTimes(1);
        expect(baseProps.setRecentValue).toHaveBeenCalledWith(item);
        wrapper.find('ForwardRef').at(1).props().onPress();
        expect(baseProps.setRecentValue).toHaveBeenCalledTimes(1);
        expect(baseProps.setRecentValue).toHaveBeenCalledWith(item);
    });
});
