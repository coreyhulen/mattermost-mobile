// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text} from 'react-native';

import {shallowWithIntl} from '@test/intl-test-helper';
import {alertErrorWithFallback} from '@utils/general';

import ChannelLink from './channel_link';

jest.mock('@utils/general', () => {
    const general = jest.requireActual('../../utils/general');
    return {
        ...general,
        alertErrorWithFallback: jest.fn(),
    };
});

describe('ChannelLink', () => {
    const channelsByName = {
        firstChannel: {id: 'channel_id_1', name: 'firstChannel', display_name: 'First Channel', team_id: 'current_team_id'},
        secondChannel: {id: 'channel_id_2', name: 'secondChannel', display_name: 'Second Channel', team_id: 'current_team_id'},
    };
    const baseProps = {
        channelName: 'firstChannel',
        currentTeamId: 'current_team_id',
        currentUserId: 'current_user_id',
        linkStyle: {color: '#2389d7'},
        onChannelLinkPress: jest.fn(),
        textStyle: {color: '#3d3c40', fontSize: 15, lineHeight: 20},
        channelsByName,
        actions: {
            handleSelectChannel: jest.fn(),
            joinChannel: jest.fn(),
        },
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ChannelLink {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find(Text).length).toBe(2);

        // inner text with highlight
        let innerText = wrapper.find(Text).last();
        expect(innerText.props().onPress).toBeDefined();
        expect(innerText.props().style.color).toBe('#2389d7');
        expect(innerText.props().children).toContain(channelsByName.firstChannel.display_name);

        // text for channel name with punctuation
        const punctuation = '-_';
        wrapper.setProps({channelName: baseProps.channelName + punctuation});
        expect(wrapper.find(Text).length).toBe(2);
        innerText = wrapper.find(Text).last();
        const outerText = wrapper.find(Text).first();
        expect(innerText.props().onPress).toBeDefined();
        expect(innerText.props().children).toContain(channelsByName.firstChannel.display_name);
        expect(outerText.props().children).toContain(punctuation);

        // text for not found channel
        const notFoundChannel = 'notFoundChannel';
        wrapper.setProps({channelName: notFoundChannel});
        expect(wrapper.find(Text).length).toBe(1);
        innerText = wrapper.find(Text).first();
        expect(innerText.props().children).toContain(notFoundChannel);
        expect(innerText.props().onPress).not.toBeDefined();
    });

    test('should call props.actions and onChannelLinkPress on handlePress', async () => {
        const wrapper = shallowWithIntl(
            <ChannelLink {...baseProps}/>,
        );

        const channel = channelsByName.firstChannel;
        await wrapper.instance().handlePress();
        expect(baseProps.actions.handleSelectChannel).toHaveBeenCalledTimes(1);
        expect(baseProps.actions.handleSelectChannel).toBeCalledWith(channel.id);
        expect(baseProps.onChannelLinkPress).toHaveBeenCalledTimes(1);
        expect(baseProps.onChannelLinkPress).toBeCalledWith(channel);

        expect(baseProps.actions.joinChannel).not.toBeCalled();
    });

    test('should call props.actions.joinChannel on handlePress when user is not member of such channel', async () => {
        const newChannelName = 'thirdChannel';
        const thirdChannel = {id: 'channel_id_3', name: 'thirdChannel', display_name: 'thirdChannel', team_id: 'current_team_id'};
        const error = {message: 'Failed to join a channel'};
        const joinChannel = jest.fn().
            mockReturnValueOnce({data: {channel: thirdChannel}}).
            mockReturnValueOnce({}).
            mockReturnValueOnce({data: {}}).
            mockReturnValueOnce({error});
        const channelMentions = {thirdChannel: {display_name: 'thirdChannel'}};
        const newChannelsByName = Object.assign({}, channelMentions, channelsByName);
        const newProps = {
            ...baseProps,
            channelsByName: newChannelsByName,
            channelName: newChannelName,
            actions: {...baseProps.actions, joinChannel},
        };

        const joinFailedMessage = {
            id: 'mobile.join_channel.error',
            defaultMessage: 'We couldn\'t join the channel {displayName}. Please check your connection and try again.',
        };
        const wrapper = shallowWithIntl(
            <ChannelLink {...newProps}/>,
        );

        const {intl} = wrapper.context();

        await wrapper.instance().handlePress();
        expect(newProps.actions.joinChannel).toHaveBeenCalledTimes(1);
        expect(newProps.actions.joinChannel).toBeCalledWith('current_user_id', 'current_team_id', null, newChannelName);
        expect(alertErrorWithFallback).not.toBeCalled();
        expect(newProps.actions.handleSelectChannel).toHaveBeenCalledTimes(1);
        expect(newProps.actions.handleSelectChannel).toHaveBeenLastCalledWith(thirdChannel.id);
        expect(newProps.onChannelLinkPress).toHaveBeenCalledTimes(1);
        expect(newProps.onChannelLinkPress).toHaveBeenLastCalledWith(thirdChannel);

        // should have called alertErrorWithFallback on error when joining a channel
        await wrapper.instance().handlePress();
        expect(newProps.actions.joinChannel).toHaveBeenCalledTimes(2);
        expect(alertErrorWithFallback).toHaveBeenCalledTimes(1);
        expect(alertErrorWithFallback).toHaveBeenLastCalledWith(intl, {}, joinFailedMessage, thirdChannel.display_name);
        expect(newProps.actions.handleSelectChannel).toHaveBeenCalledTimes(1);
        expect(newProps.onChannelLinkPress).toHaveBeenCalledTimes(1);

        await wrapper.instance().handlePress();
        expect(newProps.actions.joinChannel).toHaveBeenCalledTimes(3);
        expect(alertErrorWithFallback).toHaveBeenCalledTimes(2);
        expect(alertErrorWithFallback).toHaveBeenLastCalledWith(intl, {}, joinFailedMessage, thirdChannel.display_name);
        expect(newProps.actions.handleSelectChannel).toHaveBeenCalledTimes(1);
        expect(newProps.onChannelLinkPress).toHaveBeenCalledTimes(1);

        await wrapper.instance().handlePress();
        expect(newProps.actions.joinChannel).toHaveBeenCalledTimes(4);
        expect(alertErrorWithFallback).toHaveBeenCalledTimes(3);
        expect(alertErrorWithFallback).toHaveBeenLastCalledWith(intl, error, joinFailedMessage, thirdChannel.display_name);
        expect(newProps.actions.handleSelectChannel).toHaveBeenCalledTimes(1);
        expect(newProps.onChannelLinkPress).toHaveBeenCalledTimes(1);
    });
});
