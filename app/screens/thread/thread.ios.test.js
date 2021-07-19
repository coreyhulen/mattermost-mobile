// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import PostList from '@components/post_list';
import {TYPING_VISIBLE} from '@constants/post_draft';
import Preferences from '@mm-redux/constants/preferences';
import {General, RequestStatus} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {shallowWithIntl} from 'test/intl-test-helper';

import ThreadIOS from './thread.ios';

jest.mock('react-native-navigation', () => {
    return {
        Navigation: {
            events: () => ({
                registerAppLaunchedListener: jest.fn(),
            }),
            registerComponent: jest.fn(),
            setLazyComponentRegistrator: jest.fn(),
        },
    };
});

describe('thread', () => {
    const baseProps = {
        actions: {
            selectPost: jest.fn(),
            setThreadFollow: jest.fn(),
        },
        channelId: 'channel_id',
        channelType: General.OPEN_CHANNEL,
        displayName: 'channel_display_name',
        myMember: {last_viewed_at: 0, user_id: 'member_user_id'},
        rootId: 'root_id',
        theme: Preferences.THEMES.default,
        postIds: ['root_id', 'post_id_1', 'post_id_2'],
        channelIsArchived: false,
        teamId: 'team_id',
        threadLoadingStatus: {status: RequestStatus.STARTED},
    };

    test('should match snapshot, has root post', () => {
        const wrapper = shallowWithIntl(
            <ThreadIOS {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot, no root post, loading', () => {
        const newPostIds = ['post_id_1', 'post_id_2'];
        const wrapper = shallowWithIntl(
            <ThreadIOS
                {...baseProps}
                postIds={newPostIds}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot, render footer', () => {
        const wrapper = shallowWithIntl(
            <ThreadIOS {...baseProps}/>,
        );

        // return loading
        expect(wrapper.find(PostList).getElement()).toMatchSnapshot();

        // return null
        wrapper.setProps({threadLoadingStatus: {status: RequestStatus.SUCCESS}});
        expect(wrapper.find(PostList).getElement()).toMatchSnapshot();

        // return deleted post
        const newPostIds = ['post_id_1', 'post_id_2'];
        wrapper.setProps({postIds: newPostIds});
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should add/remove typing animation on mount/unmount', () => {
        const wrapper = shallowWithIntl(
            <ThreadIOS {...baseProps}/>,
        );
        const instance = wrapper.instance();
        instance.registerTypingAnimation = jest.fn(() => {
            return jest.fn();
        });
        instance.bottomPaddingAnimation = jest.fn();
        instance.runTypingAnimations = jest.fn();
        EventEmitter.on = jest.fn();
        EventEmitter.off = jest.fn();

        instance.componentDidMount();
        expect(instance.registerTypingAnimation).toHaveBeenCalledWith(instance.bottomPaddingAnimation);
        expect(instance.removeTypingAnimation).not.toHaveBeenCalled();
        expect(EventEmitter.on).toHaveBeenCalledWith(TYPING_VISIBLE, instance.runTypingAnimations);

        instance.componentWillUnmount();
        expect(instance.removeTypingAnimation).toHaveBeenCalled();
        expect(EventEmitter.off).toHaveBeenCalledWith(TYPING_VISIBLE, instance.runTypingAnimations);
    });
});
