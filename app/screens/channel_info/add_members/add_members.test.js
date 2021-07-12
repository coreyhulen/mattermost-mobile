// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import AddMembers from './add_members';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> Add Members', () => {
    const baseProps = {
        canManageUsers: true,
        groupConstrained: false,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <AddMembers
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should render null if cannot manage members', () => {
        const wrapper = shallowWithIntl(
            <AddMembers
                {...baseProps}
                canManageUsers={false}
            />,
        );
        expect(wrapper.getElement()).toBeNull();
    });

    test('should render null if channel is constrained to groups', () => {
        const wrapper = shallowWithIntl(
            <AddMembers
                {...baseProps}
                groupConstrained={true}
            />,
        );
        expect(wrapper.getElement()).toBeNull();
    });
});
