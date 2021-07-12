// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {UserTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {UsersRequestsStatuses, RequestStatusType} from '@mm-redux/types/requests';

import {RequestStatus} from '../../constants';

import {handleRequest, initialRequestState} from './helpers';

function checkMfa(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    switch (action.type) {
    case UserTypes.CHECK_MFA_REQUEST:
        return {...state, status: RequestStatus.STARTED};

    case UserTypes.CHECK_MFA_SUCCESS:
        return {...state, status: RequestStatus.SUCCESS, error: null};

    case UserTypes.CHECK_MFA_FAILURE:
        return {...state, status: RequestStatus.FAILURE, error: action.error};

    default:
        return state;
    }
}

function login(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    switch (action.type) {
    case UserTypes.LOGIN_REQUEST:
        return {...state, status: RequestStatus.STARTED};

    case UserTypes.LOGIN_SUCCESS:
        return {...state, status: RequestStatus.SUCCESS, error: null};

    case UserTypes.LOGIN_FAILURE:
        return {...state, status: RequestStatus.FAILURE, error: action.error};

    default:
        return state;
    }
}

function autocompleteUsers(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.AUTOCOMPLETE_USERS_REQUEST,
        UserTypes.AUTOCOMPLETE_USERS_SUCCESS,
        UserTypes.AUTOCOMPLETE_USERS_FAILURE,
        state,
        action,
    );
}

function updateMe(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.UPDATE_ME_REQUEST,
        UserTypes.UPDATE_ME_SUCCESS,
        UserTypes.UPDATE_ME_FAILURE,
        state,
        action,
    );
}

export default (combineReducers({
    checkMfa,
    login,
    autocompleteUsers,
    updateMe,
}) as (b: UsersRequestsStatuses, a: GenericAction) => UsersRequestsStatuses);
