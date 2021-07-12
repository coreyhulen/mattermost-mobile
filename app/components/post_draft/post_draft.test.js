// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import Preferences from '@mm-redux/constants/preferences';
import intitialState from '@store/initial_state';
import {renderWithReduxIntl} from '@test/testing_library';

import PostDraft from './post_draft';

jest.mock('app/components/compass_icon', () => 'Icon');

const mockStore = configureMockStore([thunk]);
const state = {
    ...intitialState,
    entities: {
        ...intitialState.entities,
        channels: {
            ...intitialState.entities.channels,
            channels: {
                'channel-id': {
                    id: 'channel-id',
                    name: 'test-channel',
                    display_name: 'Display Name',
                    type: 'O',
                },
            },
            channelMemberCountsByGroup: {},
        },
    },
    device: {
        ...intitialState.device,
        dimension: {
            deviceWidth: 375,
            deviceHeight: 812,
        },
    },
};
const store = mockStore(state);

describe('PostDraft', () => {
    const baseProps = {
        testID: 'post_draft',
        canPost: true,
        channelId: 'channel-id',
        channelIsArchived: false,
        channelIsReadOnly: false,
        deactivatedChannel: false,
        registerTypingAnimation: () => jest.fn(),
        rootId: '',
        screenId: 'NavigationScreen1',
        theme: Preferences.THEMES.default,
    };

    test('Should render the DraftInput', () => {
        const {getByTestId, queryByText, toJSON} = renderWithReduxIntl(
            <PostDraft
                {...baseProps}
            />,
            store,
        );

        expect(toJSON()).toMatchSnapshot();
        expect(getByTestId('post_draft.post.input')).toBeTruthy();
        expect(queryByText('Close Channel')).toBeNull();
    });

    test('Should render the Archived for channelIsArchived', () => {
        const {queryByTestId, getByText, toJSON} = renderWithReduxIntl(
            <PostDraft
                {...baseProps}
                channelIsArchived={true}
            />,
            store,
        );

        expect(toJSON()).toMatchSnapshot();

        // Should not render text input
        expect(queryByTestId('post_draft.post.input')).toBeNull();

        // Should match text description
        expect(getByText('You are viewing an ')).toBeTruthy();
        expect(getByText('archived channel')).toBeTruthy();
        expect(getByText('. New messages cannot be posted.')).toBeTruthy();
        expect(getByText('Close Channel')).toBeTruthy();
    });

    test('Should render the Archived for deactivatedChannel', () => {
        const {queryByTestId, getByText, toJSON} = renderWithReduxIntl(
            <PostDraft
                {...baseProps}
                deactivatedChannel={true}
            />,
            store,
        );

        expect(toJSON()).toMatchSnapshot();

        // Should not render text input
        expect(queryByTestId('post_draft.post.input')).toBeNull();

        // Should match text description
        expect(getByText('You are viewing an ')).toBeTruthy();
        expect(getByText('archived channel')).toBeTruthy();
        expect(getByText('. New messages cannot be posted.')).toBeTruthy();
        expect(getByText('Close Channel')).toBeTruthy();
    });

    test('Should render the ReadOnly for channelIsReadOnly', () => {
        const {queryByTestId, getByText, queryByText, toJSON} = renderWithReduxIntl(
            <PostDraft
                {...baseProps}
                channelIsReadOnly={true}
            />,
            store,
        );

        expect(toJSON()).toMatchSnapshot();

        // Should not render text input
        expect(queryByTestId('post_draft.post.input')).toBeNull();

        // Should match text description
        expect(getByText('This channel is read-only.')).toBeTruthy();
        expect(queryByText('Close Channel')).toBeNull();
    });

    test('Should render the ReadOnly for canPost', () => {
        const {queryByTestId, getByText, queryByText, toJSON} = renderWithReduxIntl(
            <PostDraft
                {...baseProps}
                canPost={false}
            />,
            store,
        );

        expect(toJSON()).toMatchSnapshot();

        // Should not render text input
        expect(queryByTestId('post_draft.post.input')).toBeNull();

        // Should match text description
        expect(getByText('This channel is read-only.')).toBeTruthy();
        expect(queryByText('Close Channel')).toBeNull();
    });
});
