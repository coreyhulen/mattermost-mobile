// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as reselect from 'reselect';

import {getCurrentChannelId} from '@mm-redux/selectors/entities/common';
import {getMySystemPermissions, getMySystemRoles, getRoles, PermissionsOptions} from '@mm-redux/selectors/entities/roles_helpers';
import * as types from '@mm-redux/types';
import {Role} from '@mm-redux/types/roles';
import {GlobalState} from '@mm-redux/types/store';
import {Dictionary} from '@mm-redux/types/utilities';

import {getTeamMemberships, getCurrentTeamId} from './teams';

export {getMySystemPermissions, getMySystemRoles, getRoles};

export const getMyTeamRoles = reselect.createSelector(
    getTeamMemberships,
    (teamsMemberships) => {
        const roles: Dictionary<Set<string>> = {};
        if (teamsMemberships) {
            for (const key in teamsMemberships) {
                if (teamsMemberships.hasOwnProperty(key) && teamsMemberships[key].roles) {
                    roles[key] = new Set<string>(teamsMemberships[key].roles.split(' '));
                }
            }
        }
        return roles;
    },
);

export const getMyChannelRoles = reselect.createSelector(
    (state: types.store.GlobalState) => state.entities.channels.myMembers,
    (channelsMemberships) => {
        const roles: Dictionary<Set<string>> = {};
        if (channelsMemberships) {
            for (const key in channelsMemberships) {
                if (channelsMemberships.hasOwnProperty(key) && channelsMemberships[key].roles) {
                    roles[key] = new Set<string>(channelsMemberships[key].roles.split(' '));
                }
            }
        }
        return roles;
    },
);

export const getMyRoles = reselect.createSelector(
    getMySystemRoles,
    getMyTeamRoles,
    getMyChannelRoles,
    (systemRoles, teamRoles, channelRoles) => {
        return {
            system: systemRoles,
            team: teamRoles,
            channel: channelRoles,
        };
    },
);

export const getRolesById = reselect.createSelector(
    getRoles,
    (rolesByName) => {
        const rolesById: Dictionary<Role> = {};
        for (const role of Object.values(rolesByName)) {
            rolesById[role.id] = role;
        }
        return rolesById;
    },
);

export const getMyCurrentTeamPermissions = reselect.createSelector(
    getMyTeamRoles,
    getRoles,
    getMySystemPermissions,
    getCurrentTeamId,
    (myTeamRoles, roles, systemPermissions, teamId) => {
        const permissions = new Set<string>();
        let roleFound = false;
        if (myTeamRoles[teamId]) {
            for (const roleName of myTeamRoles[teamId]) {
                if (roles[roleName]) {
                    for (const permission of roles[roleName].permissions) {
                        permissions.add(permission);
                    }
                    roleFound = true;
                }
            }
        }
        for (const permission of systemPermissions) {
            permissions.add(permission);
        }
        return {permissions, roleFound};
    },
);

export const getMyCurrentChannelPermissions = reselect.createSelector(
    getMyChannelRoles,
    getRoles,
    getMyCurrentTeamPermissions,
    getCurrentChannelId,
    (myChannelRoles, roles, {permissions: teamPermissions, roleFound: teamRoleFound}, channelId) => {
        const permissions = new Set<string>();
        let roleFound = false;
        if (myChannelRoles[channelId]) {
            for (const roleName of myChannelRoles[channelId]) {
                if (roles[roleName]) {
                    for (const permission of roles[roleName].permissions) {
                        permissions.add(permission);
                    }
                    roleFound = teamRoleFound;
                }
            }
        }
        for (const permission of teamPermissions) {
            permissions.add(permission);
        }
        return {permissions, roleFound};
    },
);

export const getMyTeamPermissions = reselect.createSelector(
    getMyTeamRoles,
    getRoles,
    getMySystemPermissions,
    (state: GlobalState, options: PermissionsOptions) => options.team,
    (myTeamRoles, roles, systemPermissions, teamId) => {
        const permissions = new Set<string>();
        let roleFound = false;
        if (myTeamRoles[teamId!]) {
            for (const roleName of myTeamRoles[teamId!]) {
                if (roles[roleName]) {
                    for (const permission of roles[roleName].permissions) {
                        permissions.add(permission);
                    }
                    roleFound = true;
                }
            }
        }
        for (const permission of systemPermissions) {
            permissions.add(permission);
        }
        return {permissions, roleFound};
    },
);

export const getMyChannelPermissions = reselect.createSelector(
    getMyChannelRoles,
    getRoles,
    getMyTeamPermissions,
    (state, options: PermissionsOptions) => options,
    (myChannelRoles, roles, {permissions: teamPermissions, roleFound: teamRoleFound}, options: PermissionsOptions) => {
        const channelId = options.channel;
        const teamId = options.team;
        const permissions = new Set<string>();
        let roleFound = false;
        if (myChannelRoles[channelId!]) {
            for (const roleName of myChannelRoles[channelId!]) {
                if (roles[roleName]) {
                    for (const permission of roles[roleName].permissions) {
                        permissions.add(permission);
                    }
                    roleFound = teamRoleFound || !teamId;
                }
            }
        }
        for (const permission of teamPermissions) {
            permissions.add(permission);
        }
        return {permissions, roleFound};
    },
);

export const haveISystemPermission = reselect.createSelector(
    getMySystemPermissions,
    (state: GlobalState, options: PermissionsOptions) => options.permission,
    (permissions, permission) => {
        return permissions.has(permission);
    },
);

export const haveITeamPermission = reselect.createSelector(
    getMyTeamPermissions,
    (state, options) => options,
    ({permissions, roleFound}, options) => {
        const hasPermission = permissions.has(options.permission);
        if (roleFound) {
            return hasPermission;
        }
        return options.default === true || hasPermission;
    },
);

export const haveIChannelPermission = reselect.createSelector(
    getMyChannelPermissions,
    (state, options) => options,
    ({permissions, roleFound}, options) => {
        const hasPermission = permissions.has(options.permission);
        if (roleFound) {
            return hasPermission;
        }
        return options.default === true || hasPermission;
    },
);

export const haveICurrentTeamPermission = reselect.createSelector(
    getMyCurrentTeamPermissions,
    (state: GlobalState, options: PermissionsOptions) => options,
    ({permissions, roleFound}, options) => {
        const hasPermission = permissions.has(options.permission);
        if (roleFound) {
            return hasPermission;
        }
        return options.default === true || hasPermission;
    },
);

export const haveICurrentChannelPermission = reselect.createSelector(
    getMyCurrentChannelPermissions,
    (state: GlobalState, options: PermissionsOptions) => options,
    ({permissions, roleFound}, options) => {
        const hasPermission = permissions.has(options.permission);
        if (roleFound) {
            return hasPermission;
        }
        return options.default === true || hasPermission;
    },
);
