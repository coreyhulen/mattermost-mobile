// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchChannelAndMyMember} from '@actions/helpers/channels';
import {loadChannelsForTeam} from '@actions/views/channel';
import {Client4} from '@client/rest';
import {WebsocketEvents} from '@constants';
import {ChannelTypes, TeamTypes, RoleTypes} from '@mm-redux/action_types';
import {markChannelAsRead} from '@mm-redux/actions/channels';
import {General} from '@mm-redux/constants';
import {
    getAllChannels,
    getChannel,
    getChannelsNameMapInTeam,
    getCurrentChannelId,
    getRedirectChannelNameForTeam,
} from '@mm-redux/selectors/entities/channels';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {ActionResult, DispatchFunc, GenericAction, GetStateFunc, batchActions} from '@mm-redux/types/actions';
import {WebSocketMessage} from '@mm-redux/types/websocket';
import {getChannelByName} from '@mm-redux/utils/channel_utils';
import EventEmitter from '@mm-redux/utils/event_emitter';

export function handleChannelConvertedEvent(msg: WebSocketMessage) {
    return (dispatch: DispatchFunc, getState: GetStateFunc): ActionResult => {
        const channelId = msg.data.channel_id;
        if (channelId) {
            const channel = getChannel(getState(), channelId);
            if (channel) {
                dispatch({
                    type: ChannelTypes.RECEIVED_CHANNEL,
                    data: {...channel, type: General.PRIVATE_CHANNEL},
                });
            }
        }
        return {data: true};
    };
}

export function handleChannelCreatedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const {channel_id: channelId, team_id: teamId} = msg.data;
        const state = getState();
        const channels = getAllChannels(state);
        const currentTeamId = getCurrentTeamId(state);

        if (teamId === currentTeamId && !channels[channelId]) {
            const channelActions = await fetchChannelAndMyMember(msg.broadcast.channel_id);
            if (channelActions.length) {
                dispatch(batchActions(channelActions, 'BATCH_WS_CHANNEL_CREATED'));
            }
        }
        return {data: true};
    };
}

export function handleChannelDeletedEvent(msg: WebSocketMessage) {
    return (dispatch: DispatchFunc, getState: GetStateFunc): ActionResult => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);
        const currentTeamId = getCurrentTeamId(state);
        const config = getConfig(state);
        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';
        const actions: Array<GenericAction> = [{
            type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
            data: {
                id: msg.data.channel_id,
                deleteAt: msg.data.delete_at,
                team_id: msg.broadcast.team_id,
                viewArchivedChannels,
            },
        }];

        if (msg.broadcast.team_id === currentTeamId) {
            if (msg.data.channel_id === currentChannelId && !viewArchivedChannels) {
                const channelsInTeam = getChannelsNameMapInTeam(state, currentTeamId);
                const channel = getChannelByName(channelsInTeam, getRedirectChannelNameForTeam(state, currentTeamId));
                if (channel && channel.id) {
                    actions.push({type: ChannelTypes.SELECT_CHANNEL, data: channel.id});
                }
                EventEmitter.emit(General.DEFAULT_CHANNEL, '');
            }
        }

        dispatch(batchActions(actions, 'BATCH_WS_CHANNEL_ARCHIVED'));

        return {data: true};
    };
}

export function handleChannelMemberUpdatedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc): Promise<ActionResult> => {
        try {
            const channelMember = JSON.parse(msg.data.channelMember);
            const rolesToLoad = channelMember.roles.split(' ');
            const actions: Array<GenericAction> = [{
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: channelMember,
            }];

            const roles = await Client4.getRolesByNames(rolesToLoad);
            if (roles.length) {
                actions.push({
                    type: RoleTypes.RECEIVED_ROLES,
                    data: roles,
                });
            }

            dispatch(batchActions(actions, 'BATCH_WS_CHANNEL_MEMBER_UPDATE'));
        } catch {
            //do nothing
        }
        return {data: true};
    };
}

export function handleChannelSchemeUpdatedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc): Promise<ActionResult> => {
        const channelActions = await fetchChannelAndMyMember(msg.broadcast.channel_id);
        if (channelActions.length) {
            dispatch(batchActions(channelActions, 'BATCH_WS_SCHEME_UPDATE'));
        }
        return {data: true};
    };
}

export function handleChannelUnarchiveEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const state = getState();
        const currentTeamId = getCurrentTeamId(state);
        const config = getConfig(state);
        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';

        if (msg.broadcast.team_id === currentTeamId) {
            const actions: Array<GenericAction> = [{
                type: ChannelTypes.RECEIVED_CHANNEL_UNARCHIVED,
                data: {
                    id: msg.data.channel_id,
                    team_id: msg.data.team_id,
                    deleteAt: 0,
                    viewArchivedChannels,
                },
            }];

            const {data: myData}: any = await dispatch(loadChannelsForTeam(currentTeamId, true));
            if (myData?.channels && myData?.channelMembers) {
                actions.push({
                    type: ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS,
                    data: myData,
                });
            }

            dispatch(batchActions(actions, 'BATCH_WS_CHANNEL_UNARCHIVED'));
        }
        return {data: true};
    };
}

export function handleChannelUpdatedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        let channel;
        try {
            channel = msg.data ? JSON.parse(msg.data.channel) : null;
        } catch (err) {
            return {error: err};
        }

        const currentChannelId = getCurrentChannelId(getState());
        if (channel) {
            dispatch({
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel,
            });

            if (currentChannelId === channel.id) {
                // Emit an event with the channel received as we need to handle
                // the changes without listening to the store
                EventEmitter.emit(WebsocketEvents.CHANNEL_UPDATED, channel);
            }
        }
        return {data: true};
    };
}

export function handleChannelViewedEvent(msg: WebSocketMessage) {
    return (dispatch: DispatchFunc, getState: GetStateFunc): ActionResult => {
        const state = getState();
        const {channel_id: channelId} = msg.data;
        const currentChannelId = getCurrentChannelId(state);
        const currentUserId = getCurrentUserId(state);

        if (channelId !== currentChannelId && currentUserId === msg.broadcast.user_id) {
            dispatch(markChannelAsRead(channelId, undefined, false));
        }
        return {data: true};
    };
}

export function handleDirectAddedEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc): Promise<ActionResult> => {
        const channelActions = await fetchChannelAndMyMember(msg.broadcast.channel_id);
        if (channelActions.length) {
            dispatch(batchActions(channelActions, 'BATCH_WS_DM_ADDED'));
        }
        return {data: true};
    };
}

export function handleUpdateMemberRoleEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc): Promise<ActionResult> => {
        const memberData = JSON.parse(msg.data.member);
        const roles = memberData.roles.split(' ');
        const actions = [];

        try {
            const newRoles = await Client4.getRolesByNames(roles);
            if (newRoles.length) {
                actions.push({
                    type: RoleTypes.RECEIVED_ROLES,
                    data: newRoles,
                });
            }
        } catch (error) {
            return {error};
        }

        actions.push({
            type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
            data: memberData,
        });

        dispatch(batchActions(actions));
        return {data: true};
    };
}

