// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General} from '@constants';
import UserModel from '@typings/database/models/servers/user';

export function rolesIncludePermission(roles: string, permission: string): boolean {
    const rolesArray = roles.split(' ');
    return rolesArray.includes(permission);
}

//todo: add testscripts
export function isSystemAdmin(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_ADMIN_ROLE);
}

export function getUserIdFromChannelName(userId: string, channelName: string): string {
    const ids = channelName.split('__');
    let otherUserId = '';
    if (ids[0] === userId) {
        otherUserId = ids[1];
    } else {
        otherUserId = ids[0];
    }

    return otherUserId;
}

export function isInRole(roles: string, inRole: string) {
    if (roles) {
        const parts = roles.split(' ');
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === inRole) {
                return true;
            }
        }
    }

    return false;
}

export function isGuest(roles: string) {
    return isInRole(roles, 'system_guest');
}
