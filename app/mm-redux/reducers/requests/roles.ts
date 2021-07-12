// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {RoleTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {RolesRequestsStatuses, RequestStatusType} from '@mm-redux/types/requests';

import {handleRequest, initialRequestState} from './helpers';

function getRolesByNames(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        RoleTypes.ROLES_BY_NAMES_REQUEST,
        RoleTypes.ROLES_BY_NAMES_SUCCESS,
        RoleTypes.ROLES_BY_NAMES_FAILURE,
        state,
        action,
    );
}

export default (combineReducers({
    getRolesByNames,
}) as (b: RolesRequestsStatuses, a: GenericAction) => RolesRequestsStatuses);
