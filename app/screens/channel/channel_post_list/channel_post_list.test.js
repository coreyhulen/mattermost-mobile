// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import ChannelPostList from './channel_post_list';

describe('ChannelPostList', () => {
    const baseProps = {
        actions: {
            loadPostsIfNecessaryWithRetry: jest.fn(),
            getPostThread: jest.fn(),
            increasePostVisibility: jest.fn(),
            selectPost: jest.fn(),
        },
        channelId: 'channel-id',
        loadMorePostsVisible: false,
        refreshing: false,
        theme: Preferences.THEMES.default,
        registerTypingAnimation: jest.fn(() => {
            return jest.fn();
        }),
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <ChannelPostList {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should add/remove typing animation on mount/unmount', () => {
        const wrapper = shallow(
            <ChannelPostList {...baseProps}/>,
        );
        const instance = wrapper.instance();

        expect(baseProps.registerTypingAnimation).toHaveBeenCalledTimes(1);
        expect(instance.removeTypingAnimation).not.toHaveBeenCalled();

        wrapper.unmount();
        expect(instance.removeTypingAnimation).toHaveBeenCalledTimes(1);
    });
});
