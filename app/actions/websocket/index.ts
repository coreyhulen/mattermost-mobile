// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {loadChannelsForTeam, setChannelRetryFailed} from '@actions/views/channel';
import {getPostsSince} from '@actions/views/post';
import {loadMe} from '@actions/views/user';
import {WebsocketEvents} from '@constants';
import {ChannelTypes, GeneralTypes, PreferenceTypes, TeamTypes, UserTypes, RoleTypes} from '@mm-redux/action_types';
import {getProfilesByIds, getStatusesByIds} from '@mm-redux/actions/users';
import {Client4} from '@client/rest';
import {getThreads} from '@mm-redux/actions/threads';
import {General} from '@mm-redux/constants';
import {getCurrentChannelId, getCurrentChannelStats} from '@mm-redux/selectors/entities/channels';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getPostIdsInChannel} from '@mm-redux/selectors/entities/posts';
import {isCollapsedThreadsEnabled} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId, getUsers, getUserStatuses} from '@mm-redux/selectors/entities/users';
import {ActionResult, DispatchFunc, GenericAction, GetStateFunc, batchActions} from '@mm-redux/types/actions';
import {Channel, ChannelMembership} from '@mm-redux/types/channels';
import {GlobalState} from '@mm-redux/types/store';
import {TeamMembership} from '@mm-redux/types/teams';
import {WebSocketMessage} from '@mm-redux/types/websocket';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {removeUserFromList} from '@mm-redux/utils/user_utils';
import websocketClient from '@websocket';

import {
    handleChannelConvertedEvent,
    handleChannelCreatedEvent,
    handleChannelDeletedEvent,
    handleChannelMemberUpdatedEvent,
    handleChannelSchemeUpdatedEvent,
    handleChannelUnarchiveEvent,
    handleChannelUpdatedEvent,
    handleChannelViewedEvent,
    handleDirectAddedEvent,
    handleUpdateMemberRoleEvent,
} from './channels';
import {handleConfigChangedEvent, handleLicenseChangedEvent} from './general';
import {handleGroupUpdatedEvent} from './groups';
import {handleOpenDialogEvent} from './integrations';
import {handleNewPostEvent, handlePostDeleted, handlePostEdited, handlePostUnread} from './posts';
import {handlePreferenceChangedEvent, handlePreferencesChangedEvent, handlePreferencesDeletedEvent} from './preferences';
import {handleAddEmoji, handleReactionAddedEvent, handleReactionRemovedEvent} from './reactions';
import {handleRoleAddedEvent, handleRoleRemovedEvent, handleRoleUpdatedEvent} from './roles';
import {handleLeaveTeamEvent, handleUpdateTeamEvent, handleTeamAddedEvent} from './teams';
import {handleThreadUpdated, handleThreadReadChanged, handleThreadFollowChanged} from './threads';
import {handleStatusChangedEvent, handleUserAddedEvent, handleUserRemovedEvent, handleUserRoleUpdated, handleUserUpdatedEvent} from './users';
import {getChannelSinceValue} from '@utils/channels';
import {handleRefreshAppsBindings} from './apps';

export function init(additionalOptions: any = {}) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const config = getConfig(getState());
        let connUrl = additionalOptions.websocketUrl || config.WebsocketURL || Client4.getUrl();
        const authToken = Client4.getToken();

        connUrl += `${Client4.getUrlVersion()}/websocket`;
        websocketClient.setFirstConnectCallback(() => dispatch(handleFirstConnect()));
        websocketClient.setEventCallback((evt: WebSocketMessage) => dispatch(handleEvent(evt)));
        websocketClient.setMissedEventsCallback(() => dispatch(doMissedEvents()));
        websocketClient.setReconnectCallback(() => dispatch(handleReconnect()));
        websocketClient.setCloseCallback((connectFailCount: number) => dispatch(handleClose(connectFailCount)));

        const websocketOpts = {
            connectionUrl: connUrl,
            ...additionalOptions,
        };

        return websocketClient.initialize(authToken, websocketOpts);
    };
}

let reconnect = false;
export function close(shouldReconnect = false): GenericAction {
    reconnect = shouldReconnect;
    websocketClient.close(true);

    return {
        type: GeneralTypes.WEBSOCKET_CLOSED,
        timestamp: Date.now(),
        data: null,
    };
}

