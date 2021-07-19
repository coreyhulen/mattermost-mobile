// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Client4} from '@client/rest';
import {General, Preferences} from '../constants';
import {ChannelTypes, PreferenceTypes, TeamTypes, UserTypes} from '@mm-redux/action_types';
import {savePreferences, deletePreferences} from './preferences';
import {compareNotifyProps, getChannelsIdForTeam, getChannelByName as selectChannelByName} from '@mm-redux/utils/channel_utils';
import {
    getChannelsNameMapInTeam,
    getMyChannelMember as getMyChannelMemberSelector,
    getRedirectChannelNameForTeam,
    isManuallyUnread,
} from '@mm-redux/selectors/entities/channels';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {Action, ActionFunc, batchActions, DispatchFunc, GetStateFunc} from '@mm-redux/types/actions';
import {Channel, ChannelNotifyProps, ChannelMembership} from '@mm-redux/types/channels';
import {PreferenceType} from '@mm-redux/types/preferences';
import {Dictionary} from '@mm-redux/types/utilities';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getMissingProfilesByIds} from './users';
import {loadRolesIfNeeded} from './roles';
import {analytics} from '@init/analytics';

export function selectChannel(channelId: string) {
    return {
        type: ChannelTypes.SELECT_CHANNEL,
        data: channelId,
    };
}

export function createChannel(channel: Channel, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let created;
        try {
            created = await Client4.createChannel(channel);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {
                    type: ChannelTypes.CREATE_CHANNEL_FAILURE,
                    error,
                },
                logError(error),
            ]));
            return {error};
        }

        const member = {
            channel_id: created.id,
            user_id: userId,
            roles: `${General.CHANNEL_USER_ROLE} ${General.CHANNEL_ADMIN_ROLE}`,
            last_viewed_at: 0,
            msg_count: 0,
            mention_count: 0,
            msg_count_root: 0,
            mention_count_root: 0,
            notify_props: {desktop: 'default', mark_unread: 'all'},
            last_update_at: created.create_at,
        };

        const actions: Action[] = [];
        const {channels, myMembers} = getState().entities.channels;

        if (!channels[created.id]) {
            actions.push({type: ChannelTypes.RECEIVED_CHANNEL, data: created});
        }

        if (!myMembers[created.id]) {
            actions.push({type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER, data: member});
            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        dispatch(batchActions([
            ...actions,
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS,
            },
        ]));

        return {data: created};
    };
}

export function createDirectChannel(userId: string, otherUserId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.CREATE_CHANNEL_REQUEST, data: null});

        let created;
        try {
            created = await Client4.createDirectChannel([userId, otherUserId]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CREATE_CHANNEL_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        const member = {
            channel_id: created.id,
            user_id: userId,
            roles: `${General.CHANNEL_USER_ROLE}`,
            last_viewed_at: 0,
            msg_count: 0,
            mention_count: 0,
            msg_count_root: 0,
            mention_count_root: 0,
            notify_props: {desktop: 'default', mark_unread: 'all'},
            last_update_at: created.create_at,
        };

        const preferences = [
            {user_id: userId, category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: otherUserId, value: 'true'},
            {user_id: userId, category: Preferences.CATEGORY_CHANNEL_OPEN_TIME, name: created.id, value: new Date().getTime().toString()},
        ];

        savePreferences(userId, preferences)(dispatch);

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: created,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
            {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: preferences,
            },
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                id: created.id,
                data: [{id: userId}, {id: otherUserId}],
            },
        ]));
        dispatch(loadRolesIfNeeded(member.roles.split(' ')));

        return {data: created};
    };
}

export function markGroupChannelOpen(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {currentUserId} = getState().entities.users;

        const preferences: Array<PreferenceType> = [
            {user_id: currentUserId, category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW, name: channelId, value: 'true'},
            {user_id: currentUserId, category: Preferences.CATEGORY_CHANNEL_OPEN_TIME, name: channelId, value: new Date().getTime().toString()},
        ];

        return dispatch(savePreferences(currentUserId, preferences));
    };
}

