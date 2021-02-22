// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {intlShape} from 'react-intl';
import {batchActions} from 'redux-batched-actions';

import {ViewTypes} from 'app/constants';

import {ChannelTypes, RoleTypes, GroupTypes} from '@mm-redux/action_types';
import {
    fetchMyChannelsAndMembers,
    getChannelByName,
    joinChannel,
    leaveChannel as serviceLeaveChannel,
} from '@mm-redux/actions/channels';
import {savePreferences} from '@mm-redux/actions/preferences';
import {getLicense} from '@mm-redux/selectors/entities/general';
import {addUserToTeam, getTeamByName, removeUserFromTeam, selectTeam} from '@mm-redux/actions/teams';
import {Client4} from '@mm-redux/client';
import {General, Preferences} from '@mm-redux/constants';
import {getPostIdsInChannel} from '@mm-redux/selectors/entities/posts';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {
    getCurrentChannelId,
    getRedirectChannelNameForTeam,
    getChannelsNameMapInTeam,
    getMyChannelMemberships,
    isManuallyUnread,
} from '@mm-redux/selectors/entities/channels';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {getTeamByName as selectTeamByName, getCurrentTeam, getTeamMemberships} from '@mm-redux/selectors/entities/teams';

import {getChannelByName as selectChannelByName, getChannelsIdForTeam} from '@mm-redux/utils/channel_utils';
import EventEmitter from '@mm-redux/utils/event_emitter';

import {lastChannelIdForTeam, loadSidebarDirectMessagesProfiles} from '@actions/helpers/channels';
import {getPosts, getPostsBefore, getPostsSince, loadUnreadChannelPosts} from '@actions/views/post';
import {INSERT_TO_COMMENT, INSERT_TO_DRAFT} from '@constants/post_draft';
import {getChannelReachable} from '@selectors/channel';
import telemetry from '@telemetry';
import {isDirectChannelVisible, isGroupChannelVisible, getChannelSinceValue, privateChannelJoinPrompt} from '@utils/channels';
import {isPendingPost} from '@utils/general';
import {Action, DispatchFunc, GetStateFunc} from '@mm-redux/types/actions';
import {GlobalState} from '@mm-redux/types/store';
import {Channel, ChannelMembership} from '@mm-redux/types/channels';
import {Role} from '@mm-redux/types/roles';
import {AnyAction} from 'redux';

const MAX_RETRIES = 3;

export function loadChannelsByTeamName(teamName: string, errorHandler: () => void) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {currentTeamId} = state.entities.teams;

        if (teamName) {
            const team = selectTeamByName(state, teamName);

            if (!team && errorHandler) {
                errorHandler();
                return {error: true};
            }

            if (team && team.id !== currentTeamId) {
                await dispatch(fetchMyChannelsAndMembers(team.id));
            }
        }

        return {data: true};
    };
}

export function loadPostsIfNecessaryWithRetry(channelId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const postIds = getPostIdsInChannel(state, channelId);
        const actions = [];

        const time = Date.now();

        let loadMorePostsVisible = true;
        let postAction;
        if (!postIds || postIds.length < ViewTypes.POST_VISIBILITY_CHUNK_SIZE) {
            // Get the first page of posts if it appears we haven't gotten it yet, like the webapp
            postAction = getPosts(channelId);
        } else {
            const since = getChannelSinceValue(state, channelId, postIds);
            postAction = getPostsSince(channelId, since);
        }

        const received = await dispatch(fetchPostActionWithRetry(postAction));

        if (received.data) {
            actions.push({
                type: ViewTypes.RECEIVED_POSTS_FOR_CHANNEL_AT_TIME,
                channelId,
                time,
            },
            setChannelRetryFailed(false));

            if (received.data?.order) {
                const count = received.data.order.length;
                loadMorePostsVisible = count >= ViewTypes.POST_VISIBILITY_CHUNK_SIZE;
            }
        }

        actions.push(setLoadMorePostsVisible(loadMorePostsVisible));
        dispatch(batchActions(actions, 'BATCH_LOAD_POSTS_IN_CHANNEL'));

        return {};
    };
}

