// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Client4} from '@client/rest';
import {RoleTypes} from '@mm-redux/action_types';
import {getRoles} from '@mm-redux/selectors/entities/roles_helpers';
import {DispatchFunc, GetStateFunc, ActionFunc} from '@mm-redux/types/actions';

import {bindClientFunc} from './helpers';
export function getRolesByNames(rolesNames: Array<string>) {
    return bindClientFunc({
        clientFunc: Client4.getRolesByNames,
        onSuccess: [RoleTypes.RECEIVED_ROLES, RoleTypes.ROLES_BY_NAMES_SUCCESS],
        params: [
            rolesNames,
        ],
    });
}

export function loadRolesIfNeeded(roles: Iterable<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentRoles = getRoles(state);
        const newRoles = [];

        for (const role of roles) {
            if (!currentRoles[role] && role.trim() !== '') {
                newRoles.push(role);
            }
        }
        if (newRoles.length > 0) {
            return dispatch(getRolesByNames(newRoles));
        }
        return {data: state.entities.roles.roles};
    };
}