export function createGroupChannel(userIds: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.CREATE_CHANNEL_REQUEST, data: null});

        const {currentUserId} = getState().entities.users;

        let created;
        try {
            created = await Client4.createGroupChannel(userIds);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CREATE_CHANNEL_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        let member: Partial<ChannelMembership|undefined> = {
            channel_id: created.id,
            user_id: currentUserId,
            roles: `${General.CHANNEL_USER_ROLE}`,
            last_viewed_at: 0,
            msg_count: 0,
            mention_count: 0,
            msg_count_root: 0,
            mention_count_root: 0,
            notify_props: {desktop: 'default', mark_unread: 'all'},
            last_update_at: created.create_at,
        };

        // Check the channel previous existency: if the channel already have
        // posts is because it existed before.
        if (created.total_msg_count > 0) {
            const storeMember = getMyChannelMemberSelector(getState(), created.id);
            if (storeMember === null) {
                try {
                    member = await Client4.getMyChannelMember(created.id);
                } catch (error) {
                    // Log the error and keep going with the generated membership.
                    dispatch(logError(error));
                }
            } else {
                member = storeMember;
            }
        }

        dispatch(markGroupChannelOpen(created.id));

        const profilesInChannel = userIds.map((id) => ({id}));
        profilesInChannel.push({id: currentUserId}); // currentUserId is optionally in userIds, but the reducer will get rid of a duplicate

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: created,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                id: created.id,
                data: profilesInChannel,
            },
        ]));
        dispatch(loadRolesIfNeeded((member && member.roles && member.roles.split(' ')) || []));

        return {data: created};
    };
}

export function patchChannel(channelId: string, patch: Channel): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST, data: null});

        let updated;
        try {
            updated = await Client4.patchChannel(channelId, patch);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: updated,
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS,
            },
        ]));

        return {data: updated};
    };
}

export function updateChannel(channel: Channel): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST, data: null});

        let updated;
        try {
            updated = await Client4.updateChannel(channel);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: updated,
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS,
            },
        ]));

        return {data: updated};
    };
}

export function updateChannelPrivacy(channelId: string, privacy: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST, data: null});

        let updatedChannel;
        try {
            updatedChannel = await Client4.updateChannelPrivacy(channelId, privacy);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: updatedChannel,
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS,
            },
        ]));

        return {data: updatedChannel};
    };
}

export function convertChannelToPrivate(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST, data: null});

        let convertedChannel;
        try {
            convertedChannel = await Client4.convertChannelToPrivate(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: convertedChannel,
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS,
            },
        ]));

        return {data: convertedChannel};
    };
}

export function updateChannelNotifyProps(userId: string, channelId: string, props: ChannelNotifyProps): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const notifyProps = {
            user_id: userId,
            channel_id: channelId,
            ...props,
        };

        try {
            await Client4.updateChannelNotifyProps(notifyProps);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));

            return {error};
        }

        const member = getState().entities.channels.myMembers[channelId] || {};
        const currentNotifyProps = member.notify_props || {};

        // This triggers a re-sorting of channel sidebar, so ensure it's called only when
        // notification settings for a channel actually change.
        if (!compareNotifyProps(notifyProps, currentNotifyProps)) {
            dispatch({
                type: ChannelTypes.RECEIVED_CHANNEL_PROPS,
                data: {
                    channel_id: channelId,
                    notifyProps: {...currentNotifyProps, ...notifyProps},
                },
            });
        }

        return {data: true};
    };
}

export function getChannelByNameAndTeamName(teamName: string, channelName: string, includeDeleted = false): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        // The getChannelByNameForTeamName server endpoint had permission issues
        // which were fixed in v5.28. We use a different endpoint here until
        // the minimum server version required is 5.28 or greater.
        let team;
        try {
            team = await Client4.getTeamByName(teamName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.GET_TEAMS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        let channel;
        try {
            channel = await Client4.getChannelByName(team.id, channelName, includeDeleted);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_TEAM,
                data: team,
            },
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel,
            },
        ]));

        return {data: channel};
    };
}