export function fetchPostActionWithRetry(action: Action, maxTries = MAX_RETRIES) {
    return async (dispatch: DispatchFunc) => {
        for (let i = 0; i <= maxTries; i++) {
            const {data} = await dispatch(action); // eslint-disable-line no-await-in-loop

            if (data) {
                return {data};
            }
        }

        dispatch(setChannelRetryFailed(true));

        return {};
    };
}

export function selectInitialChannel(teamId: string) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const channelId = lastChannelIdForTeam(state, teamId);

        dispatch(handleSelectChannel(channelId));

        return {};
    };
}

export function selectPenultimateChannel(teamId: string) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {channels, myMembers} = state.entities.channels;
        const {currentUserId} = state.entities.users;
        const {myPreferences} = state.entities.preferences;
        const lastChannelForTeam = state.views.team.lastChannelForTeam[teamId];
        const lastChannelId = lastChannelForTeam && lastChannelForTeam.length > 1 ? lastChannelForTeam[1] : '';
        const lastChannel = channels[lastChannelId];

        const isDMVisible = lastChannel && lastChannel.type === General.DM_CHANNEL &&
            isDirectChannelVisible(currentUserId, myPreferences, lastChannel);

        const isGMVisible = lastChannel && lastChannel.type === General.GM_CHANNEL &&
            isGroupChannelVisible(myPreferences, lastChannel);

        if (
            myMembers[lastChannelId] &&
            lastChannel &&
            lastChannel.delete_at === 0 &&
            (lastChannel.team_id === teamId || isDMVisible || isGMVisible)
        ) {
            dispatch(handleSelectChannel(lastChannelId));
            return;
        }

        dispatch(selectDefaultChannel(teamId));
    };
}

export function selectDefaultChannel(teamId: string) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();

        const channelsInTeam = getChannelsNameMapInTeam(state, teamId);
        const channel = selectChannelByName(channelsInTeam, getRedirectChannelNameForTeam(state, teamId));
        let channelId;
        if (channel) {
            channelId = channel.id;
        } else {
            // Handle case when the default channel cannot be found
            // so we need to get the first available channel of the team
            const channels = Object.values(channelsInTeam);
            const firstChannel = channels.length ? channels[0].id : '';
            channelId = firstChannel;
        }

        if (channelId) {
            dispatch(handleSelectChannel(channelId));
        }

        return {};
    };
}

export function handleSelectChannel(channelId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const dt = Date.now();
        const state = getState();
        const {channels, currentChannelId, myMembers} = state.entities.channels;
        const {currentTeamId} = state.entities.teams;
        const channel = channels[channelId];
        const member = myMembers[channelId];

        if (channel) {
            dispatch(loadPostsIfNecessaryWithRetry(channelId));

            let previousChannelId: string | undefined;
            if (currentChannelId !== channelId) {
                previousChannelId = currentChannelId;
            }

            const actions: AnyAction[] = markAsViewedAndReadBatch(state, channelId, previousChannelId);
            actions.push({
                type: ChannelTypes.SELECT_CHANNEL,
                data: channelId,
                extra: {
                    channel,
                    member,
                    teamId: channel.team_id || currentTeamId,
                },
            });

            dispatch(batchActions(actions, 'BATCH_SWITCH_CHANNEL'));

            console.log('channel switch to', channel?.display_name, channelId, (Date.now() - dt), 'ms'); //eslint-disable-line
        }

        return {data: true};
    };
}

