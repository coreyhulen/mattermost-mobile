// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text} from 'react-native';
import {shallow} from 'enzyme';

import * as navigationActions from '@actions/navigation';
import {THREAD} from '@constants/screen';
import {Preferences} from '@mm-redux/constants';
import {Channel} from '@mm-redux/types/channels';
import {Post} from '@mm-redux/types/posts';
import {UserThread} from '@mm-redux/types/threads';
import {UserProfile} from '@mm-redux/types/users';
import {intl} from 'test/intl-test-helper';

import {ThreadItem} from './thread_item';

describe('Global Thread Item', () => {
    const testID = 'thread_item';

    const baseProps = {
        actions: {
            getPost: jest.fn(),
            getPostThread: jest.fn(),
            selectPost: jest.fn(),
        },
        channel: {
            display_name: 'CHANNEL 1',
        } as Channel,
        intl,
        post: {
            id: 'post1',
        } as Post,
        threadId: 'post1',
        testID,
        theme: Preferences.THEMES.default,
        thread: {
            id: 'post1',
            unread_replies: 5,
        } as UserThread,
        threadStarter: {
            id: 'user1',
        } as UserProfile,
    };

    const testIDPrefix = `${testID}.post1`;

    test('Should render thread item with unread messages dot', () => {
        const wrapper = shallow(
            <ThreadItem
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();

        expect(wrapper.find({testID: `${testIDPrefix}.unread_dot`}).exists()).toBeTruthy();
        expect(wrapper.find({testID: `${testIDPrefix}.unread_mentions`}).exists()).toBeFalsy();

        expect(wrapper.find({testID: `${testIDPrefix}.footer`}).exists()).toBeTruthy();
    });

    test('Should show unread mentions count', () => {
        const props = {
            ...baseProps,
            thread: {
                ...baseProps.thread,
                unread_mentions: 5,
            },
        };
        const wrapper = shallow(
            <ThreadItem
                {...props}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find({testID: `${testIDPrefix}.unread_dot`}).exists()).toBeFalsy();

        const mentionBadge = wrapper.find({testID: `${testIDPrefix}.unread_mentions`}).at(0);
        expect(mentionBadge.exists()).toBeTruthy();
        expect(mentionBadge.find(Text).children().text().trim()).toBe('5');
    });

    test('Should show unread mentions as 99+ when over 99', () => {
        const props = {
            ...baseProps,
            thread: {
                ...baseProps.thread,
                unread_mentions: 511,
            },
        };
        const wrapper = shallow(
            <ThreadItem
                {...props}
            />,
        );
        const mentionBadge = wrapper.find({testID: `${testIDPrefix}.unread_mentions`}).at(0);
        expect(mentionBadge.find(Text).children().text().trim()).toBe('99+');
    });

    test('Should goto threads when pressed on thread item', () => {
        const goToScreen = jest.spyOn(navigationActions, 'goToScreen');
        const wrapper = shallow(
            <ThreadItem
                {...baseProps}
            />,
        );
        const threadItem = wrapper.find({testID: `${testIDPrefix}.item`});
        expect(threadItem.exists()).toBeTruthy();
        threadItem.simulate('press');
        expect(goToScreen).toHaveBeenCalledWith(THREAD, expect.anything(), expect.anything());
    });
});