function wsConnected(timestamp = Date.now()) {
    return {
        type: GeneralTypes.WEBSOCKET_SUCCESS,
        timestamp,
        data: null,
    };
}

export function doFirstConnect(now: number) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const state = getState();
        const {lastDisconnectAt} = state.websocket;
        const actions: Array<GenericAction> = [wsConnected(now)];

        if (isMinimumServerVersion(Client4.getServerVersion(), 5, 14) && lastDisconnectAt) {
            const currentUserId = getCurrentUserId(state);
            const users = getUsers(state);
            const userIds = Object.keys(users);
            const userUpdates = await Client4.getProfilesByIds(userIds, {since: lastDisconnectAt});

            if (userUpdates.length) {
                removeUserFromList(currentUserId, userUpdates);
                actions.push({
                    type: UserTypes.RECEIVED_PROFILES_LIST,
                    data: userUpdates,
                });
            }
        }

        dispatch(batchActions(actions, 'BATCH_WS_CONNCET'));

        return {data: true};
    };
}

export function doMissedEvents() {
    return async (dispatch: DispatchFunc): Promise<ActionResult> => {
        dispatch(wsConnected());

        return {data: true};
    };
}

export function doReconnect(now: number) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const state = getState();
        const currentTeamId = getCurrentTeamId(state);
        const currentChannelId = getCurrentChannelId(state);
        const currentUserId = getCurrentUserId(state);
        const users = getUsers(state);
        const {lastDisconnectAt} = state.websocket;
        const actions: Array<GenericAction> = [];

        dispatch(batchActions([
            wsConnected(now),
            setChannelRetryFailed(false),
        ], 'BATCH_WS_SUCCESS'));

        try {
            const {data: me}: any = await dispatch(loadMe(null, null, true));

            if (!me.error) {
                const roles = [];

                if (me.roles?.length) {
                    roles.push(...me.roles);
                }

                actions.push({
                    type: UserTypes.RECEIVED_ME,
                    data: me.user,
                }, {
                    type: PreferenceTypes.RECEIVED_ALL_PREFERENCES,
                    data: me.preferences,
                }, {
                    type: TeamTypes.RECEIVED_MY_TEAM_UNREADS,
                    data: me.teamUnreads,
                }, {
                    type: TeamTypes.RECEIVED_TEAMS_LIST,
                    data: me.teams,
                }, {
                    type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                    data: me.teamMembers,
                });

                const currentTeamMembership = me.teamMembers.find((tm: TeamMembership) => tm.team_id === currentTeamId && tm.delete_at === 0);

                if (currentTeamMembership) {
                    const {data: myData}: any = await dispatch(loadChannelsForTeam(currentTeamId, true, true));

                    if (myData?.channels && myData?.channelMembers) {
                        actions.push({
                            type: ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS,
                            data: myData,
                        });

                        if (isCollapsedThreadsEnabled(state)) {
                            dispatch(getThreads(currentUserId, currentTeamId, '', '', undefined, false, false, (state.websocket?.lastDisconnectAt || Date.now())));
                        }

                        const stillMemberOfCurrentChannel = myData.channelMembers.find((cm: ChannelMembership) => cm.channel_id === currentChannelId);

                        const channelStillExists = myData.channels.find((c: Channel) => c.id === currentChannelId);
                        const config = me.config || getConfig(getState());
                        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';
                        if (!stillMemberOfCurrentChannel || !channelStillExists || (!viewArchivedChannels && channelStillExists.delete_at !== 0)) {
                            EventEmitter.emit(General.SWITCH_TO_DEFAULT_CHANNEL, currentTeamId);
                        } else {
                            const postIds = getPostIdsInChannel(state, currentChannelId);
                            const since = getChannelSinceValue(state, currentChannelId, postIds);
                            dispatch(getPostsSince(currentChannelId, since));
                        }
                    }

                    if (myData.roles?.length) {
                        roles.push(...myData.roles);
                    }
                } else {
                    // If the user is no longer a member of this team when reconnecting
                    const newMsg = {
                        data: {
                            user_id: currentUserId,
                            team_id: currentTeamId,
                        },
                    };
                    dispatch(handleLeaveTeamEvent(newMsg));
                }

                if (roles.length) {
                    actions.push({
                        type: RoleTypes.RECEIVED_ROLES,
                        data: roles,
                    });
                }

                if (isMinimumServerVersion(Client4.getServerVersion(), 5, 14) && lastDisconnectAt) {
                    const userIds = Object.keys(users);
                    const userUpdates = await Client4.getProfilesByIds(userIds, {since: lastDisconnectAt});

                    if (userUpdates.length) {
                        removeUserFromList(currentUserId, userUpdates);
                        actions.push({
                            type: UserTypes.RECEIVED_PROFILES_LIST,
                            data: userUpdates,
                        });
                    }
                }

                if (actions.length) {
                    dispatch(batchActions(actions, 'BATCH_WS_RECONNECT'));
                }
            }
        } catch (e) {
            // do nothing
        }

        return {data: true};
    };
}