export function handleSelectChannelByName(channelName: string, teamName: string, errorHandler?: () => void, intl?: typeof intlShape) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let state = getState();
        const {teams: currentTeams, currentTeamId} = state.entities.teams;
        const currentTeam = currentTeams[currentTeamId];
        const currentTeamName = currentTeam?.name;
        const currentUserId = getCurrentUserId(state);
        const currentChannelId = getCurrentChannelId(state);

        const {error: teamError, data: team} = await dispatch(getTeamByName(teamName || currentTeamName));

        // Fallback to API response error, if any.
        if (teamError) {
            if (errorHandler) {
                errorHandler();
            }
            return {error: teamError};
        }

        // Join team if not a member already
        const myTeamMemberships = getTeamMemberships(state);
        let joinedNewTeam = false;
        if (!myTeamMemberships[team.id]) {
            await dispatch(addUserToTeam(team.id, currentUserId));
            joinedNewTeam = true;
        }

        const {error: channelError, data: channel} = await dispatch(getChannelByName(team.id, channelName));

        state = getState();
        const reachable = getChannelReachable(state, channelName, teamName);

        if (!reachable && errorHandler) {
            errorHandler();
        }

        // Fallback to API response error, if any.
        if (channelError) {
            return {error: channelError};
        }

        // Join Channel if not a member already
        if (channel && currentChannelId !== channel.id) {
            const myChannelMemberships = getMyChannelMemberships(state);
            if (!myChannelMemberships[channel.id]) {
                if (channel.type === General.PRIVATE_CHANNEL) {
                    const {join} = await privateChannelJoinPrompt(channel, intl);
                    if (!join) {
                        if (joinedNewTeam) {
                            await dispatch(removeUserFromTeam(team.id, currentUserId));
                        }
                        return {data: true};
                    }
                }
                console.log('joining channel', channel?.display_name, channel.id); //eslint-disable-line
                const result = await dispatch(joinChannel(currentUserId, '', channel.id, ''));
                if (result.error || !result.data || !result.data.channel) {
                    if (joinedNewTeam) {
                        await dispatch(removeUserFromTeam(team.id, currentUserId));
                    }
                    return result;
                }
            }
        }

        if (teamName && teamName !== currentTeamName) {
            dispatch(selectTeam(team));
        }

        if (channel && currentChannelId !== channel.id) {
            dispatch(handleSelectChannel(channel.id));
        }

        return {data: true};
    };
}

export function handlePostDraftChanged(channelId: string, draft: string) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();

        if (state.views.channel.drafts[channelId]?.draft !== draft) {
            dispatch({
                type: ViewTypes.POST_DRAFT_CHANGED,
                channelId,
                draft,
            });
        }
    };
}

export function insertToDraft(value: string) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const threadId = state.entities.posts.selectedPostId;

        const insertEvent = threadId ? INSERT_TO_COMMENT : INSERT_TO_DRAFT;

        EventEmitter.emit(insertEvent, value);
    };
}

export function markChannelViewedAndRead(channelId: string, previousChannelId?: string, markOnServer = true) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const actions = markAsViewedAndReadBatch(state, channelId, previousChannelId, markOnServer);

        dispatch(batchActions(actions, 'BATCH_MARK_CHANNEL_VIEWED_AND_READ'));

        return {data: true};
    };
}

export function markAsViewedAndReadBatch(state: GlobalState, channelId: string, prevChannelId = '', markOnServer = true) {
    const actions = [];
    const {channels, myMembers} = state.entities.channels;
    const channel = channels[channelId];
    const member = myMembers[channelId];
    const prevMember = myMembers[prevChannelId];
    const prevChanManuallyUnread = isManuallyUnread(state, prevChannelId);
    const prevChannel = (!prevChanManuallyUnread && prevChannelId) ? channels[prevChannelId] : null; // May be null since prevChannelId is optional

    if (markOnServer) {
        Client4.viewMyChannel(channelId, prevChanManuallyUnread ? '' : prevChannelId).catch(() => {
            // do nothing just adding the handler to avoid the warning
        });
    }

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

        if (channel) {
            const unreadMessageCount = channel.total_msg_count - member.msg_count;
            actions.push({
                type: ChannelTypes.SET_UNREAD_MSG_COUNT,
                data: {
                    channelId,
                    count: unreadMessageCount,
                },
            }, {
                type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                data: {
                    teamId: channel.team_id,
                    channelId,
                    amount: unreadMessageCount,
                },
            }, {
                type: ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId: channel.team_id,
                    channelId,
                    amount: member.mention_count,
                },
            });
        }
    }

    if (prevMember) {
        if (!prevChanManuallyUnread) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...prevMember, last_viewed_at: Date.now()},
            });
        }

        if (prevChannel) {
            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                data: {
                    teamId: prevChannel.team_id,
                    channelId: prevChannelId,
                    amount: prevChannel.total_msg_count - prevMember.msg_count,
                },
            }, {
                type: ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId: prevChannel.team_id,
                    channelId: prevChannelId,
                    amount: prevMember.mention_count,
                },
            });
        }
    }

    return actions;
}

