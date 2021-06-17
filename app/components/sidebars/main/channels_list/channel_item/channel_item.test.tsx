// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {TouchableHighlight} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from 'test/intl-test-helper';

import ChannelItem from './channel_item';

jest.useFakeTimers();

describe('ChannelItem', () => {
    const channel = {
        id: 'channel_id',
        delete_at: 0,
        type: 'O',
        fake: false,
        status: 'online',
    };

    const baseProps = {
        testID: 'main.sidebar.channels_list.list.channel_item',
        channelId: 'channel_id',
        channel,
        currentChannelId: 'current_channel_id',
        displayName: 'display_name',
        isChannelMuted: false,
        currentUserId: 'currentUser',
        isManualUnread: false,
        isUnread: true,
        hasDraft: false,
        mentions: 0,
        onSelectChannel: () => true,
        shouldHideChannel: false,
        showUnreadForMsgs: true,
        theme: Preferences.THEMES.default,
        unreadMsgs: 1,
        isSearchResult: false,
        isBot: false,
        customStatusEnabled: true,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ChannelItem {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with mentions and muted', () => {
        const newProps = {
            ...baseProps,
            mentions: 1,
            isChannelMuted: true,
        };

        const wrapper = shallowWithIntl(
            <ChannelItem {...newProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for deactivated user and not searchResults or currentChannel', () => {
        const channelObj = {
            ...channel,
            type: 'D',
            delete_at: 123,
        };

        const newProps = {
            ...baseProps,
            channel: channelObj,
        };

        const wrapper = shallowWithIntl(
            <ChannelItem {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for deactivated user and is searchResult', () => {
        const channelObj = {
            ...channel,
            type: 'D',
            delete_at: 123,
        };

        const newProps = {
            ...baseProps,
            isSearchResult: true,
            channel: channelObj,
        };

        const wrapper = shallowWithIntl(
            <ChannelItem {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for deactivated user and is currentChannel', () => {
        const channelObj = {
            ...channel,
            type: 'D',
            delete_at: 123,
        };

        const newProps = {
            ...baseProps,
            channel: channelObj,
            currentChannelId: 'channel_id',
            isArchived: true,
        };

        const wrapper = shallowWithIntl(
            <ChannelItem {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for no displayName', () => {
        const newProps = {
            ...baseProps,
            displayName: '',
        };

        const wrapper = shallowWithIntl(
            <ChannelItem {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for current user i.e currentUser (you)', () => {
        const channelObj = {
            ...channel,
            type: 'D',
            teammate_id: 'currentUser',
        };

        const newProps = {
            ...baseProps,
            channel: channelObj,
            currentChannelId: 'channel_id',
        };

        const wrapper = shallowWithIntl(
            <ChannelItem {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for current user i.e currentUser (you) when isSearchResult', () => {
        const channelObj = {
            ...channel,
            id: 'currentUser',
            type: 'D',
            teammate_id: 'somethingElse',
        };

        const newProps = {
            ...baseProps,
            channel: channelObj,
            currentChannelId: 'channel_id',
            isSearchResult: true,
        };

        const wrapper = shallowWithIntl(
            <ChannelItem {...newProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with draft', () => {
        const wrapper = shallowWithIntl(
            <ChannelItem
                {...baseProps}
                hasDraft={true}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for showUnreadForMsgs', () => {
        const wrapper = shallowWithIntl(
            <ChannelItem
                {...baseProps}
                hasDraft={true}
                shouldHideChannel={true}
                unreadMsgs={0}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for isManualUnread', () => {
        const wrapper = shallowWithIntl(
            <ChannelItem
                {...baseProps}
                isManualUnread={true}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with custom status emoji', () => {
        const wrapper = shallowWithIntl(
            <ChannelItem
                {...baseProps}
                teammateId={baseProps.currentUserId}
            />,
            {context: {intl: {formatMessage: jest.fn()}}},
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('Should call onPress', () => {
        const onSelectChannel = jest.fn();

        const wrapper = shallowWithIntl(
            <ChannelItem
                {...baseProps}
                onSelectChannel={onSelectChannel}
            />,
        );

        wrapper.find(TouchableHighlight).simulate('press');
        jest.runAllTimers();

        const expectedChannelParams = {id: baseProps.channelId, display_name: baseProps.displayName, fake: channel.fake, type: channel.type};
        expect(onSelectChannel).toHaveBeenCalledWith(expectedChannelParams, baseProps.currentChannelId);
    });
});
