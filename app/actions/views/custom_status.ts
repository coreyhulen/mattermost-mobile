// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Client4} from '@client/rest';
import {UserTypes} from '@mm-redux/action_types';
import {logError} from '@mm-redux/actions/errors';
import {getCurrentUser} from '@mm-redux/selectors/entities/common';
import {ActionFunc, DispatchFunc, batchActions, GetStateFunc} from '@mm-redux/types/actions';
import {UserCustomStatus} from '@mm-redux/types/users';

export function setCustomStatus(customStatus: UserCustomStatus): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const user = getCurrentUser(getState());
        if (!user.props) {
            user.props = {};
        }

        const oldCustomStatus = user.props.customStatus;
        user.props.customStatus = JSON.stringify(customStatus);
        dispatch({type: UserTypes.RECEIVED_ME, data: user});

        try {
            await Client4.updateCustomStatus(customStatus);
        } catch (error) {
            user.props.customStatus = oldCustomStatus;
            dispatch(batchActions([
                {type: UserTypes.RECEIVED_ME, data: user},
                logError(error),
            ]));
            return {error};
        }

        return {data: true};
    };
}

export function unsetCustomStatus(): ActionFunc {
    return async (dispatch: DispatchFunc) => {
        try {
            await Client4.unsetCustomStatus();
        } catch (error) {
            dispatch(logError(error));
            return {error};
        }
        return {data: true};
    };
}

export function removeRecentCustomStatus(customStatus: UserCustomStatus): ActionFunc {
    return async (dispatch: DispatchFunc) => {
        try {
            await Client4.removeRecentCustomStatus(customStatus);
        } catch (error) {
            dispatch(logError(error));
            return {error};
        }

        return {data: true};
    };
}

export default {
    setCustomStatus,
    unsetCustomStatus,
    removeRecentCustomStatus,
};
