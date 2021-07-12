// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {logout} from '@actions/views/user';
import {Client4} from '@client/rest';
import {UserTypes} from '@mm-redux/action_types';
import {getCurrentUserId, getUsers} from '@mm-redux/selectors/entities/users';
import {batchActions, Action, ActionFunc, GenericAction, DispatchFunc, GetStateFunc} from '@mm-redux/types/actions';
import {Client4Error} from '@mm-redux/types/client4';
import {GlobalState} from '@mm-redux/types/store';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';

import {logError} from './errors';

type ActionType = string;
const HTTP_UNAUTHORIZED = 401;

export function forceLogoutIfNecessary(err: Client4Error, dispatch: DispatchFunc, getState: GetStateFunc) {
    const {currentUserId} = getState().entities.users;

    if ('status_code' in err && err.status_code === HTTP_UNAUTHORIZED && err.url && err.url.indexOf('/login') === -1 && currentUserId) {
        dispatch(logout(false));
    }
}

function dispatcher(type: ActionType, data: any, dispatch: DispatchFunc) {
    if (type.indexOf('SUCCESS') === -1) { // we don't want to pass the data for the request types
        dispatch(requestSuccess(type, data));
    } else {
        dispatch(requestData(type));
    }
}

export function requestData(type: ActionType): GenericAction {
    return {
        type,
        data: null,
    };
}

export function requestSuccess(type: ActionType, data: any) {
    return {
        type,
        data,
    };
}

export function requestFailure(type: ActionType, error: Client4Error): any {
    return {
        type,
        error,
    };
}

/**
 * Returns an ActionFunc which calls a specfied (client) function and
 * dispatches the specifed actions on request, success or failure.
 *
 * @export
 * @param {Object} obj                                       an object for destructirung required properties
 * @param {() => Promise<mixed>} obj.clientFunc              clientFunc to execute
 * @param {ActionType} obj.onRequest                         ActionType to dispatch on request
 * @param {(ActionType | Array<ActionType>)} obj.onSuccess   ActionType to dispatch on success
 * @param {ActionType} obj.onFailure                         ActionType to dispatch on failure
 * @param {...Array<any>} obj.params
 * @returns {ActionFunc} ActionFunc
 */

export function bindClientFunc({
    clientFunc,
    onRequest,
    onSuccess,
    onFailure,
    params = [],
}: {
    clientFunc: (...args: any[]) => Promise<any>;
    onRequest?: ActionType;
    onSuccess?: ActionType | Array<ActionType>;
    onFailure?: ActionType;
    params?: Array<any>;
}): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        if (onRequest) {
            dispatch(requestData(onRequest));
        }

        let data: any = null;
        try {
            data = await clientFunc(...params);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            const actions: Action[] = [logError(error)];
            if (onFailure) {
                actions.push(requestFailure(onFailure, error));
            }
            dispatch(batchActions(actions));
            return {error};
        }

        if (Array.isArray(onSuccess)) {
            onSuccess.forEach((s) => {
                dispatcher(s, data, dispatch);
            });
        } else if (onSuccess) {
            dispatcher(onSuccess, data, dispatch);
        }

        return {data};
    };
}

// Debounce function based on underscores modified to use es6 and a cb

export function debounce(func: (...args: any) => unknown, wait: number, immediate?: boolean, cb?: () => unknown) {
    let timeout: NodeJS.Timeout|null;
    return function fx(...args: Array<any>) {
        const runLater = () => {
            timeout = null;
            if (!immediate) {
                Reflect.apply(func, this, args);
                if (cb) {
                    cb();
                }
            }
        };
        const callNow = immediate && !timeout;
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(runLater, wait);
        if (callNow) {
            Reflect.apply(func, this, args);
            if (cb) {
                cb();
            }
        }
    };
}

export async function notVisibleUsersActions(state: GlobalState): Promise<Array<GenericAction>> {
    if (!isMinimumServerVersion(Client4.getServerVersion(), 5, 23)) {
        return [];
    }
    let knownUsers: Set<string>;
    try {
        const fetchResult = await Client4.getKnownUsers();
        knownUsers = new Set(fetchResult);
    } catch (err) {
        return [];
    }
    knownUsers.add(getCurrentUserId(state));
    const allUsers = Object.keys(getUsers(state));
    const usersToRemove = new Set(allUsers.filter((x) => !knownUsers.has(x)));

    const actions = [];
    for (const userToRemove of usersToRemove.values()) {
        actions.push({type: UserTypes.PROFILE_NO_LONGER_VISIBLE, data: {user_id: userToRemove}});
    }

    return actions;
}

export class FormattedError extends Error {
    intl: {
        id: string;
        defaultMessage: string;
        values: any;
    };

    constructor(id: string, defaultMessage: string, values: any = {}) {
        super(defaultMessage);
        this.intl = {
            id,
            defaultMessage,
            values,
        };
    }
}

