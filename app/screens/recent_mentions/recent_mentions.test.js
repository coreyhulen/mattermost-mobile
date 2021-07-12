// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import RecentMentions from './recent_mentions';

describe('RecentMentions', () => {
    const baseProps = {
        actions: {
            clearSearch: jest.fn(),
            getPostThread: jest.fn(),
            getRecentMentions: jest.fn(),
            showPermalink: jest.fn(),
            selectPost: jest.fn(),
        },
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <RecentMentions {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when getRecentMentions failed', async () => {
        const error = new Error('foo');

        const newProps = {
            ...baseProps,
            actions: {
                ...baseProps.actions,
                getRecentMentions: jest.fn().mockResolvedValue({error}),
            },
        };
        const wrapper = shallowWithIntl(
            <RecentMentions {...newProps}/>,
        );

        await wrapper.instance().getRecentMentions();
        expect(wrapper.state('didFail')).toBe(true);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when component waiting for response', () => {
        const error = new Error('foo');

        const newProps = {
            ...baseProps,
            actions: {
                ...baseProps.actions,
                getRecentMentions: jest.fn().mockResolvedValue({error}),
            },
        };
        const wrapper = shallowWithIntl(
            <RecentMentions {...newProps}/>,
        );

        wrapper.instance().getRecentMentions();
        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.state('isLoading')).toBe(true);
    });
});
