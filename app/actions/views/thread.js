// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';

export function handleCommentDraftChanged(rootId, draft) {
    return (dispatch, getState) => {
        const state = getState();

        if (state.views.thread.drafts[rootId]?.draft !== draft) {
            dispatch({
                type: ViewTypes.COMMENT_DRAFT_CHANGED,
                rootId,
                draft,
            });
        }
    };
}

export function handleCommentDraftSelectionChanged(rootId, cursorPosition) {
    return {
        type: ViewTypes.COMMENT_DRAFT_SELECTION_CHANGED,
        rootId,
        cursorPosition,
    };
}
