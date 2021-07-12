// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Client4} from '@client/rest';
import {RoleTypes, TeamTypes} from '@mm-redux/action_types';
import {notVisibleUsersActions} from '@mm-redux/actions/helpers';
import {getCurrentTeamId, getTeams as getTeamsSelector} from '@mm-redux/selectors/entities/teams';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';
import {ActionResult, DispatchFunc, GenericAction, GetStateFunc, batchActions} from '@mm-redux/types/actions';
import {WebSocketMessage} from '@mm-redux/types/websocket';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {isGuest} from '@mm-redux/utils/user_utils';

export function handleLeaveTeamEvent(msg: Partial<WebSocketMessage>) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const state = getState();
        const teams = getTeamsSelector(state);
        const currentTeamId = getCurrentTeamId(state);
        const currentUser = getCurrentUser(state);

        if (currentUser.id === msg.data.user_id) {
            const actions: Array<GenericAction> = [{type: TeamTypes.LEAVE_TEAM, data: teams[msg.data.team_id]}];
            if (isGuest(currentUser.roles)) {
                const notVisible = await notVisibleUsersActions(state);
                if (notVisible.length) {
                    actions.push(...notVisible);
                }
            }
            dispatch(batchActions(actions, 'BATCH_WS_LEAVE_TEAM'));

            // if they are on the team being removed deselect the current team and channel
            if (currentTeamId === msg.data.team_id) {
                EventEmitter.emit('leave_team');
            }
        }
        return {data: true};
    };
}

export function handleUpdateTeamEvent(msg: WebSocketMessage): GenericAction {
    return {
        type: TeamTypes.UPDATED_TEAM,
        data: JSON.parse(msg.data.team),
    };
}

export function handleTeamAddedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc): Promise<ActionResult> => {
        try {
            const teamId = msg.data.team_id;
            const userId = msg.data.user_id;
            const [team, member, teamUnreads] = await Promise.all([
                Client4.getTeam(msg.data.team_id),
                Client4.getTeamMember(teamId, userId),
                Client4.getMyTeamUnreads(),
            ]);

            const actions = [];
            if (team) {
                actions.push({
                    type: TeamTypes.RECEIVED_TEAM,
                    data: team,
                });

                if (member) {
                    actions.push({
                        type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
                        data: member,
                    });

                    if (member.roles) {
                        const rolesToLoad = new Set<string>();
                        for (const role of member.roles.split(' ')) {
                            rolesToLoad.add(role);
                        }

                        if (rolesToLoad.size > 0) {
                            const roles = await Client4.getRolesByNames(Array.from(rolesToLoad));
                            if (roles.length) {
                                actions.push({
                                    type: RoleTypes.RECEIVED_ROLES,
                                    data: roles,
                                });
                            }
                        }
                    }
                }

                if (teamUnreads) {
                    actions.push({
                        type: TeamTypes.RECEIVED_MY_TEAM_UNREADS,
                        data: teamUnreads,
                    });
                }
            }

            if (actions.length) {
                dispatch(batchActions(actions, 'BATCH_WS_TEAM_ADDED'));
            }
        } catch {
            // do nothing
        }

        return {data: true};
    };
}
