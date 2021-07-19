// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ViewTypes} from '@constants';
import {
    ChannelTypes,
    FileTypes,
    PostTypes,
} from '@mm-redux/action_types';

function displayName(state = '', action) {
    switch (action.type) {
    case ViewTypes.SET_CHANNEL_DISPLAY_NAME:
        return action.displayName || '';
    case ChannelTypes.SELECT_CHANNEL:
        return '';
    default:
        return state;
    }
}

function handlePostDraftChanged(state, action) {
    return {
        ...state,
        [action.channelId]: Object.assign({}, state[action.channelId], {draft: action.draft}),
    };
}

function handleSetPostDraft(state, action) {
    return {
        ...state,
        [action.channelId]: {
            draft: action.draft,
            cursorPosition: 0,
            files: action.files,
        },
    };
}

function handleSelectChannel(state, action) {
    let data = {...state};
    if (action.data && !data[action.data]) {
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
    if (action.rootId) {
        return state;
    }

    const tempFiles = action.clientIds.map((temp) => ({...temp, loading: true}));
    const files = [
        ...state[action.channelId]?.files || [],
        ...tempFiles,
    ];

    return {
        ...state,
        [action.channelId]: Object.assign({}, state[action.channelId], {files}),
    };
}

function handleRetryUploadFileForPost(state, action) {
    if (action.rootId) {
        return state;
    }

    const files = state[action.channelId].files.map((f) => {
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
        [action.channelId]: Object.assign({}, state[action.channelId], {files}),
    };
}

function handleReceivedUploadFiles(state, action) {
    if (action.rootId || !state[action.channelId].files) {
        return state;
    }

    // Reconcile tempFiles with the received uploaded files
    const files = state[action.channelId].files.map((tempFile) => {
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
        [action.channelId]: Object.assign({}, state[action.channelId], {files}),
    };
}

function handleUploadFilesFailure(state, action) {
    if (action.rootId) {
        return state;
    }

    const clientIds = action.clientIds;
    const files = state[action.channelId].files.map((tempFile) => {
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
        [action.channelId]: Object.assign({}, state[action.channelId], {files}),
    };
}

function handleClearFilesForPostDraft(state, action) {
    if (action.rootId) {
        return state;
    }

    return {
        ...state,
        [action.channelId]: Object.assign({}, state[action.channelId], {files: []}),
    };
}

function handleRemoveFileFromPostDraft(state, action) {
    if (action.rootId) {
        return state;
    }

    const files = state[action.channelId].files.filter((file) => (file.clientId !== action.clientId));

    return {
        ...state,
        [action.channelId]: Object.assign({}, state[action.channelId], {files}),
    };
}

function handleRemoveLastFileFromPostDraft(state, action) {
    if (action.rootId) {
        return state;
    }

    const files = [...state[action.channelId].files];
    files.splice(-1);

    return {
        ...state,
        [action.channelId]: Object.assign({}, state[action.channelId], {files}),
    };
}

function handleRemoveFailedFilesFromPostDraft(state, action) {
    if (action.rootId) {
        return state;
    }

    const files = state[action.channelId].files.filter((f) => !f.failed);
    return {
        ...state,
        [action.channelId]: Object.assign({}, state[action.channelId], {files}),
    };
}

function drafts(state = {}, action) { // eslint-disable-line complexity
    switch (action.type) {
    case ViewTypes.POST_DRAFT_CHANGED:
        return handlePostDraftChanged(state, action);
    case ViewTypes.SET_POST_DRAFT:
        return handleSetPostDraft(state, action);
    case ChannelTypes.SELECT_CHANNEL:
        return handleSelectChannel(state, action);
    case ViewTypes.SET_TEMP_UPLOAD_FILES_FOR_POST_DRAFT:
        return handleSetTempUploadFilesForPostDraft(state, action);
    case ViewTypes.RETRY_UPLOAD_FILE_FOR_POST:
        return handleRetryUploadFileForPost(state, action);
    case FileTypes.RECEIVED_UPLOAD_FILES:
        return handleReceivedUploadFiles(state, action);
    case FileTypes.UPLOAD_FILES_FAILURE:
        return handleUploadFilesFailure(state, action);
    case ViewTypes.CLEAR_FILES_FOR_POST_DRAFT:
        return handleClearFilesForPostDraft(state, action);
    case ViewTypes.CLEAR_FAILED_FILES_FOR_POST_DRAFT:
        return handleRemoveFailedFilesFromPostDraft(state, action);
    case ViewTypes.REMOVE_FILE_FROM_POST_DRAFT:
        return handleRemoveFileFromPostDraft(state, action);
    case ViewTypes.REMOVE_LAST_FILE_FROM_POST_DRAFT:
        return handleRemoveLastFileFromPostDraft(state, action);
    default:
        return state;
    }
}

function loading(state = false, action) {
    switch (action.type) {
    case ViewTypes.SET_CHANNEL_LOADER:
        return action.loading;
    default:
        return state;
    }
}

function refreshing(state = false, action) {
    switch (action.type) {
    case ViewTypes.SET_CHANNEL_REFRESHING:
        return action.loading;
    default:
        return state;
    }
}

function retryFailed(state = false, action) {
    switch (action.type) {
    case ViewTypes.SET_CHANNEL_RETRY_FAILED:
        return action.failed;
    case PostTypes.GET_POSTS_SUCCESS:
    case PostTypes.GET_POSTS_SINCE_SUCCESS: {
        if (state) {
            return false;
        }

        return state;
    }
    default:
        return state;
    }
}

function loadingPosts(state = {}, action) {
    switch (action.type) {
    case ViewTypes.LOADING_POSTS: {
        const nextState = {...state};
        nextState[action.channelId] = action.data;
        return nextState;
    }
    default:
        return state;
    }
}

function lastGetPosts(state = {}, action) {
    switch (action.type) {
    case ViewTypes.RECEIVED_POSTS_FOR_CHANNEL_AT_TIME:
        return {
            ...state,
            [action.channelId]: action.time,
        };

    default:
        return state;
    }
}

function loadMorePostsVisible(state = true, action) {
    switch (action.type) {
    case ChannelTypes.SELECT_CHANNEL:
        return true;
    case ViewTypes.SET_LOAD_MORE_POSTS_VISIBLE:
        return action.data;

    default:
        return state;
    }
}

function lastChannelViewTime(state = {}, action) {
    switch (action.type) {
    case ChannelTypes.SELECT_CHANNEL: {
        if (action.extra?.member) {
            const {member} = action.extra;
            const nextState = {...state};
            nextState[action.data] = member.last_viewed_at;
            return nextState;
        }

        return state;
    }

    case ChannelTypes.POST_UNREAD_SUCCESS: {
        const data = action.data;
        return {...state, [data.channelId]: data.lastViewedAt};
    }

    case PostTypes.RECEIVED_POST:
    case PostTypes.RECEIVED_NEW_POST: {
        const data = action.data;
        if (!data.ownPost) {
            return state;
        }

        return {...state, [data.channel_id]: data.create_at + 1};
    }

    default:
        return state;
    }
}

function keepChannelIdAsUnread(state = null, action) {
    switch (action.type) {
    case ChannelTypes.SELECT_CHANNEL: {
        if (!action.extra && (action.data || action.data === '')) {
            return {
                id: action.data,
                hadMentions: false,
            };
        }

        const {channel, member} = action.extra;

        if (!member || !channel) {
            return state;
        }

        const msgCount = channel.total_msg_count - member.msg_count;
        const hadMentions = member.mention_count > 0;
        const hadUnreads = member.notify_props.mark_unread !== ViewTypes.NotificationLevels.MENTION && msgCount > 0;

        if (hadMentions || hadUnreads) {
            return {
                id: member.channel_id,
                hadMentions,
            };
        }

        return null;
    }

    case ViewTypes.RECEIVED_FOCUSED_POST: {
        if (state && action.channelId !== state.id) {
            return null;
        }
        return state;
    }
    default:
        return state;
    }
}

function unreadMessageCount(state = {}, action) {
    switch (action.type) {
    case ChannelTypes.SET_UNREAD_MSG_COUNT: {
        const {channelId, count} = action.data;
        return {
            ...state,
            [channelId]: count,
        };
    }
    default:
        return state;
    }
}

export default combineReducers({
    displayName,
    drafts,
    loading,
    refreshing,
    loadingPosts,
    lastGetPosts,
    retryFailed,
    loadMorePostsVisible,
    lastChannelViewTime,
    keepChannelIdAsUnread,
    unreadMessageCount,
});
