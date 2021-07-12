// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {SearchTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {SearchRequestsStatuses, RequestStatusType} from '@mm-redux/types/requests';

import {handleRequest, initialRequestState} from './helpers';

function flaggedPosts(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    if (action.type === SearchTypes.REMOVE_SEARCH_POSTS) {
        return initialRequestState();
    }

    return handleRequest(
        SearchTypes.SEARCH_FLAGGED_POSTS_REQUEST,
        SearchTypes.SEARCH_FLAGGED_POSTS_SUCCESS,
        SearchTypes.SEARCH_FLAGGED_POSTS_FAILURE,
        state,
        action,
    );
}

function pinnedPosts(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    if (action.type === SearchTypes.REMOVE_SEARCH_POSTS) {
        return initialRequestState();
    }

    return handleRequest(
        SearchTypes.SEARCH_PINNED_POSTS_REQUEST,
        SearchTypes.SEARCH_PINNED_POSTS_SUCCESS,
        SearchTypes.SEARCH_PINNED_POSTS_FAILURE,
        state,
        action,
    );
}

export default (combineReducers({
    flaggedPosts,
    pinnedPosts,
}) as (b: SearchRequestsStatuses, a: GenericAction) => SearchRequestsStatuses);