export function markChannelViewedAndReadOnReconnect(channelId: string) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        if (isManuallyUnread(getState(), channelId)) {
            return;
        }

        dispatch(markChannelViewedAndRead(channelId));
    };
}

export function toggleDMChannel(otherUserId: string, visible: string, channelId?: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {currentUserId} = state.entities.users;

        const dm = [{
            user_id: currentUserId,
            category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
            name: otherUserId,
            value: visible,
        }, {
            user_id: currentUserId,
            category: Preferences.CATEGORY_CHANNEL_OPEN_TIME,
            name: channelId || '',
            value: Date.now().toString(),
        }];

        dispatch(savePreferences(currentUserId, dm));

        return {};
    };
}

export function toggleGMChannel(channelId: string, visible: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {currentUserId} = state.entities.users;

        const gm = [{
            user_id: currentUserId,
            category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW,
            name: channelId,
            value: visible,
        }];

        dispatch(savePreferences(currentUserId, gm));
    };
}

export function closeDMChannel(channel: Channel) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);

        dispatch(toggleDMChannel(channel.teammate_id || '', 'false'));
        if (channel.id === currentChannelId) {
            dispatch(selectInitialChannel(state.entities.teams.currentTeamId));
        }
    };
}

export function closeGMChannel(channel: Channel) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);

        toggleGMChannel(channel.id, 'false')(dispatch, getState);
        if (channel.id === currentChannelId) {
            selectInitialChannel(state.entities.teams.currentTeamId)(dispatch, getState);
        }
    };
}

export function refreshChannelWithRetry(channelId: string) {
    return async (dispatch: DispatchFunc) => {
        dispatch(setChannelRefreshing(true));
        const received = await dispatch(fetchPostActionWithRetry(getPosts(channelId)));
        const posts = received.data;
        const actions: AnyAction[] = [setChannelRefreshing(false)];

        if (posts) {
            actions.push(setChannelRetryFailed(false));
        }

        dispatch(batchActions(actions, 'BATCH_REEFRESH_CHANNEL'));
        return {data: posts};
    };
}

export function leaveChannel(channel: Channel, reset = false) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {currentChannelId} = state.entities.channels;
        const {currentTeamId} = state.entities.teams;

        dispatch({
            type: ViewTypes.REMOVE_LAST_CHANNEL_FOR_TEAM,
            data: {
                teamId: currentTeamId,
                channelId: channel.id,
            },
        });

        if (channel.id === currentChannelId || reset) {
            await dispatch(selectDefaultChannel(currentTeamId));
        }

        await dispatch(serviceLeaveChannel(channel.id));
    };
}

export function setChannelLoading(loading = true) {
    if (loading) {
        telemetry.start(['channel:loading']);
    } else {
        telemetry.end(['channel:loading']);
    }

    return {
        type: ViewTypes.SET_CHANNEL_LOADER,
        loading,
    };
}

export function setChannelRefreshing(loading = true) {
    return {
        type: ViewTypes.SET_CHANNEL_REFRESHING,
        loading,
    };
}

export function setChannelRetryFailed(failed = true) {
    return {
        type: ViewTypes.SET_CHANNEL_RETRY_FAILED,
        failed,
    };
}

