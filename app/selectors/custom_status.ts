// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {Preferences} from '@mm-redux/constants';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {get} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUser, getUser} from '@mm-redux/selectors/entities/users';
import {GlobalState} from '@mm-redux/types/store';
import {UserCustomStatus} from '@mm-redux/types/users';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';

export function makeGetCustomStatus(): (state: GlobalState, userID?: string) => UserCustomStatus {
    return createSelector(
        (state: GlobalState, userID?: string) => (userID ? getUser(state, userID) : getCurrentUser(state)),
        (user) => {
            const userProps = user?.props || {};
            if (userProps.customStatus) {
                return JSON.parse(userProps.customStatus) || undefined;
            }

            return undefined;
        },
    );
}

export const getRecentCustomStatuses = createSelector(
    (state: GlobalState) => get(state, Preferences.CATEGORY_CUSTOM_STATUS, Preferences.NAME_RECENT_CUSTOM_STATUSES),
    (value) => {
        try {
            return value ? JSON.parse(value) : [];
        } catch (error) {
            return [];
        }
    },
);

export function isCustomStatusEnabled(state: GlobalState) {
    const config = getConfig(state);
    const serverVersion = state.entities.general.serverVersion;
    return config && config.EnableCustomUserStatuses === 'true' && isMinimumServerVersion(serverVersion, 5, 36);
}