export function getChannelByName(teamId: string, channelName: string, includeDeleted = false): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let channel;
        try {
            channel = await Client4.getChannelByName(teamId, channelName, includeDeleted);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL,
            data: channel,
        });

        return {data: channel};
    };
}

export function getChannel(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await Client4.getChannel(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL,
            data,
        });

        return {data};
    };
}

export function getChannelAndMyMember(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let channel;
        let member;
        try {
            const channelRequest = Client4.getChannel(channelId);
            const memberRequest = Client4.getMyChannelMember(channelId);

            channel = await channelRequest;
            member = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
        ]));
        dispatch(loadRolesIfNeeded(member.roles.split(' ')));

        return {data: {channel, member}};
    };
}

export function getChannelTimezones(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let channelTimezones;
        try {
            const channelTimezonesRequest = Client4.getChannelTimezones(channelId);

            channelTimezones = await channelTimezonesRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        return {data: channelTimezones};
    };
}

export function fetchMyChannelsAndMembers(teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({
            type: ChannelTypes.CHANNELS_REQUEST,
            data: null,
        });

        let channels;
        let channelMembers;
        const state = getState();
        const lastConnectAt = state.websocket?.lastConnectAt || 0;
        try {
            const channelRequest = Client4.getMyChannels(teamId, true, lastConnectAt);
            const memberRequest = Client4.getMyChannelMembers(teamId);
            channels = await channelRequest;
            channelMembers = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        const {currentUserId} = state.entities.users;
        const {currentChannelId} = state.entities.channels;

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
                currentChannelId,
            },
            {
                type: ChannelTypes.CHANNELS_SUCCESS,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS,
                data: channelMembers,
                channels,
                remove: getChannelsIdForTeam(state, teamId),
                currentUserId,
                currentChannelId,
            },
        ]));
        const roles = new Set<string>();
        for (const member of channelMembers) {
            for (const role of member.roles.split(' ')) {
                roles.add(role);
            }
        }
        if (roles.size > 0) {
            dispatch(loadRolesIfNeeded(roles));
        }

        return {data: {channels, members: channelMembers}};
    };
}

export function getMyChannelMembers(teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let channelMembers;
        try {
            const channelMembersRequest = Client4.getMyChannelMembers(teamId);

            channelMembers = await channelMembersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const state = getState();
        const {currentUserId} = state.entities.users;
        const {currentChannelId} = state.entities.channels;

        dispatch({
            type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS,
            data: channelMembers,
            remove: getChannelsIdForTeam(getState(), teamId),
            currentUserId,
            currentChannelId,
        });
        const roles = new Set<string>();

        for (const member of channelMembers) {
            for (const role of member.roles.split(' ')) {
                roles.add(role);
            }
        }
        if (roles.size > 0) {
            dispatch(loadRolesIfNeeded(roles));
        }

        return {data: channelMembers};
    };
}

export function getChannelMembers(channelId: string, page = 0, perPage: number = General.CHANNELS_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let channelMembers: ChannelMembership[];

        try {
            const channelMembersRequest = Client4.getChannelMembers(channelId, page, perPage);

            channelMembers = await channelMembersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const userIds = channelMembers.map((cm) => cm.user_id);
        getMissingProfilesByIds(userIds)(dispatch, getState);

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL_MEMBERS,
            data: channelMembers,
        });

        return {data: channelMembers};
    };
}

export function leaveChannel(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {currentUserId} = state.entities.users;
        const {channels, myMembers} = state.entities.channels;
        const channel = channels[channelId];
        const member = myMembers[channelId];

        analytics.trackAction('action_channels_leave', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.LEAVE_CHANNEL,
            data: {
                id: channelId,
                user_id: currentUserId,
                team_id: channel.team_id,
                type: channel.type,
            },
        });

        try {
            await Client4.removeFromChannel(currentUserId, channelId);
        } catch (error) {
            dispatch(batchActions([
                {
                    type: ChannelTypes.RECEIVED_CHANNEL,
                    data: channel,
                },
                {
                    type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                    data: member,
                },
            ]));
        }

        return {data: true};
    };
}

