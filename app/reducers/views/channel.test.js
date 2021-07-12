// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';

import channelReducer, {handleSetTempUploadFilesForPostDraft} from './channel';

describe('Reducers.channel', () => {
    test('Initial state', () => {
        const initialState = {
            displayName: '',
            drafts: {},
            loading: false,
            refreshing: false,
            loadingPosts: {},
            lastGetPosts: {},
            retryFailed: false,
            loadMorePostsVisible: true,
            lastChannelViewTime: {},
            keepChannelIdAsUnread: null,
            unreadMessageCount: {},
        };

        const nextState = channelReducer(
            initialState,
            {},
        );

        expect(nextState).toEqual(initialState);
    });

    test('handleSetTempUploadFilesForPostDraft - should not throw error when state[action.channelId] is null', () => {
        const action = {
            channelId: 'channel-id',
            clientIds: [],
            rootId: null,
            type: ViewTypes.SET_TEMP_UPLOAD_FILES_FOR_POST_DRAFT,
        };

        const initialState = {
            [action.channelId]: null,
        };

        const expectedState = {
            [action.channelId]: {
                files: [],
            },
        };

        expect(handleSetTempUploadFilesForPostDraft(initialState, action)).toEqual(expectedState);
    });
});
