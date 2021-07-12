// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as reselect from 'reselect';

import {getCurrentUser} from '@mm-redux/selectors/entities/common';
import * as types from '@mm-redux/types';
import {GlobalState} from '@mm-redux/types/store';

export type PermissionsOptions = {
    channel?: string;
    team?: string;
    permission: string;
    default?: boolean;
};

export function getRoles(state: GlobalState) {
    return state.entities.roles.roles;
}

export const getMySystemRoles = reselect.createSelector(getCurrentUser, (user: types.users.UserProfile) => {
    if (user) {
        return new Set<string>(user.roles.split(' '));
    }

    return new Set<string>();
});

export const getMySystemPermissions = reselect.createSelector(getMySystemRoles, getRoles, (mySystemRoles: Set<string>, roles) => {
    const permissions = new Set<string>();

    for (const roleName of mySystemRoles) {
        if (roles[roleName]) {
            for (const permission of roles[roleName].permissions) {
                permissions.add(permission);
            }
        }
    }

    return permissions;
});

export const haveISystemPermission = reselect.createSelector(getMySystemPermissions, (state: GlobalState, options: PermissionsOptions) => options.permission, (permissions, permission) => {
    return permissions.has(permission);
});