export function joinChannel(userId: string, teamId: string, channelId: string, channelName: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let member: ChannelMembership | undefined | null;
        let channel;
        try {
            if (channelId) {
                member = await Client4.addToChannel(userId, channelId);
                channel = await Client4.getChannel(channelId);
            } else if (channelName) {
                channel = await Client4.getChannelByName(teamId, channelName, true);
                if ((channel.type === General.GM_CHANNEL) || (channel.type === General.DM_CHANNEL)) {
                    member = await Client4.getChannelMember(channel.id, userId);
                } else {
                    member = await Client4.addToChannel(userId, channel.id);
                }
            }
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        analytics.trackAction('action_channels_join', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
        ]));
        if (member) {
            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        return {data: {channel, member}};
    };
}

export function deleteChannel(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let state = getState();
        const viewArchivedChannels = state.entities.general.config.ExperimentalViewArchivedChannels === 'true';

        try {
            await Client4.deleteChannel(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        state = getState();
        const {currentChannelId} = state.entities.channels;
        if (channelId === currentChannelId && !viewArchivedChannels) {
            const teamId = getCurrentTeamId(state);
            const channelsInTeam = getChannelsNameMapInTeam(state, teamId);
            const channel = selectChannelByName(channelsInTeam, getRedirectChannelNameForTeam(state, teamId));
            if (channel && channel.id) {
                dispatch({type: ChannelTypes.SELECT_CHANNEL, data: channel.id});
            }
        }

        dispatch({type: ChannelTypes.DELETE_CHANNEL_SUCCESS, data: {id: channelId, viewArchivedChannels}});

        return {data: true};
    };
}

export function unarchiveChannel(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.unarchiveChannel(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const state = getState();
        const config = getConfig(state);
        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';
        dispatch({type: ChannelTypes.UNARCHIVED_CHANNEL_SUCCESS, data: {id: channelId, viewArchivedChannels}});

        return {data: true};
    };
}

export function viewChannel(channelId: string, prevChannelId = ''): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {currentUserId} = getState().entities.users;

        const {myPreferences} = getState().entities.preferences;
        const viewTimePref = myPreferences[`${Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME}--${channelId}`];
        const viewTime = viewTimePref ? parseInt(viewTimePref.value!, 10) : 0;
        const prevChanManuallyUnread = isManuallyUnread(getState(), prevChannelId);

        if (viewTime < new Date().getTime() - (3 * 60 * 60 * 1000)) {
            const preferences = [
                {user_id: currentUserId, category: Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, name: channelId, value: new Date().getTime().toString()},
            ];
            savePreferences(currentUserId, preferences)(dispatch);
        }

        try {
            await Client4.viewMyChannel(channelId, prevChanManuallyUnread ? '' : prevChannelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));

            return {error};
        }

        const actions: Action[] = [];

        const {myMembers} = getState().entities.channels;
        const member = myMembers[channelId];
        if (member) {
            if (isManuallyUnread(getState(), channelId)) {
                actions.push({
                    type: ChannelTypes.REMOVE_MANUALLY_UNREAD,
                    data: {channelId},
                });
            }
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...member, last_viewed_at: new Date().getTime()},
            });
            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        const prevMember = myMembers[prevChannelId];
        if (!prevChanManuallyUnread && prevMember) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...prevMember, last_viewed_at: new Date().getTime()},
            });
            dispatch(loadRolesIfNeeded(prevMember.roles.split(' ')));
        }

        dispatch(batchActions(actions));

        return {data: true};
    };
}

