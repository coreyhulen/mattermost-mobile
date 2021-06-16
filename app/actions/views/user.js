// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {NavigationTypes} from 'app/constants';
import {ChannelCategoryTypes, GeneralTypes, RoleTypes, UserTypes} from '@mm-redux/action_types';
import {getDataRetentionPolicy} from '@mm-redux/actions/general';
import * as HelperActions from '@mm-redux/actions/helpers';
import {autoUpdateTimezone} from '@mm-redux/actions/timezone';
import {Client4} from '@client/rest';
import {General} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {getConfig, getLicense} from '@mm-redux/selectors/entities/general';
import {isTimezoneEnabled} from '@mm-redux/selectors/entities/timezone';
import {getCurrentUserId, getStatusForUserId} from '@mm-redux/selectors/entities/users';

import {setAppCredentials} from 'app/init/credentials';
import {setCSRFFromCookie} from '@utils/security';
import {getDeviceTimezone} from '@utils/timezone';
import {analytics} from '@init/analytics.ts';

const HTTP_UNAUTHORIZED = 401;

export function completeLogin(user, deviceToken) {
    return async (dispatch, getState) => {
        const state = getState();
        const config = getConfig(state);
        const license = getLicense(state);
        const token = Client4.getToken();
        const url = Client4.getUrl();

        setAppCredentials(deviceToken, user.id, token, url);

        // Set timezone
        const enableTimezone = isTimezoneEnabled(state);
        if (enableTimezone) {
            const timezone = getDeviceTimezone();
            dispatch(autoUpdateTimezone(timezone));
        }

        // Data retention
        if (config?.DataRetentionEnableMessageDeletion && config?.DataRetentionEnableMessageDeletion === 'true' &&
            license?.IsLicensed === 'true' && license?.DataRetention === 'true') {
            dispatch(getDataRetentionPolicy());
        } else {
            dispatch({type: GeneralTypes.RECEIVED_DATA_RETENTION_POLICY, data: {}});
        }
    };
}

export function getMe() {
    return async (dispatch) => {
        try {
            const data = {};
            data.me = await Client4.getMe();

            const actions = [{
                type: UserTypes.RECEIVED_ME,
                data: data.me,
            }];

            const roles = data.me.roles.split(' ');
            data.roles = await Client4.getRolesByNames(roles);
            if (data.roles.length) {
                actions.push({
                    type: RoleTypes.RECEIVED_ROLES,
                    data: data.roles,
                });
            }

            dispatch(batchActions(actions, 'BATCH_GET_ME'));
            return {data};
        } catch (error) {
            return {error};
        }
    };
}

export function loadMe(user, deviceToken, skipDispatch = false) {
    return async (dispatch, getState) => {
        const state = getState();
        const data = {user};
        const deviceId = state.entities?.general?.deviceToken;

        try {
            if (deviceId && !deviceToken && !skipDispatch) {
                await Client4.attachDevice(deviceId);
            }

            if (!user) {
                data.user = await Client4.getMe();
            }
        } catch (error) {
            dispatch(forceLogoutIfNecessary(error));
            return {error};
        }

        try {
            analytics.setUserId(data.user.id);
            analytics.setUserRoles(data.user.roles);

            // Execute all other requests in parallel
            const teamsRequest = Client4.getMyTeams();
            const teamMembersRequest = Client4.getMyTeamMembers();
            const teamUnreadRequest = Client4.getMyTeamUnreads();
            const preferencesRequest = Client4.getMyPreferences();
            const configRequest = Client4.getClientConfigOld();
            const actions = [];

            const [teams, teamMembers, teamUnreads, preferences, config] = await Promise.all([
                teamsRequest,
                teamMembersRequest,
                teamUnreadRequest,
                preferencesRequest,
                configRequest,
            ]);

            data.teams = teams;
            data.teamMembers = teamMembers;
            data.teamUnreads = teamUnreads;
            data.preferences = preferences;
            data.config = config;
            data.url = Client4.getUrl();

            const allCategories = [];

            teams.forEach(async (team) => {
                const channelCategories = await Client4.getChannelCategories(data.user.id, team.id);
                // eslint-disable-next-line no-console
                console.log('Channel Categories', channelCategories);
                const categories = channelCategories.categories;
                allCategories.push(categories);

                const order = channelCategories.order;
                actions.push({
                    type: ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER,
                    data: {
                        teamId: team.id,
                        order,
                    },
                });
            });

            actions.push({
                type: ChannelCategoryTypes.RECEIVED_CATEGORIES,
                data: {categories: Array.flat(allCategories)},
            });

            actions.push({
                type: UserTypes.LOGIN,
                data,
            });

            const rolesToLoad = new Set();
            for (const role of data.user.roles.split(' ')) {
                rolesToLoad.add(role);
            }

            for (const teamMember of teamMembers) {
                for (const role of teamMember.roles.split(' ')) {
                    rolesToLoad.add(role);
                }
            }
            if (rolesToLoad.size > 0) {
                data.roles = await Client4.getRolesByNames(Array.from(rolesToLoad));
                if (data.roles.length) {
                    actions.push({
                        type: RoleTypes.RECEIVED_ROLES,
                        data: data.roles,
                    });
                }
            }

            if (!skipDispatch) {
                dispatch(batchActions(actions, 'BATCH_LOAD_ME'));
            }
        } catch (error) {
            console.log('login error', error.stack); // eslint-disable-line no-console
            return {error};
        }

        return {data};
    };
}

export function login(loginId, password, mfaToken, ldapOnly = false) {
    return async (dispatch, getState) => {
        const state = getState();
        const deviceToken = state.entities?.general?.deviceToken;
        let user;

        try {
            user = await Client4.login(loginId, password, mfaToken, deviceToken, ldapOnly);
            await setCSRFFromCookie(Client4.getUrl());
        } catch (error) {
            return {error};
        }

        const result = await dispatch(loadMe(user));

        if (!result.error) {
            dispatch(completeLogin(user, deviceToken));
        }

        return result;
    };
}

export function ssoLogin() {
    return async (dispatch, getState) => {
        const state = getState();
        const deviceToken = state.entities?.general?.deviceToken;
        const result = await dispatch(loadMe());

        if (!result.error) {
            dispatch(completeLogin(result.data.user, deviceToken));
        }

        return result;
    };
}

export function logout(skipServerLogout = false) {
    return async () => {
        if (!skipServerLogout) {
            try {
                Client4.logout();
            } catch {
                // Do nothing
            }
        }

        EventEmitter.emit(NavigationTypes.NAVIGATION_RESET);
        return {data: true};
    };
}

export function forceLogoutIfNecessary(error) {
    return async (dispatch) => {
        if (error.status_code === HTTP_UNAUTHORIZED && error.url && !error.url.includes('/login')) {
            dispatch(logout(true));
            return true;
        }

        return false;
    };
}

export function setCurrentUserStatusOffline() {
    return (dispatch, getState) => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const status = getStatusForUserId(state, currentUserId);

        if (status !== General.OFFLINE) {
            dispatch({
                type: UserTypes.RECEIVED_STATUS,
                data: {
                    user_id: currentUserId,
                    status: General.OFFLINE,
                },
            });
        }
    };
}

/* eslint-disable no-import-assign */
HelperActions.forceLogoutIfNecessary = forceLogoutIfNecessary;
