// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {NavigationTypes, ViewTypes} from '@constants';
import {ChannelTypes, GeneralTypes, TeamTypes} from '@mm-redux/action_types';
import {fetchMyChannelsAndMembers, getChannelAndMyMember} from '@mm-redux/actions/channels';
import {getDataRetentionPolicy} from '@mm-redux/actions/general';
import {receivedNewPost} from '@mm-redux/actions/posts';
import {getMyTeams, getMyTeamMembers} from '@mm-redux/actions/teams';
import {Client4} from '@client/rest';
import {General} from '@mm-redux/constants';
import {isCollapsedThreadsEnabled} from '@mm-redux/selectors/entities/preferences';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {getViewingGlobalThreads} from '@selectors/threads';
import initialState from '@store/initial_state';
import {getStateForReset} from '@store/utils';

import {markAsViewedAndReadBatch} from './channel';
import {handleNotViewingGlobalThreadsScreen} from './threads';

export function startDataCleanup() {
    return async (dispatch, getState) => {
        dispatch({
            type: ViewTypes.DATA_CLEANUP,
            payload: getState(),
        });
    };
}

export function loadConfigAndLicense() {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;

        try {
            const [config, license] = await Promise.all([
                Client4.getClientConfigOld(),
                Client4.getClientLicenseOld(),
            ]);

            const actions = [{
                type: GeneralTypes.CLIENT_CONFIG_RECEIVED,
                data: config,
            }, {
                type: GeneralTypes.CLIENT_LICENSE_RECEIVED,
                data: license,
            }];

            if (currentUserId) {
                if (license?.IsLicensed === 'true' && license?.DataRetention === 'true') {
                    dispatch(getDataRetentionPolicy());
                } else {
                    actions.push({type: GeneralTypes.RECEIVED_DATA_RETENTION_POLICY, data: {}});
                }
            }

            dispatch(batchActions(actions, 'BATCH_LOAD_CONFIG_AND_LICENSE'));

            return {config, license};
        } catch (error) {
            return {error};
        }
    };
}

export function loadFromPushNotification(notification) {
    return async (dispatch, getState) => {
        const state = getState();
        const {payload} = notification;
        const {currentTeamId, teams, myMembers: myTeamMembers} = state.entities.teams;
        const {channels} = state.entities.channels;

        let channelId = '';
        let teamId = currentTeamId;
        if (payload) {
            channelId = payload.channel_id;

            // when the notification does not have a team id is because its from a DM or GM
            teamId = payload.team_id || currentTeamId;
        }

        // load any missing data
        const loading = [];

        if (teamId && (!teams[teamId] || !myTeamMembers[teamId])) {
            loading.push(dispatch(getMyTeams()));
            loading.push(dispatch(getMyTeamMembers()));
        }

        if (channelId && !channels[channelId]) {
            loading.push(dispatch(fetchMyChannelsAndMembers(teamId)));
        }

        if (loading.length > 0) {
            await Promise.all(loading);
        }

        dispatch(handleSelectTeamAndChannel(teamId, channelId));

        return {data: true};
    };
}

export function handleSelectTeamAndChannel(teamId, channelId) {
    return async (dispatch, getState) => {
        const dt = Date.now();
        await dispatch(getChannelAndMyMember(channelId));

        const state = getState();
        const {channels, currentChannelId, myMembers} = state.entities.channels;
        const {currentTeamId} = state.entities.teams;
        const channel = channels[channelId];
        const member = myMembers[channelId];
        const actions = markAsViewedAndReadBatch(state, channelId);

        if (getViewingGlobalThreads(state)) {
            actions.push(handleNotViewingGlobalThreadsScreen());
        }

        // when the notification is from a team other than the current team
        if (teamId !== currentTeamId) {
            actions.push({type: TeamTypes.SELECT_TEAM, data: teamId});
        }

        if (channel && currentChannelId !== channelId) {
            actions.push({
                type: ChannelTypes.SELECT_CHANNEL,
                data: channelId,
                extra: {
                    channel,
                    member,
                    teamId: channel.team_id || currentTeamId,
                },
            });
        }

        if (actions.length) {
            dispatch(batchActions(actions, 'BATCH_SELECT_TEAM_AND_CHANNEL'));
        }

        // eslint-disable-next-line no-console
        console.log('channel switch from push notification to', channel?.display_name || channel?.id, (Date.now() - dt), 'ms');
    };
}

export function purgeOfflineStore() {
    return (dispatch, getState) => {
        const currentState = getState();

        dispatch({
            type: General.OFFLINE_STORE_PURGE,
            data: getStateForReset(initialState, currentState),
        });

        EventEmitter.emit(NavigationTypes.RESTART_APP);
        return {data: true};
    };
}

// A non-optimistic version of the createPost action in app/mm-redux with the file handling
// removed since it's not needed.
export function createPostForNotificationReply(post) {
    return async (dispatch, getState) => {
        const state = getState();
        const currentUserId = state.entities.users.currentUserId;

        const timestamp = Date.now();
        const pendingPostId = post.pending_post_id || `${currentUserId}:${timestamp}`;

        const newPost = {
            ...post,
            pending_post_id: pendingPostId,
            create_at: timestamp,
            update_at: timestamp,
        };

        try {
            const data = await Client4.createPost({...newPost, create_at: 0});
            const collapsedThreadsEnabled = isCollapsedThreadsEnabled(state);
            dispatch(receivedNewPost(data, collapsedThreadsEnabled));

            return {data};
        } catch (error) {
            return {error};
        }
    };
}

export function setDeepLinkURL(url) {
    return {
        type: ViewTypes.SET_DEEP_LINK_URL,
        url,
    };
}

export default {
    loadConfigAndLicense,
    loadFromPushNotification,
    purgeOfflineStore,
};
