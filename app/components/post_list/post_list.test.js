// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import PostList from './post_list';

jest.useFakeTimers();

describe('PostList', () => {
    const serverURL = 'https://server-url.fake';

    const baseProps = {
        closePermalink: jest.fn(),
        handleSelectChannelByName: jest.fn(),
        refreshChannelWithRetry: jest.fn(),
        showPermalink: jest.fn(),
        setDeepLinkURL: jest.fn(),
        channelId: 'channel-id',
        deepLinkURL: '',
        lastPostIndex: -1,
        postIds: ['post-id-1', 'post-id-2'],
        serverURL,
        siteURL: 'https://site-url.fake',
        theme: Preferences.THEMES.default,
    };

    // const deeplinkRoot = 'mattermost://server-url.fake';
    // const deepLinks = {
    //     permalink: deeplinkRoot + '/team-name/pl/pl-id',
    //     channel: deeplinkRoot + '/team-name/channels/channel-name',
    // };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <PostList {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    // Disabled as enzyme does not support hooks
    // test('setting permalink deep link', () => {
    //     const wrapper = shallowWithIntl(
    //         <PostList {...baseProps}/>,
    //     );

    //     wrapper.setProps({deepLinkURL: deepLinks.permalink});
    //     expect(baseProps.actions.setDeepLinkURL).toHaveBeenCalled();
    //     expect(baseProps.actions.showPermalink).toHaveBeenCalled();
    //     expect(wrapper.getElement()).toMatchSnapshot();
    // });

    // Disabled as enzyme does not support hooks
    // test('setting channel deep link', () => {
    //     const wrapper = shallowWithIntl(
    //         <PostList {...baseProps}/>,
    //     );

    //     wrapper.setProps({deepLinkURL: deepLinks.channel});
    //     expect(baseProps.actions.setDeepLinkURL).toHaveBeenCalled();
    //     expect(baseProps.actions.handleSelectChannelByName).toHaveBeenCalled();
    //     expect(wrapper.getElement()).toMatchSnapshot();
    // });
});
