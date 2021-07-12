// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';

import channelReducer, {handleSetTempUploadFilesForPostDraft} from './thread';

describe('Reducers.thread', () => {
    test('Initial state', () => {
        const initialState = {
            drafts: {},
        };

        const nextState = channelReducer(
            initialState,
            {},
        );

        expect(nextState).toEqual(initialState);
    });

    test('handleSetTempUploadFilesForPostDraft - should not throw error when state[action.rootId] is null', () => {
        const action = {
            clientIds: [],
            rootId: 'root-id',
            type: ViewTypes.SET_TEMP_UPLOAD_FILES_FOR_POST_DRAFT,
        };

        const initialState = {
            [action.rootId]: null,
        };

        const expectedState = {
            [action.rootId]: {
                files: [],
            },
        };

        expect(handleSetTempUploadFilesForPostDraft(initialState, action)).toEqual(expectedState);
    });
});