export function handleUserTypingEvent(msg: WebSocketMessage) {
    return (dispatch: DispatchFunc, getState: GetStateFunc): ActionResult => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);

        if (currentChannelId === msg.broadcast.channel_id) {
            const profiles = getUsers(state);
            const statuses = getUserStatuses(state);
            const currentUserId = getCurrentUserId(state);
            const config = getConfig(state);
            const userId = msg.data.user_id;

            const data = {
                id: msg.broadcast.channel_id + msg.data.parent_id,
                userId,
                now: Date.now(),
            };

            dispatch({
                type: WebsocketEvents.TYPING,
                data,
            });

            setTimeout(() => {
                const newState = getState();
                const {typing} = newState.entities;

                if (typing && typing[data.id]) {
                    dispatch({
                        type: WebsocketEvents.STOP_TYPING,
                        data,
                    });
                }
            }, parseInt(config.TimeBetweenUserTypingUpdatesMilliseconds!, 10));

            if (!profiles[userId] && userId !== currentUserId) {
                dispatch(getProfilesByIds([userId]));
            }

            const status = statuses[userId];
            if (status !== General.ONLINE) {
                dispatch(getStatusesByIds([userId]));
            }
        }

        return {data: true};
    };
}

function handleFirstConnect() {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const config = getConfig(state);
        const now = Date.now();

        if (reconnect && config?.EnableReliableWebSockets !== 'true') {
            reconnect = false;
            return dispatch(doReconnect(now));
        }

        return dispatch(doFirstConnect(now));
    };
}

function handleReconnect() {
    return (dispatch: DispatchFunc) => {
        return dispatch(doReconnect(Date.now()));
    };
}

function handleClose(connectFailCount: number) {
    return {
        type: GeneralTypes.WEBSOCKET_FAILURE,
        error: connectFailCount,
        data: null,
        timestamp: Date.now(),
    };
}

