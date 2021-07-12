// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';
import {FileTypes} from '@mm-redux/action_types';
import {buildFileUploadData, generateId} from '@utils/file';

export function initUploadFiles(files, rootId) {
    return (dispatch, getState) => {
        const state = getState();
        const channelId = state.entities.channels.currentChannelId;
        const clientIds = [];

        files.forEach((file) => {
            const fileData = buildFileUploadData(file);
            const clientId = generateId();

            clientIds.push({
                clientId,
                localPath: fileData.uri,
                name: fileData.name,
                type: fileData.type,
                extension: fileData.extension,
            });
        });

        dispatch({
            type: ViewTypes.SET_TEMP_UPLOAD_FILES_FOR_POST_DRAFT,
            clientIds,
            channelId,
            rootId,
        });
    };
}

export function uploadFailed(clientIds, channelId, rootId, error) {
    return {
        type: FileTypes.UPLOAD_FILES_FAILURE,
        clientIds,
        channelId,
        rootId,
        error,
    };
}

export function uploadComplete(data, channelId, rootId) {
    return {
        type: FileTypes.RECEIVED_UPLOAD_FILES,
        data,
        channelId,
        rootId,
    };
}

export function retryFileUpload(file, rootId) {
    return async (dispatch, getState) => {
        const state = getState();

        const channelId = state.entities.channels.currentChannelId;

        dispatch({
            type: ViewTypes.RETRY_UPLOAD_FILE_FOR_POST,
            clientId: file.clientId,
            channelId,
            rootId,
        });
    };
}

export function handleClearFiles(channelId, rootId) {
    return {
        type: ViewTypes.CLEAR_FILES_FOR_POST_DRAFT,
        channelId,
        rootId,
    };
}

export function handleClearFailedFiles(channelId, rootId) {
    return {
        type: ViewTypes.CLEAR_FAILED_FILES_FOR_POST_DRAFT,
        channelId,
        rootId,
    };
}

export function handleRemoveFile(clientId, channelId, rootId) {
    return {
        type: ViewTypes.REMOVE_FILE_FROM_POST_DRAFT,
        clientId,
        channelId,
        rootId,
    };
}

export function handleRemoveLastFile(channelId, rootId) {
    return {
        type: ViewTypes.REMOVE_LAST_FILE_FROM_POST_DRAFT,
        channelId,
        rootId,
    };
}
