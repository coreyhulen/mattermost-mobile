// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentUser} from '@mm-redux/selectors/entities/common';

import {GlobalState} from '@mm-redux/types/store';
import {UserProfile} from '@mm-redux/types/users';

export function getUserTimezone(state: GlobalState, id: string) {
    const profile = state.entities.users.profiles[id];
    return getTimezoneForUserProfile(profile);
}

function getTimezoneForUserProfile(profile: UserProfile) {
    if (profile && profile.timezone) {
        return {
            ...profile.timezone,
            useAutomaticTimezone: profile.timezone.useAutomaticTimezone === 'true',
        };
    }

    return {
        useAutomaticTimezone: true,
        automaticTimezone: '',
        manualTimezone: '',
    };
}

export function isTimezoneEnabled(state: GlobalState) {
    const {config} = state.entities.general;
    return config.ExperimentalTimezone === 'true';
}

export const getCurrentUserTimezone = createSelector(
    getCurrentUser,
    isTimezoneEnabled,
    (user, enabledTimezone) => {
        let timezone;
        if (enabledTimezone) {
            const userTimezone = getTimezoneForUserProfile(user);
            timezone = userTimezone.useAutomaticTimezone ? userTimezone.automaticTimezone : userTimezone.manualTimezone;
        }

        return timezone;
    },
);
