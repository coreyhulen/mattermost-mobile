// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ViewTypes} from '@constants';
import {FileTypes, PostTypes} from '@mm-redux/action_types';

function handleCommentDraftChanged(state, action) {
    if (!action.rootId) {
        return state;
    }

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {draft: action.draft}),
    };
}

function handleSetCommentDraft(state, action) {
    if (!action.rootId) {
        return state;
    }

    return {
        ...state,
        [action.rootId]: {
            draft: action.draft,
            cursorPosition: 0,
            files: action.files,
        },
    };
}

function handleCommentDraftSelectionChange(state, action) {
    if (!action.rootId) {
        return state;
    }

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {
            cursorPosition: action.cursorPosition,
        }),
    };
}

function handleReceivedPostSelected(state, action) {
    if (!action.data) {
        return state;
    }

    let data = {...state};

    if (!data[action.data]) {
        data = {
            ...state,
            [action.data]: {
                draft: '',
                cursorPosition: 0,
                files: [],
            },
        };
    }

    return data;
}

export function handleSetTempUploadFilesForPostDraft(state, action) {
    if (!action.rootId) {
        return state;
    }

    const tempFiles = action.clientIds.map((temp) => ({...temp, loading: true}));
    const files = [
        ...state[action.rootId]?.files || [],
        ...tempFiles,
    ];

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files}),
    };
}

function handleRetryUploadForPost(state, action) {
    if (!action.rootId) {
        return state;
    }

    const files = state[action.rootId].files.map((f) => {
        if (f.clientId === action.clientId) {
            return {
                ...f,
                loading: true,
                failed: false,
            };
        }

        return f;
    });

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files}),
    };
}

function handleReceiveUploadFiles(state, action) {
    if (!action.rootId) {
        return state;
    }

    // Reconcile tempFiles with the received uploaded files
    const files = state[action.rootId].files.map((tempFile) => {
        const file = action.data.find((f) => f.clientId === tempFile.clientId);
        if (file) {
            return {
                ...file,
                localPath: tempFile.localPath,
                loading: false,
            };
        }

        return tempFile;
    });

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files}),
    };
}

function handleUploadFilesFailure(state, action) {
    if (!action.rootId) {
        return state;
    }

    const clientIds = action.clientIds;
    const files = state[action.rootId].files.map((tempFile) => {
        if (clientIds.includes(tempFile.clientId)) {
            return {
                ...tempFile,
                loading: false,
                failed: true,
            };
        }

        return tempFile;
    });

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files}),
    };
}

function handleClearFilesForPostDraft(state, action) {
    if (!action.rootId) {
        return state;
    }

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files: []}),
    };
}

function handleRemoveFileFromPostDraft(state, action) {
    if (!action.rootId) {
        return state;
    }

    const files = state[action.rootId].files.filter((file) => (file.clientId !== action.clientId));

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files}),
    };
}

function handleRemoveLastFromPostDraft(state, action) {
    if (!action.rootId) {
        return state;
    }

    const files = [...state[action.rootId].files];
    files.splice(-1);

    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files}),
    };
}

function handleRemoveFailedFilesFromPostDraft(state, action) {
    if (!action.rootId) {
        return state;
    }

    const files = state[action.rootId].files.filter((f) => !f.failed);
    return {
        ...state,
        [action.rootId]: Object.assign({}, state[action.rootId], {files}),
    };
}

function drafts(state = {}, action) { // eslint-disable-line complexity
    switch (action.type) {
    case ViewTypes.COMMENT_DRAFT_CHANGED:
        return handleCommentDraftChanged(state, action);
    case ViewTypes.SET_COMMENT_DRAFT:
        return handleSetCommentDraft(state, action);
    case ViewTypes.COMMENT_DRAFT_SELECTION_CHANGED:
        return handleCommentDraftSelectionChange(state, action);
    case PostTypes.RECEIVED_POST_SELECTED:
        return handleReceivedPostSelected(state, action);
    case ViewTypes.SET_TEMP_UPLOAD_FILES_FOR_POST_DRAFT:
        return handleSetTempUploadFilesForPostDraft(state, action);
    case ViewTypes.RETRY_UPLOAD_FILE_FOR_POST:
        return handleRetryUploadForPost(state, action);
    case FileTypes.RECEIVED_UPLOAD_FILES:
        return handleReceiveUploadFiles(state, action);
    case FileTypes.UPLOAD_FILES_FAILURE:
        return handleUploadFilesFailure(state, action);
    case ViewTypes.CLEAR_FILES_FOR_POST_DRAFT:
        return handleClearFilesForPostDraft(state, action);
    case ViewTypes.CLEAR_FAILED_FILES_FOR_POST_DRAFT:
        return handleRemoveFailedFilesFromPostDraft(state, action);
    case ViewTypes.REMOVE_FILE_FROM_POST_DRAFT:
        return handleRemoveFileFromPostDraft(state, action);
    case ViewTypes.REMOVE_LAST_FILE_FROM_POST_DRAFT:
        return handleRemoveLastFromPostDraft(state, action);
    default:
        return state;
    }
}

export default combineReducers({
    drafts,
});
