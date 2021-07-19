// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Client4} from '@client/rest';
import {General} from '../constants';
import {ChannelTypes, RoleTypes, TeamTypes, UserTypes} from '@mm-redux/action_types';
import EventEmitter from '@mm-redux/utils/event_emitter';

import {isCompatibleWithJoinViewTeamPermissions} from '@mm-redux/selectors/entities/general';
import {getRoles} from '@mm-redux/selectors/entities/roles_helpers';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';

import {GetStateFunc, DispatchFunc, ActionFunc, ActionResult, batchActions, Action} from '@mm-redux/types/actions';

import {Team} from '@mm-redux/types/teams';

import {selectChannel} from './channels';
import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getProfilesByIds, getStatusesByIds} from './users';
import {loadRolesIfNeeded} from './roles';

async function getProfilesAndStatusesForMembers(userIds: string[], dispatch: DispatchFunc, getState: GetStateFunc) {
    const {
        currentUserId,
        profiles,
        statuses,
    } = getState().entities.users;
    const profilesToLoad: string[] = [];
    const statusesToLoad: string[] = [];
    userIds.forEach((userId) => {
        if (!profiles[userId] && !profilesToLoad.includes(userId) && userId !== currentUserId) {
            profilesToLoad.push(userId);
        }

        if (!statuses[userId] && !statusesToLoad.includes(userId) && userId !== currentUserId) {
            statusesToLoad.push(userId);
        }
    });
    const requests: Promise<ActionResult|ActionResult[]>[] = [];

    if (profilesToLoad.length) {
        requests.push(dispatch(getProfilesByIds(profilesToLoad)));
    }

    if (statusesToLoad.length) {
        requests.push(dispatch(getStatusesByIds(statusesToLoad)));
    }

    await Promise.all(requests);
}

export function selectTeam(team: Team | string): ActionFunc {
    return async (dispatch: DispatchFunc) => {
        const teamId = (typeof team === 'string') ? team : team.id;
        dispatch({
            type: TeamTypes.SELECT_TEAM,
            data: teamId,
        });

        return {data: true};
    };
}

export function getMyTeams(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getMyTeams,
        onRequest: TeamTypes.MY_TEAMS_REQUEST,
        onSuccess: [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.MY_TEAMS_SUCCESS],
        onFailure: TeamTypes.MY_TEAMS_FAILURE,
    });
}

export function getMyTeamUnreads(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getMyTeamUnreads,
        onSuccess: TeamTypes.RECEIVED_MY_TEAM_UNREADS,
    });
}

export function getTeam(teamId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeam,
        onSuccess: TeamTypes.RECEIVED_TEAM,
        params: [
            teamId,
        ],
    });
}

export function getTeamByName(teamName: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamByName,
        onSuccess: TeamTypes.RECEIVED_TEAM,
        params: [
            teamName,
        ],
    });
}

export function getTeams(page = 0, perPage: number = General.TEAMS_CHUNK_SIZE, includeTotalCount = false): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;

        try {
            data = await Client4.getTeams(page, perPage, includeTotalCount);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const actions: Action[] = [
            {
                type: TeamTypes.RECEIVED_TEAMS_LIST,
                data: (includeTotalCount ? data.teams : data),
            },
            {
                type: TeamTypes.GET_TEAMS_SUCCESS,
                data,
            },
        ];

        if (includeTotalCount) {
            actions.push({
                type: TeamTypes.RECEIVED_TOTAL_TEAM_COUNT,
                data: data.total_count,
            });
        }

        dispatch(batchActions(actions, 'BATCH_GET_TEAMS'));

        return {data};
    };
}

export function createTeam(team: Team): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let created;
        try {
            created = await Client4.createTeam(team);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const member = {
            team_id: created.id,
            user_id: getState().entities.users.currentUserId,
            roles: `${General.TEAM_ADMIN_ROLE} ${General.TEAM_USER_ROLE}`,
            delete_at: 0,
            msg_count: 0,
            mention_count: 0,
            msg_count_root: 0,
            mention_count_root: 0,
        };

        dispatch(batchActions([
            {
                type: TeamTypes.CREATED_TEAM,
                data: created,
            },
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
                data: member,
            },
            {
                type: TeamTypes.SELECT_TEAM,
                data: created.id,
            },
        ], 'BATCH_CREATE_TEAM'));
        dispatch(loadRolesIfNeeded(member.roles.split(' ')));

        return {data: created};
    };
}

export function deleteTeam(teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.deleteTeam(teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const entities = getState().entities;
        const {
            currentTeamId,
        } = entities.teams;
        const actions: Action[] = [];
        if (teamId === currentTeamId) {
            EventEmitter.emit('leave_team');
            actions.push({type: ChannelTypes.SELECT_CHANNEL, data: ''});
        }

        actions.push(
            {
                type: TeamTypes.RECEIVED_TEAM_DELETED,
                data: {id: teamId},
            },
        );

        dispatch(batchActions(actions, 'BATCH_DELETE_TEAM'));

        return {data: true};
    };
}

