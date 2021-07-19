// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    fetchMyChannel,
    fetchMyChannelMember,
    makeDirectChannelVisibleIfNecessary,
    makeGroupMessageVisibleIfNecessary,
    markChannelAsUnread,
} from '@actions/helpers/channels';
import {markAsViewedAndReadBatch} from '@actions/views/channel';
import {getPostsAdditionalDataBatch, getPostThread} from '@actions/views/post';
import {WebsocketEvents} from '@constants';
import {ChannelTypes} from '@mm-redux/action_types';
import {getUnreadPostData, postDeleted, receivedNewPost, receivedPost} from '@mm-redux/actions/posts';
import {General} from '@mm-redux/constants';
import {
    getChannel,
    getCurrentChannelId,
    getMyChannelMember as selectMyChannelMember,
    isManuallyUnread,
} from '@mm-redux/selectors/entities/channels';
import {getPost as selectPost} from '@mm-redux/selectors/entities/posts';
import {isCollapsedThreadsEnabled} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {ActionResult, DispatchFunc, GenericAction, GetStateFunc, batchActions} from '@mm-redux/types/actions';
import {WebSocketMessage} from '@mm-redux/types/websocket';
import {getUserIdFromChannelName} from '@mm-redux/utils/channel_utils';
import {isFromWebhook, isSystemMessage, shouldIgnorePost} from '@mm-redux/utils/post_utils';
import {getViewingGlobalThreads} from '@selectors/threads';

export function handleNewPostEvent(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);
        const currentUserId = getCurrentUserId(state);
        const viewingGlobalThreads = getViewingGlobalThreads(state);

        const data = JSON.parse(msg.data.post);
        const post = {
            ...data,
            ownPost: data.user_id === currentUserId,
        };

        const actions: Array<GenericAction> = [];

        const exists = selectPost(state, post.pending_post_id);

        if (!exists) {
            if (getCurrentChannelId(state) === post.channel_id) {
                EventEmitter.emit(WebsocketEvents.INCREASE_POST_VISIBILITY_BY_ONE);
            }

            const myChannel = getChannel(state, post.channel_id);
            if (!myChannel) {
                const channel = await fetchMyChannel(post.channel_id);
                if (channel.data) {
                    actions.push({
                        type: ChannelTypes.RECEIVED_CHANNEL,
                        data: channel.data,
                    });
                }
            }

            const myChannelMember = selectMyChannelMember(state, post.channel_id);
            if (!myChannelMember) {
                const member = await fetchMyChannelMember(post.channel_id);
                if (member.data) {
                    actions.push({
                        type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                        data: member.data,
                    });
                }
            }

            const collapsedThreadsEnabled = isCollapsedThreadsEnabled(state);
            actions.push(receivedNewPost(post, collapsedThreadsEnabled));

            // If we don't have the thread for this post, fetch it from the server
            // and include the actions in the batch
            if (post.root_id) {
                const rootPost = selectPost(state, post.root_id);

                if (!rootPost) {
                    const thread: any = await dispatch(getPostThread(post.root_id, true));
                    if (thread.data?.length) {
                        actions.push(...thread.data);
                    }
                }
            }

            if (post.channel_id === currentChannelId) {
                const id = post.channel_id + post.root_id;
                const {typing} = state.entities;

                if (typing[id]) {
                    actions.push({
                        type: WebsocketEvents.STOP_TYPING,
                        data: {
                            id,
                            userId: post.user_id,
                            now: Date.now(),
                        },
                    });
                }
            }

            // Fetch and batch additional post data
            const additional: any = await dispatch(getPostsAdditionalDataBatch([post]));
            if (additional.data.length) {
                actions.push(...additional.data);
            }

            if (msg.data.channel_type === General.DM_CHANNEL) {
                const otherUserId = getUserIdFromChannelName(currentUserId, msg.data.channel_name);
                const dmAction = makeDirectChannelVisibleIfNecessary(state, otherUserId);
                if (dmAction) {
                    actions.push(dmAction);
                }
            } else if (msg.data.channel_type === General.GM_CHANNEL) {
                const gmActions = await makeGroupMessageVisibleIfNecessary(state, post.channel_id);
                if (gmActions) {
                    actions.push(...gmActions);
                }
            }

            if (!shouldIgnorePost(post)) {
                let markAsRead = false;
                let markAsReadOnServer = false;

                if (!isManuallyUnread(state, post.channel_id)) {
                    if (
                        post.user_id === getCurrentUserId(state) &&
                        !isSystemMessage(post) &&
                        !isFromWebhook(post)
                    ) {
                        markAsRead = true;
                        markAsReadOnServer = false;
                    } else if ((post.channel_id === currentChannelId) && !viewingGlobalThreads) {
                        // Don't mark as read if we're in global threads screen
                        // the currentChannelId still refers to previously viewed channel
                        markAsRead = true;
                        markAsReadOnServer = true;
                    }
                }

                if (markAsRead) {
                    const readActions = markAsViewedAndReadBatch(state, post.channel_id, undefined, markAsReadOnServer);
                    actions.push(...readActions);
                } else {
                    const unreadActions = markChannelAsUnread(state, msg.data.team_id, post.channel_id, msg.data.mentions, post.root_id === '');
                    actions.push(...unreadActions);
                }
            }

            dispatch(batchActions(actions, 'BATCH_WS_NEW_POST'));
        }

        return {data: true};
    };
}

export function handlePostEdited(msg: WebSocketMessage) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const data = JSON.parse(msg.data.post);
        const post = {
            ...data,
            ownPost: data.user_id === currentUserId,
        };
        const actions = [receivedPost(post)];

        const additional: any = await dispatch(getPostsAdditionalDataBatch([post]));
        if (additional.data.length) {
            actions.push(...additional.data);
        }

        dispatch(batchActions(actions, 'BATCH_WS_POST_EDITED'));
        return {data: true};
    };
}

export function handlePostDeleted(msg: WebSocketMessage): GenericAction {
    const data = JSON.parse(msg.data.post);

    return postDeleted(data);
}

export function handlePostUnread(msg: WebSocketMessage) {
    return (dispatch: DispatchFunc, getState: GetStateFunc): ActionResult => {
        const state = getState();
        const manual = isManuallyUnread(state, msg.broadcast.channel_id);

        if (!manual) {
            const member = selectMyChannelMember(state, msg.broadcast.channel_id);
            const delta = member ? member.msg_count - msg.data.msg_count : msg.data.msg_count;
            const info = {
                ...msg.data,
                user_id: msg.broadcast.user_id,
                team_id: msg.broadcast.team_id,
                channel_id: msg.broadcast.channel_id,
                deltaMsgs: delta,
            };
            const data = getUnreadPostData(info, state);
            dispatch({
                type: ChannelTypes.POST_UNREAD_SUCCESS,
                data,
            });
            return {data};
        }

        return {data: null};
    };
}