export function markChannelAsViewed(channelId: string, prevChannelId = ''): ActionFunc {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const actions: Action[] = [];

        const {myMembers} = getState().entities.channels;
        const member = myMembers[channelId];
        const state = getState();
        if (member) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...member, last_viewed_at: Date.now()},
            });
            if (isManuallyUnread(state, channelId)) {
                actions.push({
                    type: ChannelTypes.REMOVE_MANUALLY_UNREAD,
                    data: {channelId},
                });
            }

            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        const prevMember = myMembers[prevChannelId];
        if (prevMember && !isManuallyUnread(getState(), prevChannelId)) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...prevMember, last_viewed_at: Date.now()},
            });
            dispatch(loadRolesIfNeeded(prevMember.roles.split(' ')));
        }

        if (actions.length) {
            dispatch(batchActions(actions));
        }

        return {data: true};
    };
}

export function getChannels(teamId: string, page = 0, perPage: number = General.CHANNELS_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null});

        let channels;
        try {
            channels = await Client4.getChannels(teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]));

        return {data: channels};
    };
}

export function getArchivedChannels(teamId: string, page = 0, perPage: number = General.CHANNELS_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let channels;
        try {
            channels = await Client4.getArchivedChannels(teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            return {error};
        }

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNELS,
            teamId,
            data: channels,
        });

        return {data: channels};
    };
}

// Returns all public shared channels
export function getSharedChannels(teamId: string, page = 0, perPage: number = General.CHANNELS_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let channels;
        try {
            channels = await Client4.getSharedChannels(teamId, page, perPage);
            channels = (channels || []).map((channel: Dictionary<string|boolean|number>) => {
                if (channel.delete_at === undefined) {
                    channel.delete_at = 0;
                }
                channel.type = General.OPEN_CHANNEL;
                channel.shared = true;
                return channel;
            });
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]));

        return {data: channels};
    };
}

export function getAllChannelsWithCount(page = 0, perPage: number = General.CHANNELS_CHUNK_SIZE, notAssociatedToGroup = '', excludeDefaultChannels = false): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.GET_ALL_CHANNELS_REQUEST, data: null});

        let payload;
        try {
            payload = await Client4.getAllChannels(page, perPage, notAssociatedToGroup, excludeDefaultChannels, true);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_ALL_CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_ALL_CHANNELS,
                data: payload.channels,
            },
            {
                type: ChannelTypes.GET_ALL_CHANNELS_SUCCESS,
            },
            {
                type: ChannelTypes.RECEIVED_TOTAL_CHANNEL_COUNT,
                data: payload.total_count,
            },
        ]));

        return {data: payload};
    };
}

export function getAllChannels(page = 0, perPage: number = General.CHANNELS_CHUNK_SIZE, notAssociatedToGroup = '', excludeDefaultChannels = false): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.GET_ALL_CHANNELS_REQUEST, data: null});

        let channels;
        try {
            channels = await Client4.getAllChannels(page, perPage, notAssociatedToGroup, excludeDefaultChannels);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_ALL_CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_ALL_CHANNELS,
                data: channels,
            },
            {
                type: ChannelTypes.GET_ALL_CHANNELS_SUCCESS,
            },
        ]));

        return {data: channels};
    };
}

export function autocompleteChannels(teamId: string, term: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null});

        let channels;
        try {
            channels = await Client4.autocompleteChannels(teamId, term);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]));

        return {data: channels};
    };
}

export function autocompleteChannelsForSearch(teamId: string, term: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null});

        let channels;
        try {
            channels = await Client4.autocompleteChannelsForSearch(teamId, term);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]));

        return {data: channels};
    };
}

export function searchChannels(teamId: string, term: string, archived?: boolean): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null});

        let channels;
        try {
            if (archived) {
                channels = await Client4.searchArchivedChannels(teamId, term);
            } else {
                channels = await Client4.searchChannels(teamId, term);
            }
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]));

        return {data: channels};
    };
}