export function updateTeam(team: Team): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.updateTeam,
        onSuccess: TeamTypes.UPDATED_TEAM,
        params: [
            team,
        ],
    });
}

export function patchTeam(team: Team): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.patchTeam,
        onSuccess: TeamTypes.PATCHED_TEAM,
        params: [
            team,
        ],
    });
}

export function getMyTeamMembers(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const getMyTeamMembersFunc = bindClientFunc({
            clientFunc: Client4.getMyTeamMembers,
            onSuccess: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
        });
        const teamMembers = (await getMyTeamMembersFunc(dispatch, getState)) as ActionResult;

        if ('data' in teamMembers && teamMembers.data) {
            const roles = new Set<string>();

            for (const teamMember of teamMembers.data) {
                for (const role of teamMember.roles.split(' ')) {
                    roles.add(role);
                }
            }
            if (roles.size > 0) {
                dispatch(loadRolesIfNeeded([...roles]));
            }
        }

        return teamMembers;
    };
}

export function getTeamMembers(teamId: string, page = 0, perPage: number = General.TEAMS_CHUNK_SIZE): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamMembers,
        onSuccess: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
        params: [
            teamId,
            page,
            perPage,
        ],
    });
}

export function getTeamMember(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let member;
        try {
            const memberRequest = Client4.getTeamMember(teamId, userId);

            getProfilesAndStatusesForMembers([userId], dispatch, getState);

            member = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
            data: [member],
        });

        return {data: member};
    };
}

export function getTeamsForUser(userId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamsForUser,
        onRequest: TeamTypes.GET_TEAMS_REQUEST,
        onSuccess: [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        onFailure: TeamTypes.GET_TEAMS_FAILURE,
        params: [
            userId,
        ],
    });
}

export function getTeamStats(teamId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamStats,
        onSuccess: TeamTypes.RECEIVED_TEAM_STATS,
        params: [
            teamId,
        ],
    });
}

export function addUserToTeam(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let member;
        try {
            member = await Client4.addToTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const actions: Array<Action> = [{
            type: UserTypes.RECEIVED_PROFILE_IN_TEAM,
            data: {id: teamId, user_id: userId},
        }, {
            type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
            data: member,
        }, {
            type: TeamTypes.RECEIVED_MEMBER_IN_TEAM,
            data: member,
        }];

        if (member.roles) {
            const state = getState();
            const currentRoles = getRoles(state);
            const rolesToLoad = new Set<string>();
            for (const role of member.roles?.split(' ')) {
                if (!currentRoles[role] && role.trim() !== '') {
                    rolesToLoad.add(role);
                }
            }

            if (rolesToLoad.size > 0) {
                try {
                    const roles = await Client4.getRolesByNames(Array.from(rolesToLoad));
                    if (roles.length) {
                        actions.push({
                            type: RoleTypes.RECEIVED_ROLES,
                            data: roles,
                        });
                    }
                } catch {
                    // do nothing
                }
            }
        }

        dispatch(batchActions(actions, 'BATCH_ADD_USER_TO_TEAM'));

        return {data: member};
    };
}

export function removeUserFromTeam(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.removeFromTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const member = {
            team_id: teamId,
            user_id: userId,
        };

        const actions: Action[] = [
            {
                type: UserTypes.RECEIVED_PROFILE_NOT_IN_TEAM,
                data: {id: teamId, user_id: userId},
            },
            {
                type: TeamTypes.REMOVE_MEMBER_FROM_TEAM,
                data: member,
            },
        ];

        const state = getState();
        const currentUserId = getCurrentUserId(state);

        if (userId === currentUserId) {
            const {channels, myMembers} = state.entities.channels;

            for (const channelMember of Object.values(myMembers)) {
                const channel = channels[channelMember.channel_id];

                if (channel && channel.team_id === teamId) {
                    actions.push({
                        type: ChannelTypes.LEAVE_CHANNEL,
                        data: channel,
                    });
                }
            }

            if (teamId === getCurrentTeamId(state)) {
                actions.push(selectChannel(''));
            }
        }

        dispatch(batchActions(actions, 'BATCH_REMOVE_USER_FROM_TEAM'));

        return {data: true};
    };
}

export function joinTeam(inviteId: string, teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.JOIN_TEAM_REQUEST, data: null});

        const state = getState();
        try {
            if (isCompatibleWithJoinViewTeamPermissions(state)) {
                const currentUserId = state.entities.users.currentUserId;
                await Client4.addToTeam(teamId, currentUserId);
            } else {
                await Client4.joinTeam(inviteId);
            }
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.JOIN_TEAM_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        getMyTeamUnreads()(dispatch, getState);

        await Promise.all([
            getTeam(teamId)(dispatch, getState),
            getMyTeamMembers()(dispatch, getState),
        ]);

        dispatch({type: TeamTypes.JOIN_TEAM_SUCCESS, data: null});
        return {data: true};
    };
}
