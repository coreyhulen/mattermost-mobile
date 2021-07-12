// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import {General} from '@mm-redux/constants';
import Preferences from '@mm-redux/constants/preferences';

import UserStatus from './user_status';

describe('UserStatus', () => {
    const baseProps = {
        size: 32,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot, should default to offline status', () => {
        const wrapper = shallow(
            <UserStatus {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot, away status', () => {
        const wrapper = shallow(
            <UserStatus
                {...baseProps}
                status={General.AWAY}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot, dnd status', () => {
        const wrapper = shallow(
            <UserStatus
                {...baseProps}
                status={General.DND}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot, online status', () => {
        const wrapper = shallow(
            <UserStatus
                {...baseProps}
                status={General.ONLINE}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