export function getChannelStats(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let stat;
        try {
            stat = await Client4.getChannelStats(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL_STATS,
            data: stat,
        });

        return {data: stat};
    };
}

export function addChannelMember(channelId: string, userId: string, postRootId = ''): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let member;
        try {
            member = await Client4.addToChannel(userId, channelId, postRootId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        analytics.trackAction('action_channels_add_member', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL,
                data: {id: channelId, user_id: userId},
            },
            {
                type: ChannelTypes.RECEIVED_CHANNEL_MEMBER,
                data: member,
            },
            {
                type: ChannelTypes.ADD_CHANNEL_MEMBER_SUCCESS,
                id: channelId,
            },
        ], 'ADD_CHANNEL_MEMBER.BATCH'));

        return {data: member};
    };
}

export function removeChannelMember(channelId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.removeFromChannel(userId, channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        analytics.trackAction('action_channels_remove_member', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL,
                data: {id: channelId, user_id: userId},
            },
            {
                type: ChannelTypes.REMOVE_CHANNEL_MEMBER_SUCCESS,
                id: channelId,
            },
        ], 'REMOVE_CHANNEL_MEMBER.BATCH'));

        return {data: true};
    };
}

export function updateChannelHeader(channelId: string, header: string): ActionFunc {
    return async (dispatch: DispatchFunc) => {
        analytics.trackAction('action_channels_update_header', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_HEADER,
            data: {
                channelId,
                header,
            },
        });

        return {data: true};
    };
}

export function updateChannelPurpose(channelId: string, purpose: string): ActionFunc {
    return async (dispatch: DispatchFunc) => {
        analytics.trackAction('action_channels_update_purpose', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_PURPOSE,
            data: {
                channelId,
                purpose,
            },
        });

        return {data: true};
    };
}

export function markChannelAsRead(channelId: string, prevChannelId?: string, updateLastViewedAt = true): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const prevChanManuallyUnread = isManuallyUnread(getState(), prevChannelId);

        // Send channel last viewed at to the server
        if (updateLastViewedAt) {
            Client4.viewMyChannel(channelId, prevChanManuallyUnread ? '' : prevChannelId).then().catch((error) => {
                forceLogoutIfNecessary(error, dispatch, getState);
                dispatch(logError(error));
                return {error};
            });
        }

        const state = getState();
        const {channels, myMembers} = state.entities.channels;

        // Update channel member objects to set all mentions and posts as viewed
        const channel = channels[channelId];
        const prevChannel = (!prevChanManuallyUnread && prevChannelId) ? channels[prevChannelId] : null; // May be null since prevChannelId is optional

        // Update team member objects to set mentions and posts in channel as viewed
        const channelMember = myMembers[channelId];
        const prevChannelMember = (!prevChanManuallyUnread && prevChannelId) ? myMembers[prevChannelId] : null; // May also be null

        const actions: Action[] = [];

        if (channel && channelMember) {
            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                data: {
                    teamId: channel.team_id,
                    channelId,
                    amount: channel.total_msg_count - channelMember.msg_count,
                    amountRoot: channel.total_msg_count_root - channelMember.msg_count_root,
                },
            });

            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId: channel.team_id,
                    channelId,
                    amount: channelMember.mention_count,
                    amountRoot: channelMember.mention_count_root,
                },
            });
        }

        if (channel && isManuallyUnread(getState(), channelId)) {
            actions.push({
                type: ChannelTypes.REMOVE_MANUALLY_UNREAD,
                data: {channelId},
            });
        }

        if (prevChannel && prevChannelMember) {
            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                data: {
                    teamId: prevChannel.team_id,
                    channelId: prevChannelId,
                    amount: prevChannel.total_msg_count - prevChannelMember.msg_count,
                    amountRoot: prevChannel.total_msg_count_root - prevChannelMember.msg_count_root,
                },
            });

            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId: prevChannel.team_id,
                    channelId: prevChannelId,
                    amount: prevChannelMember.mention_count,
                    amountRoot: prevChannelMember.mention_count_root,
                },
            });
        }

        if (actions.length > 0) {
            dispatch(batchActions(actions));
        }

        return {data: true};
    };
}

