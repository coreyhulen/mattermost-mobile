// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as reselect from 'reselect';

import {getCurrentUserLocale} from '@mm-redux/selectors/entities/i18n';
import * as types from '@mm-redux/types';
import {GlobalState} from '@mm-redux/types/store';
import {sortFileInfos} from '@mm-redux/utils/file_utils';

function getAllFiles(state: types.store.GlobalState) {
    return state.entities.files.files;
}

function getFilesIdsForPost(state: types.store.GlobalState, postId: string) {
    if (postId) {
        return state.entities.files.fileIdsByPostId[postId] || [];
    }

    return [];
}

export function getFilePublicLink(state: GlobalState) {
    return state.entities.files.filePublicLink;
}

export function makeGetFilesForPost() {
    return reselect.createSelector(
        [getAllFiles, getFilesIdsForPost, getCurrentUserLocale],
        (allFiles, fileIdsForPost, locale) => {
            const fileInfos = fileIdsForPost.map((id) => allFiles[id]).filter((id) => Boolean(id));

            return sortFileInfos(fileInfos, locale);
        },
    );
}
