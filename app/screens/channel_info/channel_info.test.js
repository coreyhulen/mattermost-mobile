// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {shallow} from 'enzyme';

import * as NavigationActions from '@actions/navigation';
import Preferences from '@mm-redux/constants/preferences';
import {General} from '@mm-redux/constants';

import ChannelInfo from './channel_info';
import NotificationPreference from './notification_preference';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('channelInfo', () => {
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
        currentChannelCreatorName: 'Creator',
        currentChannelMemberCount: 2,
        currentChannelGuestCount: 0,
        currentUserId: '1234',
        theme: Preferences.THEMES.default,
        isTeammateGuest: false,
        isDirectMessage: false,
        isLandscape: false,
        isCustomStatusEnabled: false,
        isCustomStatusExpired: false,
        actions: {
            getChannelStats: jest.fn(),
            getCustomEmojisInText: jest.fn(),
            showPermalink: jest.fn(),
            setChannelDisplayName: jest.fn(),
        },
    };

    test('should match snapshot', async () => {
        const wrapper = shallow(
            <ChannelInfo
                {...baseProps}
            />,
            {context: {intl: intlMock}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should dismiss modal on close', () => {
        const dismissModal = jest.spyOn(NavigationActions, 'dismissModal');
        const wrapper = shallow(
            <ChannelInfo
                {...baseProps}
            />,
            {context: {intl: intlMock}},
        );

        const instance = wrapper.instance();
        expect(dismissModal).not.toHaveBeenCalled();
        instance.close();
        expect(dismissModal).toHaveBeenCalled();
    });

    test('should not include NotificationPreference for direct message', () => {
        const wrapper = shallow(
            <ChannelInfo
                {...baseProps}
            />,
            {context: {intl: intlMock}},
        );

        expect(wrapper.instance().actionsRows()).toMatchSnapshot();
        expect(wrapper.find(NotificationPreference).exists()).toEqual(true);

        wrapper.setProps({isDirectMessage: true});
        expect(wrapper.instance().actionsRows()).toMatchSnapshot();
        expect(wrapper.find(NotificationPreference).exists()).toEqual(false);
    });
});
