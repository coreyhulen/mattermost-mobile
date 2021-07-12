// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import Avatars from './avatars';

describe('Avatars', () => {
    test('should match snapshot for single avatar', () => {
        const baseProps = {
            theme: Preferences.THEMES.default,
            userIds: ['user1'],
        };

        const wrapper = shallow(<Avatars {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for overflow', () => {
        const baseProps = {
            theme: Preferences.THEMES.default,
            userIds: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6'],
        };

        const wrapper = shallow(<Avatars {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
