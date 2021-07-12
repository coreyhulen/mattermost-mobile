// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import ManageMembers from './manage_members';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> Manage Members', () => {
    const baseProps = {
        canManageUsers: true,
        isDirectMessage: false,
        membersCount: 10,
        separator: true,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot for Manage Members', () => {
        const wrapper = shallowWithIntl(
            <ManageMembers
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot without separator', () => {
        const wrapper = shallowWithIntl(
            <ManageMembers
                {...baseProps}
                separator={false}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for View Members', () => {
        const wrapper = shallowWithIntl(
            <ManageMembers
                {...baseProps}
                canManageUsers={false}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should render null if channel is DM', () => {
        const wrapper = shallowWithIntl(
            <ManageMembers
                {...baseProps}
                isDirectMessage={true}
            />,
        );
        expect(wrapper.getElement()).toBeNull();
    });
});
