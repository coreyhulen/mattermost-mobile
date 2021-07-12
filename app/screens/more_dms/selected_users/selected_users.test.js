// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import SelectedUsers from './selected_users.js';

describe('SelectedUsers', () => {
    const baseProps = {
        onRemove: jest.fn(),
        maxCount: 3,
        profiles: {
            userId1: {
                id: 'userId1',
            },
            userId2: {
                id: 'userId2',
            },
            userId3: {
                id: 'userId3',
            },
        },
        selectedIds: {
            userId1: true,
        },
        theme: Preferences.THEMES.default,
        teammateNameDisplay: 'full_name',
        warnCount: 1,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <SelectedUsers {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot to show warning for ability to add one more user', () => {
        const props = {
            ...baseProps,
            selectedIds: {
                userId2: true,
                userId1: true,
            },
        };

        const wrapper = shallow(
            <SelectedUsers {...props}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for no warning message', () => {
        const props = {
            ...baseProps,
            warnCount: 2,
        };

        const wrapper = shallow(
            <SelectedUsers {...props}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
