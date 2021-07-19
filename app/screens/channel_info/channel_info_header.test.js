// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {shallow} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';
import {General} from '@mm-redux/constants';
import {CustomStatusDuration} from '@mm-redux/types/users';

import ChannelInfoHeader from './channel_info_header.js';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('channel_info_header', () => {
    const intlMock = {
        formatMessage: jest.fn(),
        formatDate: jest.fn(),
        formatTime: jest.fn(),
        formatRelative: jest.fn(),
        formatNumber: jest.fn(),
        formatPlural: jest.fn(),
        formatHTMLMessage: jest.fn(),
        now: jest.fn(),
    };
    const baseProps = {
        createAt: 123,
        creator: 'Creator',
        memberCount: 3,
        displayName: 'Channel name',
        header: 'Header string',
        purpose: 'Purpose string',
        status: 'status',
        theme: Preferences.THEMES.default,
        type: General.OPEN_CHANNEL,
        isArchived: false,
        isBot: false,
        isTeammateGuest: false,
        hasGuests: false,
        isGroupConstrained: false,
        testID: 'channel_info.header',
        isCustomStatusEnabled: false,
        isCustomStatusExpired: false,
        isCustomStatusExpirySupported: false,
    };

    test('should match snapshot', async () => {
        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when is group constrained', async () => {
        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
                isGroupConstrained={true}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when public channel and hasGuests', async () => {
        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
                hasGuests={true}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when DM and hasGuests but its me and not the teammate', async () => {
        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
                type={General.DM_CHANNEL}
                hasGuests={true}
                isTeammateGuest={false}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when DM and hasGuests and is the teammate', async () => {
        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
                type={General.DM_CHANNEL}
                hasGuests={true}
                isTeammateGuest={true}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when GM and hasGuests', async () => {
        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
                type={General.GM_CHANNEL}
                hasGuests={true}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with custom status enabled', async () => {
        const customStatus = {
            emoji: 'calendar',
            text: 'In a meeting',
            duration: CustomStatusDuration.DONT_CLEAR,
        };

        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
                isCustomStatusEnabled={true}
                type={General.DM_CHANNEL}
                customStatus={customStatus}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with custom status expiry', () => {
        const customStatus = {
            emoji: 'calendar',
            text: 'In a meeting',
            duration: CustomStatusDuration.DATE_AND_TIME,
            expires_at: '2200-04-13T18:09:12.451Z',
        };

        const wrapper = shallow(
            <ChannelInfoHeader
                {...baseProps}
                isCustomStatusEnabled={true}
                isCustomStatusExpirySupported={true}
                type={General.DM_CHANNEL}
                customStatus={customStatus}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