export function setChannelDisplayName(displayName: string) {
    return {
        type: ViewTypes.SET_CHANNEL_DISPLAY_NAME,
        displayName,
    };
}

// Returns true if there are more posts to load
export function increasePostVisibility(channelId: string, postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {loadingPosts} = state.views.channel;
        const currentUserId = getCurrentUserId(state);

        if (loadingPosts[channelId]) {
            return true;
        }

        if (!postId) {
            // No posts are visible, so the channel is empty
            return true;
        }

        if (isPendingPost(postId, currentUserId)) {
            // This is the first created post in the channel
            return true;
        }

        telemetry.reset();
        telemetry.start(['posts:loading']);

        dispatch({
            type: ViewTypes.LOADING_POSTS,
            data: true,
            channelId,
        });

        const pageSize = ViewTypes.POST_VISIBILITY_CHUNK_SIZE;

        const postAction = getPostsBefore(channelId, postId, 0, pageSize);
        const result = await dispatch(fetchPostActionWithRetry(postAction));

        const actions: AnyAction[] = [{
            type: ViewTypes.LOADING_POSTS,
            data: false,
            channelId,
        }];

        if (result.data) {
            actions.push(setChannelRetryFailed(false));
        }

        let hasMorePost = false;
        if (result.data?.order) {
            const count = result.data.order.length;
            hasMorePost = count >= pageSize;

            actions.push(setLoadMorePostsVisible(hasMorePost));
        }

        dispatch(batchActions(actions, 'BATCH_LOAD_MORE_POSTS'));
        telemetry.end(['posts:loading']);
        telemetry.save();

        return hasMorePost;
    };
}

function setLoadMorePostsVisible(visible: boolean) {
    return {
        type: ViewTypes.SET_LOAD_MORE_POSTS_VISIBLE,
        data: visible,
    };
}

function loadGroupData() {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const actions = [];
        const team = getCurrentTeam(state);
        const currentUserId = getCurrentUserId(state);
        const serverVersion = state.entities.general.serverVersion;
        const license = getLicense(state);
        const hasLicense = license?.IsLicensed === 'true' && license?.LDAPGroups === 'true';

        if (hasLicense && team && isMinimumServerVersion(serverVersion, 5, 24)) {
            for (let i = 0; i <= MAX_RETRIES; i++) {
                try {
                    if (team.group_constrained) {
                        const [getAllGroupsAssociatedToChannelsInTeam, getAllGroupsAssociatedToTeam] = await Promise.all([ //eslint-disable-line no-await-in-loop
                            Client4.getAllGroupsAssociatedToChannelsInTeam(team.id, true),
                            Client4.getAllGroupsAssociatedToTeam(team.id, true),
                        ]);

                        if (getAllGroupsAssociatedToChannelsInTeam.groups) {
                            actions.push({
                                type: GroupTypes.RECEIVED_ALL_GROUPS_ASSOCIATED_TO_CHANNELS_IN_TEAM,
                                data: {groupsByChannelId: getAllGroupsAssociatedToChannelsInTeam.groups},
                            });
                        }

                        if (getAllGroupsAssociatedToTeam) {
                            actions.push({
                                type: GroupTypes.RECEIVED_ALL_GROUPS_ASSOCIATED_TO_TEAM,
                                data: {...getAllGroupsAssociatedToTeam, teamID: team.id},
                            });
                        }
                    } else {
                        const [getAllGroupsAssociatedToChannelsInTeam, getGroups] = await Promise.all([ //eslint-disable-line no-await-in-loop
                            Client4.getAllGroupsAssociatedToChannelsInTeam(team.id, true),
                            Client4.getGroups(true, 0, 0),
                        ]);

                        if (getAllGroupsAssociatedToChannelsInTeam.groups) {
                            actions.push({
                                type: GroupTypes.RECEIVED_ALL_GROUPS_ASSOCIATED_TO_CHANNELS_IN_TEAM,
                                data: {groupsByChannelId: getAllGroupsAssociatedToChannelsInTeam.groups},
                            });
                        }

                        if (getGroups) {
                            actions.push({
                                type: GroupTypes.RECEIVED_GROUPS,
                                data: getGroups,
                            });
                        }
                    }
                    break;
                } catch (err) {
                    if (i === MAX_RETRIES) {
                        return {error: err};
                    }
                }
            }

            try {
                const myGroups = await Client4.getGroupsByUserId(currentUserId);
                if (myGroups.length) {
                    actions.push({
                        type: GroupTypes.RECEIVED_MY_GROUPS,
                        data: myGroups,
                    });
                }
            } catch {
                // do nothing
            }
        }

        if (actions.length) {
            dispatch(batchActions(actions, 'BATCH_GROUP_DATA'));
        }

        return {data: true};
    };
}