function handleEvent(msg: WebSocketMessage) {
    return (dispatch: DispatchFunc) => {
        switch (msg.event) {
        case WebsocketEvents.POSTED:
        case WebsocketEvents.EPHEMERAL_MESSAGE:
            return dispatch(handleNewPostEvent(msg));
        case WebsocketEvents.POST_EDITED:
            return dispatch(handlePostEdited(msg));
        case WebsocketEvents.POST_DELETED:
            return dispatch(handlePostDeleted(msg));
        case WebsocketEvents.POST_UNREAD:
            return dispatch(handlePostUnread(msg));
        case WebsocketEvents.LEAVE_TEAM:
            return dispatch(handleLeaveTeamEvent(msg));
        case WebsocketEvents.UPDATE_TEAM:
            return dispatch(handleUpdateTeamEvent(msg));
        case WebsocketEvents.ADDED_TO_TEAM:
            return dispatch(handleTeamAddedEvent(msg));
        case WebsocketEvents.USER_ADDED:
            return dispatch(handleUserAddedEvent(msg));
        case WebsocketEvents.USER_REMOVED:
            return dispatch(handleUserRemovedEvent(msg));
        case WebsocketEvents.USER_UPDATED:
            return dispatch(handleUserUpdatedEvent(msg));
        case WebsocketEvents.ROLE_ADDED:
            return dispatch(handleRoleAddedEvent(msg));
        case WebsocketEvents.ROLE_REMOVED:
            return dispatch(handleRoleRemovedEvent(msg));
        case WebsocketEvents.ROLE_UPDATED:
            return dispatch(handleRoleUpdatedEvent(msg));
        case WebsocketEvents.USER_ROLE_UPDATED:
            return dispatch(handleUserRoleUpdated(msg));
        case WebsocketEvents.MEMBERROLE_UPDATED:
            return dispatch(handleUpdateMemberRoleEvent(msg));
        case WebsocketEvents.CHANNEL_CREATED:
            return dispatch(handleChannelCreatedEvent(msg));
        case WebsocketEvents.CHANNEL_DELETED:
            return dispatch(handleChannelDeletedEvent(msg));
        case WebsocketEvents.CHANNEL_UNARCHIVED:
            return dispatch(handleChannelUnarchiveEvent(msg));
        case WebsocketEvents.CHANNEL_UPDATED:
            return dispatch(handleChannelUpdatedEvent(msg));
        case WebsocketEvents.CHANNEL_CONVERTED:
            return dispatch(handleChannelConvertedEvent(msg));
        case WebsocketEvents.CHANNEL_VIEWED:
            return dispatch(handleChannelViewedEvent(msg));
        case WebsocketEvents.CHANNEL_MEMBER_UPDATED:
            return dispatch(handleChannelMemberUpdatedEvent(msg));
        case WebsocketEvents.CHANNEL_SCHEME_UPDATED:
            return dispatch(handleChannelSchemeUpdatedEvent(msg));
        case WebsocketEvents.DIRECT_ADDED:
            return dispatch(handleDirectAddedEvent(msg));
        case WebsocketEvents.PREFERENCE_CHANGED:
            return dispatch(handlePreferenceChangedEvent(msg));
        case WebsocketEvents.PREFERENCES_CHANGED:
            return dispatch(handlePreferencesChangedEvent(msg));
        case WebsocketEvents.PREFERENCES_DELETED:
            return dispatch(handlePreferencesDeletedEvent(msg));
        case WebsocketEvents.STATUS_CHANGED:
            return dispatch(handleStatusChangedEvent(msg));
        case WebsocketEvents.TYPING:
            return dispatch(handleUserTypingEvent(msg));
        case WebsocketEvents.HELLO:
            handleHelloEvent(msg);
            break;
        case WebsocketEvents.REACTION_ADDED:
            return dispatch(handleReactionAddedEvent(msg));
        case WebsocketEvents.REACTION_REMOVED:
            return dispatch(handleReactionRemovedEvent(msg));
        case WebsocketEvents.EMOJI_ADDED:
            return dispatch(handleAddEmoji(msg));
        case WebsocketEvents.LICENSE_CHANGED:
            return dispatch(handleLicenseChangedEvent(msg));
        case WebsocketEvents.CONFIG_CHANGED:
            return dispatch(handleConfigChangedEvent(msg));
        case WebsocketEvents.OPEN_DIALOG:
            return dispatch(handleOpenDialogEvent(msg));
        case WebsocketEvents.RECEIVED_GROUP:
            return dispatch(handleGroupUpdatedEvent(msg));
        case WebsocketEvents.THREAD_UPDATED:
            return dispatch(handleThreadUpdated(msg));
        case WebsocketEvents.THREAD_READ_CHANGED:
            return dispatch(handleThreadReadChanged(msg));
        case WebsocketEvents.THREAD_FOLLOW_CHANGED:
            return dispatch(handleThreadFollowChanged(msg));
        case WebsocketEvents.APPS_FRAMEWORK_REFRESH_BINDINGS: {
            return dispatch(handleRefreshAppsBindings());
        }
        }

        return {data: true};
    };
}

function handleHelloEvent(msg: WebSocketMessage) {
    const serverVersion = msg.data.server_version;
    if (serverVersion && Client4.serverVersion !== serverVersion) {
        Client4.serverVersion = serverVersion;
        EventEmitter.emit(General.SERVER_VERSION_CHANGED, serverVersion);
    }
}

// Helpers
let lastTimeTypingSent = 0;
export function userTyping(state: GlobalState, channelId: string, parentPostId: string): void {
    const config = getConfig(state);
    const t = Date.now();
    const stats = getCurrentChannelStats(state);
    const membersInChannel = stats ? stats.member_count : 0;

    if (((t - lastTimeTypingSent) > parseInt(config.TimeBetweenUserTypingUpdatesMilliseconds!, 10)) &&
        (membersInChannel < parseInt(config.MaxNotificationsPerChannel!, 10)) && (config.EnableUserTypingMessages === 'true')) {
        websocketClient.userTyping(channelId, parentPostId);
        lastTimeTypingSent = t;
    }
}
