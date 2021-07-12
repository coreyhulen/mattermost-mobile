// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {General} from '@mm-redux/constants';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Leave from './leave';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> Leave', () => {
    const baseProps = {
        canLeave: true,
        currentChannel: {
            id: '1234',
            display_name: 'Channel Name',
            type: General.OPEN_CHANNEL,
            create_at: 123,
            delete_at: 0,
            header: '',
            purpose: 'Purpose',
            group_constrained: false,
        },
        close: jest.fn(),
        closeDMChannel: jest.fn(),
        closeGMChannel: jest.fn(),
        displayName: 'Channel Name',
        leaveChannel: jest.fn(),
        isDirectMessage: false,
        isFavorite: false,
        isGroupMessage: false,
        isPublic: true,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot for Leave Public Channel', () => {
        const wrapper = shallowWithIntl(
            <Leave
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Leave Private Channel', () => {
        const wrapper = shallowWithIntl(
            <Leave
                {...baseProps}
                isPublic={false}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Close DM', () => {
        const wrapper = shallowWithIntl(
            <Leave
                {...baseProps}
                canLeave={false}
                isDirectMessage={true}
                isPublic={false}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Close GM', () => {
        const wrapper = shallowWithIntl(
            <Leave
                {...baseProps}
                canLeave={false}
                isGroupMessage={true}
                isPublic={false}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should render null if cannot leave', () => {
        const wrapper = shallowWithIntl(
            <Leave
                {...baseProps}
                canLeave={false}
            />,
        );
        expect(wrapper.getElement()).toBeNull();
    });
});
