// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import UserListRow from './user_list_row';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('UserListRow', () => {
    const baseProps = {
        id: '123455',
        isMyUser: false,
        user: {
            id: '21345',
            username: 'user',
            delete_at: 0,
        },
        theme: Preferences.THEMES.default,
        teammateNameDisplay: 'test',
        testID: 'custom_list.user_item',
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <UserListRow {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for deactivated user', () => {
        const deactivatedUser = {
            id: '21345',
            username: 'user',
            delete_at: 100,
        };

        const newProps = {
            ...baseProps,
            user: deactivatedUser,
        };

        const wrapper = shallowWithIntl(
            <UserListRow {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for guest user', () => {
        const newProps = {
            ...baseProps,
            user: {
                ...baseProps.user,
                roles: 'system_guest',
            },
        };

        const wrapper = shallowWithIntl(
            <UserListRow {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for remote user', () => {
        const newProps = {
            ...baseProps,
            user: {
                ...baseProps.user,
                remote_id: 'abc123',
            },
        };

        const wrapper = shallowWithIntl(
            <UserListRow {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for  currentUser with (you) populated in list', () => {
        const newProps = {
            ...baseProps,
            isMyUser: true,
        };

        const wrapper = shallowWithIntl(
            <UserListRow {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
