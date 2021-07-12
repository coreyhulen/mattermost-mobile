// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Posts, Preferences} from '@mm-redux/constants';
import {renderWithReduxIntl} from '@test/testing_library';

import SystemMessage from './system_message';

const baseProps = {
    ownerUsername: 'username',
    theme: Preferences.THEMES.default,
};

describe('renderSystemMessage', () => {
    test('uses renderer for Channel Header update', () => {
        const post = {
            props: {
                old_header: 'old header',
                new_header: 'new header',
            },
            type: Posts.POST_TYPES.HEADER_CHANGE,
        };
        const {getByText, toJSON} = renderWithReduxIntl(
            <SystemMessage
                post={post}
                {...baseProps}
            />,
        );
        expect(toJSON()).toMatchSnapshot();
        expect(getByText('@username')).toBeTruthy();
        expect(getByText(' updated the channel header from: old header to: new header')).toBeTruthy();
    });

    test('uses renderer for Channel Display Name update', () => {
        const post = {
            props: {
                old_displayname: 'old displayname',
                new_displayname: 'new displayname',
            },
            type: Posts.POST_TYPES.DISPLAYNAME_CHANGE,
        };

        const {getByText, toJSON} = renderWithReduxIntl(
            <SystemMessage
                post={post}
                {...baseProps}
            />,
        );
        expect(toJSON()).toMatchSnapshot();
        expect(getByText('@username')).toBeTruthy();
        expect(getByText(' updated the channel display name from: old displayname to: new displayname')).toBeTruthy();
    });

    test('uses renderer for Channel Purpose update', () => {
        const post = {
            props: {
                old_purpose: 'old purpose',
                new_purpose: 'new purpose',
            },
            type: Posts.POST_TYPES.PURPOSE_CHANGE,
        };
        const {getByText, toJSON} = renderWithReduxIntl(
            <SystemMessage
                post={post}
                {...baseProps}
            />,
        );
        expect(toJSON()).toMatchSnapshot();
        expect(getByText('@username updated the channel purpose from: old purpose to: new purpose')).toBeTruthy();
    });

    test('uses renderer for archived channel', () => {
        const post = {
            type: Posts.POST_TYPES.CHANNEL_DELETED,
        };

        const {getByText, toJSON} = renderWithReduxIntl(
            <SystemMessage
                post={post}
                {...baseProps}
            />,
        );
        expect(toJSON()).toMatchSnapshot();
        expect(getByText('@username')).toBeTruthy();
        expect(getByText(' archived the channel')).toBeTruthy();
    });

    test('uses renderer for OLD archived channel without a username', () => {
        const post = {
            props: {},
            type: Posts.POST_TYPES.CHANNEL_DELETED,
        };

        const {getByText, toJSON} = renderWithReduxIntl(
            <SystemMessage
                {...baseProps}
                post={post}
                ownerUsername={''}
            />,
        );
        expect(toJSON()).toMatchSnapshot();
        expect(getByText('archived the channel')).toBeTruthy();
    });

    test('uses renderer for unarchived channel', () => {
        const post = {
            type: Posts.POST_TYPES.CHANNEL_UNARCHIVED,
        };

        const viewOne = renderWithReduxIntl(
            <SystemMessage
                {...baseProps}
                post={post}
            />,
        );
        expect(viewOne.toJSON()).toMatchSnapshot();
        expect(viewOne.getByText('@username')).toBeTruthy();
        expect(viewOne.getByText(' unarchived the channel')).toBeTruthy();

        const viewTwo = renderWithReduxIntl(
            <SystemMessage
                {...baseProps}
                post={post}
                ownerUsername=''
            />,
        );
        expect(viewTwo.toJSON()).toBeNull();
        expect(viewTwo.queryByText('archived the channel')).toBeFalsy();
    });

    test('is null for non-qualifying system messages', () => {
        const post = {
            postType: 'not_relevant',
        };

        const renderedMessage = renderWithReduxIntl(
            <SystemMessage
                {...baseProps}
                post={post}
            />,
        );
        expect(renderedMessage.toJSON()).toBeNull();
    });
});
