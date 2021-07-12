// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {RoleTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {Role} from '@mm-redux/types/roles';
import {Dictionary} from '@mm-redux/types/utilities';

function pending(state: Set<string> = new Set(), action: GenericAction) {
    switch (action.type) {
    case RoleTypes.SET_PENDING_ROLES:
        return action.data;
    default:
        return state;
    }
}

function roles(state: Dictionary<Role> = {}, action: GenericAction) {
    switch (action.type) {
    case RoleTypes.RECEIVED_ROLES: {
        if (action.data) {
            const nextState = {...state};
            for (const role of action.data) {
                nextState[role.name] = role;
            }
            return nextState;
        }

        return state;
    }
    case RoleTypes.ROLE_DELETED: {
        if (action.data) {
            const nextState = {...state};
            Reflect.deleteProperty(nextState, action.data.name);
            return nextState;
        }

        return state;
    }
    case RoleTypes.RECEIVED_ROLE: {
        if (action.data) {
            const nextState = {...state};
            nextState[action.data.name] = action.data;
            return nextState;
        }

        return state;
    }
    default:
        return state;
    }
}

export default combineReducers({

    // object where the key is the category-name and has the corresponding value
    roles,
    pending,
});
