// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import PinnedPosts from './pinned_posts';

describe('PinnedPosts', () => {
    const baseProps = {
        actions: {
            clearSearch: jest.fn(),
            getPostThread: jest.fn(),
            getPinnedPosts: jest.fn(),
            showPermalink: jest.fn(),
            selectPost: jest.fn(),
        },
        theme: Preferences.THEMES.default,
        currentChannelId: 'channelId',
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <PinnedPosts {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when getPinnedPosts failed', async () => {
        const error = new Error('foo');

        const newProps = {
            ...baseProps,
            actions: {
                ...baseProps.actions,
                getPinnedPosts: jest.fn().mockResolvedValue({error}),
            },
        };
        const wrapper = shallowWithIntl(
            <PinnedPosts {...newProps}/>,
        );

        await wrapper.instance().getPinnedPosts();
        expect(wrapper.state('didFail')).toBe(true);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when component waiting for response', async () => {
        const error = new Error('foo');

        const newProps = {
            ...baseProps,
            actions: {
                ...baseProps.actions,
                getPinnedPosts: jest.fn().mockResolvedValue({error}),
            },
        };
        const wrapper = shallowWithIntl(
            <PinnedPosts {...newProps}/>,
        );

        wrapper.instance().getPinnedPosts();
        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.state('isLoading')).toBe(true);
    });
});
