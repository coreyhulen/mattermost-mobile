// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Alert} from 'react-native';
import {shallowWithIntl} from 'test/intl-test-helper';

import Preferences from '@mm-redux/constants/preferences';

import PostOptions from './post_options';

describe('PostOptions', () => {
    const actions = {
        addReaction: jest.fn(),
        deletePost: jest.fn(),
        flagPost: jest.fn(),
        pinPost: jest.fn(),
        removePost: jest.fn(),
        unflagPost: jest.fn(),
        unpinPost: jest.fn(),
        setThreadFollow: jest.fn(),
        setUnreadPost: jest.fn(),
    };

    const post = {
        root_id: 'root_id',
        id: 'post_id',
        message: 'message',
        is_pinned: false,
        channel_id: 'channel_id',
    };

    const baseProps = {
        actions,
        canAddReaction: true,
        canReply: true,
        canDelete: true,
        canPin: true,
        canEdit: true,
        canMarkAsUnread: true,
        canEditUntil: -1,
        channelIsReadOnly: false,
        currentTeamId: 'current_team_id',
        currentTeamUrl: 'http://localhost:8065/team-name',
        currentUserId: 'user1',
        deviceHeight: 600,
        hasBeenDeleted: false,
        isFlagged: true,
        isSystemMessage: false,
        managedConfig: {},
        post,
        showAddReaction: true,
        showAppOptions: true,
        theme: Preferences.THEMES.default,
    };

    function getWrapper(props = {}) {
        return shallowWithIntl(
            <PostOptions
                {...baseProps}
                {...props}
            />,
        );
    }

    test('should match snapshot, showing all possible options', () => {
        const wrapper = getWrapper();

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot, showing Delete option only for system message to user who has permission to delete', () => {
        const wrapper = getWrapper({isSystemMessage: true});

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot, no option for system message to user who doesn\'t have the permission to delete', () => {
        const wrapper = getWrapper({isSystemMessage: true, canDelete: false});

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should load thread', () => {
        const wrapper = getWrapper();
        const instance = wrapper.instance();

        instance.closeWithAnimation = jest.fn();

        wrapper.findWhere((node) => node.key() === 'reply').simulate('press');
        expect(instance.closeWithAnimation).toBeCalled();
    });

    test('should not show reply option', () => {
        const wrapper = getWrapper({canReply: false});

        expect(wrapper.findWhere((node) => node.key() === 'reply')).toMatchObject({});
    });

    test('should not show mark as unread option', () => {
        const wrapper = getWrapper({canMarkAsUnread: false});

        expect(wrapper.findWhere((node) => node.key() === 'markUnread')).toMatchObject({});
    });

    test('should remove post after delete', () => {
        const wrapper = getWrapper();

        wrapper.findWhere((node) => node.key() === 'delete').simulate('press');
        expect(Alert.alert).toBeCalled();

        // Trigger on press of Delete in the Alert
        const closeWithAnimation = jest.spyOn(wrapper.instance(), 'closeWithAnimation');
        Alert.alert.mock.calls[0][2][1].onPress();
        expect(closeWithAnimation).toBeCalled();

        // get the callback that gets called by closeWithAnimation
        const callback = closeWithAnimation.mock.calls[0][0];

        callback();
        expect(actions.deletePost).toBeCalled();
        expect(actions.removePost).toBeCalled();
    });

    test('should not show reply option without create_post permission', () => {
        const wrapper = getWrapper({canPost: false});

        expect(wrapper.findWhere((node) => node.key() === 'reply')).toMatchObject({});
    });
});
