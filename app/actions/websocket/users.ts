// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchChannelAndMyMember} from '@actions/helpers/channels';
import {loadChannelsForTeam} from '@actions/views/channel';
import {getMe} from '@actions/views/user';
import {Client4} from '@client/rest';
import {ChannelTypes, TeamTypes, UserTypes, RoleTypes} from '@mm-redux/action_types';
import {notVisibleUsersActions} from '@mm-redux/actions/helpers';
import {General} from '@mm-redux/constants';
import {getAllChannels, getCurrentChannelId, getChannelMembersInChannels} from '@mm-redux/selectors/entities/channels';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUser, getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {ActionResult, DispatchFunc, GenericAction, GetStateFunc, batchActions} from '@mm-redux/types/actions';
import {WebSocketMessage} from '@mm-redux/types/websocket';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {isGuest} from '@mm-redux/utils/user_utils';

export function handleStatusChangedEvent(msg: WebSocketMessage): GenericAction {
    return {
        type: UserTypes.RECEIVED_STATUSES,
        data: [{user_id: msg.data.user_id, status: msg.data.status}],
    };
}

export function handleUserAddedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        try {
            const state = getState();
            const currentChannelId = getCurrentChannelId(state);
            const currentTeamId = getCurrentTeamId(state);
            const currentUserId = getCurrentUserId(state);
            const teamId = msg.data.team_id;
            const actions: Array<GenericAction> = [{
                type: ChannelTypes.CHANNEL_MEMBER_ADDED,
                data: {
                    channel_id: msg.broadcast.channel_id,
                    user_id: msg.data.user_id,
                },
            }];

            if (msg.broadcast.channel_id === currentChannelId) {
                const stat = await Client4.getChannelStats(currentChannelId);
                actions.push({
                    type: ChannelTypes.RECEIVED_CHANNEL_STATS,
                    data: stat,
                });
            }

            if (teamId === currentTeamId && msg.data.user_id === currentUserId) {
                const channelActions = await fetchChannelAndMyMember(msg.broadcast.channel_id);

                if (channelActions.length) {
                    actions.push(...channelActions);
                }
            }

            dispatch(batchActions(actions, 'BATCH_WS_USER_ADDED'));
        } catch (error) {
            //do nothing
        }
        return {data: true};
    };
}

export function handleUserRemovedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        try {
            const state = getState();
            const channels = getAllChannels(state);
            const currentChannelId = getCurrentChannelId(state);
            const currentTeamId = getCurrentTeamId(state);
            const currentUser = getCurrentUser(state);
            const actions: Array<GenericAction> = [];
            let channelId;
            let userId;

            if (msg.data.user_id) {
                userId = msg.data.user_id;
                channelId = msg.broadcast.channel_id;
            } else if (msg.broadcast.user_id) {
                channelId = msg.data.channel_id;
                userId = msg.broadcast.user_id;
            }

            if (userId) {
                actions.push({
                    type: ChannelTypes.CHANNEL_MEMBER_REMOVED,
                    data: {
                        channel_id: channelId,
                        user_id: userId,
                    },
                });
            }

            const channel = channels[currentChannelId];

            if (msg.data?.user_id !== currentUser.id) {
                const members = getChannelMembersInChannels(state);
                const isMember = Object.values(members).some((member) => member[msg.data.user_id]);
                if (channel && isGuest(currentUser.roles) && !isMember) {
                    actions.push({
                        type: UserTypes.PROFILE_NO_LONGER_VISIBLE,
                        data: {user_id: msg.data.user_id},
                    }, {
                        type: TeamTypes.REMOVE_MEMBER_FROM_TEAM,
                        data: {team_id: channel.team_id, user_id: msg.data.user_id},
                    });
                }
            }

            let redirectToDefaultChannel = false;
            if (msg.broadcast.user_id === currentUser.id && currentTeamId) {
                const {data: myData}: any = await dispatch(loadChannelsForTeam(currentTeamId, true));

                if (myData?.channels && myData?.channelMembers) {
                    actions.push({
                        type: ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS,
                        data: myData,
                    });
                }

                if (channel) {
                    actions.push({
                        type: ChannelTypes.LEAVE_CHANNEL,
                        data: {
                            id: msg.data.channel_id,
                            user_id: currentUser.id,
                            team_id: channel.team_id,
                            type: channel.type,
                        },
                    });
                }

                if (msg.data.channel_id === currentChannelId) {
                    // emit the event so the client can change his own state
                    redirectToDefaultChannel = true;
                }
                if (isGuest(currentUser.roles)) {
                    const notVisible = await notVisibleUsersActions(state);
                    if (notVisible.length) {
                        actions.push(...notVisible);
                    }
                }
            } else if (msg.data.channel_id === currentChannelId) {
                const stat = await Client4.getChannelStats(currentChannelId);
                actions.push({
                    type: ChannelTypes.RECEIVED_CHANNEL_STATS,
                    data: stat,
                });
            }

            dispatch(batchActions(actions, 'BATCH_WS_USER_REMOVED'));
            if (redirectToDefaultChannel) {
                EventEmitter.emit(General.REMOVED_FROM_CHANNEL, channel.display_name);
                EventEmitter.emit(General.SWITCH_TO_DEFAULT_CHANNEL, currentTeamId);
            }
        } catch {
            // do nothing
        }

        return {data: true};
    };
}

export function handleUserRoleUpdated(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc): Promise<ActionResult> => {
        try {
            const roles = msg.data.roles.split(' ');
            const data = await Client4.getRolesByNames(roles);

            dispatch({
                type: RoleTypes.RECEIVED_ROLES,
                data,
            });
        } catch {
            // do nothing
        }

        return {data: true};
    };
}

export function handleUserUpdatedEvent(msg: WebSocketMessage) {
    return (dispatch: DispatchFunc, getState: GetStateFunc): ActionResult => {
        const currentUser = getCurrentUser(getState());
        const user = msg.data.user;

        if (user.id === currentUser.id) {
            if (user.update_at > currentUser.update_at) {
                // Need to request me to make sure we don't override with sanitized fields from the
                // websocket event
                dispatch(getMe());
            }
        } else {
            dispatch({
                type: UserTypes.RECEIVED_PROFILES,
                data: {
                    [user.id]: user,
                },
            });
        }
        return {data: true};
    };
}