type LoadChannelsForTeamData = {
    sync: boolean,
    teamId: string,
    teamChannels: string[],
    channels?: Channel[],
    channelMembers?: ChannelMembership[],
    roles?: Role[],
}

export function loadChannelsForTeam(teamId: string, skipDispatch = false) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const data: LoadChannelsForTeamData = {
            sync: true,
            teamId,
            teamChannels: getChannelsIdForTeam(state, teamId),
        };

        const actions = [];

        if (currentUserId) {
            for (let i = 0; i <= MAX_RETRIES; i++) {
                try {
                    console.log('Fetching channels attempt', teamId, (i + 1)); //eslint-disable-line no-console
                    const [channels, channelMembers] = await Promise.all([ //eslint-disable-line no-await-in-loop
                        Client4.getMyChannels(teamId, true),
                        Client4.getMyChannelMembers(teamId),
                    ]);

                    data.channels = channels;
                    data.channelMembers = channelMembers;
                    break;
                } catch (err) {
                    if (i === MAX_RETRIES) {
                        const hasChannelsLoaded = state.entities.channels.channelsInTeam[teamId]?.length > 0;
                        return {error: hasChannelsLoaded ? null : err};
                    }
                }
            }

            if (data.channels) {
                actions.push({
                    type: ChannelTypes.RECEIVED_MY_CHANNELS_WITH_MEMBERS,
                    data,
                });

                if (!skipDispatch) {
                    const rolesToLoad = new Set<string>();
                    const members = data.channelMembers || [];
                    for (const member of members) {
                        for (const role of member.roles.split(' ')) {
                            rolesToLoad.add(role);
                        }
                    }

                    if (rolesToLoad.size > 0) {
                        try {
                            data.roles = await Client4.getRolesByNames(Array.from(rolesToLoad));
                            if (data.roles?.length) {
                                actions.push({
                                    type: RoleTypes.RECEIVED_ROLES,
                                    data: data.roles,
                                });
                            }
                        } catch {
                            //eslint-disable-next-line no-console
                            console.log('Could not retrieve channel members roles for the user');
                        }
                    }

                    dispatch(batchActions(actions, 'BATCH_LOAD_CHANNELS_FOR_TEAM'));
                }

                // Fetch needed profiles from channel creators and direct channels
                dispatch(loadSidebar(data));

                dispatch(loadUnreadChannelPosts(data.channels, data.channelMembers));
            }

            dispatch(loadGroupData());
        }

        return {data};
    };
}

export function loadSidebar(data: LoadChannelsForTeamData) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const {channels, channelMembers} = data;

        const sidebarActions = await loadSidebarDirectMessagesProfiles(state, channels || [], channelMembers || []);
        if (sidebarActions.length) {
            dispatch(batchActions(sidebarActions, 'BATCH_LOAD_SIDEBAR'));
        }

        return {data: true};
    };
}

export function resetUnreadMessageCount(channelId: string) {
    return async (dispatch: DispatchFunc) => {
        dispatch({
            type: ChannelTypes.SET_UNREAD_MSG_COUNT,
            data: {
                channelId,
                count: 0,
            },
        });
    };
}