// Increments the number of posts in the channel by 1 and marks it as unread if necessary

export function markChannelAsUnread(teamId: string, channelId: string, mentions: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {myMembers} = state.entities.channels;
        const {currentUserId} = state.entities.users;

        const actions: Action[] = [{
            type: ChannelTypes.INCREMENT_TOTAL_MSG_COUNT,
            data: {
                channelId,
                amount: 1,
            },
        }, {
            type: ChannelTypes.INCREMENT_UNREAD_MSG_COUNT,
            data: {
                teamId,
                channelId,
                amount: 1,
                onlyMentions: myMembers[channelId] && myMembers[channelId].notify_props &&
                    myMembers[channelId].notify_props.mark_unread === General.MENTION,
            },
        }];

        if (mentions && mentions.indexOf(currentUserId) !== -1) {
            actions.push({
                type: ChannelTypes.INCREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId,
                    channelId,
                    amount: 1,
                },
            });
        }

        dispatch(batchActions(actions));

        return {data: true};
    };
}

export function getChannelMembersByIds(channelId: string, userIds: Array<string>) {
    return bindClientFunc({
        clientFunc: Client4.getChannelMembersByIds,
        onSuccess: ChannelTypes.RECEIVED_CHANNEL_MEMBERS,
        params: [
            channelId,
            userIds,
        ],
    });
}

export function getChannelMember(channelId: string, userId: string) {
    return bindClientFunc({
        clientFunc: Client4.getChannelMember,
        onSuccess: ChannelTypes.RECEIVED_CHANNEL_MEMBER,
        params: [
            channelId,
            userId,
        ],
    });
}

export function getMyChannelMember(channelId: string) {
    return bindClientFunc({
        clientFunc: Client4.getMyChannelMember,
        onSuccess: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
        params: [
            channelId,
        ],
    });
}

export function favoriteChannel(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {currentUserId} = getState().entities.users;
        const preference: PreferenceType = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            name: channelId,
            value: 'true',
        };

        analytics.trackAction('action_channels_favorite');

        return dispatch(savePreferences(currentUserId, [preference]));
    };
}

export function unfavoriteChannel(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {currentUserId} = getState().entities.users;
        const preference: PreferenceType = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            name: channelId,
            value: '',
        };

        analytics.trackAction('action_channels_unfavorite');

        return deletePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export function getChannelMemberCountsByGroup(channelId: string, includeTimezones: boolean): ActionFunc {
    return async (dispatch: DispatchFunc) => {
        let channelMemberCountsByGroup;
        try {
            channelMemberCountsByGroup = await Client4.getChannelMemberCountsByGroup(channelId, includeTimezones);
        } catch (error) {
            return {error};
        }

        if (channelMemberCountsByGroup.length) {
            dispatch({
                type: ChannelTypes.RECEIVED_CHANNEL_MEMBER_COUNTS_BY_GROUP,
                data: {channelId, memberCounts: channelMemberCountsByGroup},
            });
        }

        return {data: true};
    };
}

export default {
    selectChannel,
    createChannel,
    createDirectChannel,
    updateChannel,
    patchChannel,
    updateChannelNotifyProps,
    getChannel,
    fetchMyChannelsAndMembers,
    getMyChannelMembers,
    getChannelTimezones,
    getChannelMembersByIds,
    leaveChannel,
    joinChannel,
    deleteChannel,
    unarchiveChannel,
    viewChannel,
    markChannelAsViewed,
    getChannels,
    autocompleteChannels,
    autocompleteChannelsForSearch,
    searchChannels,
    getChannelStats,
    addChannelMember,
    removeChannelMember,
    updateChannelHeader,
    updateChannelPurpose,
    markChannelAsRead,
    markChannelAsUnread,
    favoriteChannel,
    unfavoriteChannel,
};
