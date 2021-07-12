// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */

import {Client4} from '@client/rest';
import {WebsocketEvents} from '@constants';
import {analytics} from '@init/analytics';
import {PostTypes, ChannelTypes, FileTypes, IntegrationTypes} from '@mm-redux/action_types';
import {General, Preferences, Posts} from '@mm-redux/constants';
import {getCurrentChannelId, getMyChannelMember as getMyChannelMemberSelector, isManuallyUnread} from '@mm-redux/selectors/entities/channels';
import {getCustomEmojisByName as selectCustomEmojisByName} from '@mm-redux/selectors/entities/emojis';
import {getConfig} from '@mm-redux/selectors/entities/general';
import * as Selectors from '@mm-redux/selectors/entities/posts';
import {getCurrentUserId, getUsersByUsername} from '@mm-redux/selectors/entities/users';
import {Action, ActionResult, batchActions, DispatchFunc, GetStateFunc, GenericAction} from '@mm-redux/types/actions';
import {ChannelUnread} from '@mm-redux/types/channels';
import {CustomEmoji} from '@mm-redux/types/emojis';
import {Post} from '@mm-redux/types/posts';
import {Reaction} from '@mm-redux/types/reactions';
import {GlobalState} from '@mm-redux/types/store';
import {UserProfile} from '@mm-redux/types/users';
import {Dictionary} from '@mm-redux/types/utilities';
import {getUserIdFromChannelName} from '@mm-redux/utils/channel_utils';
import {parseNeededCustomEmojisFromText} from '@mm-redux/utils/emoji_utils';
import {isCombinedUserActivityPost} from '@mm-redux/utils/post_list';
import {isFromWebhook, isSystemMessage, shouldIgnorePost} from '@mm-redux/utils/post_utils';

import {getMyChannelMember, markChannelAsUnread, markChannelAsRead, markChannelAsViewed} from './channels';
import {getCustomEmojiByName, getCustomEmojisByName} from './emojis';
import {logError} from './errors';
import {forceLogoutIfNecessary} from './helpers';
import {
    deletePreferences,
    makeDirectChannelVisibleIfNecessary,
    makeGroupMessageVisibleIfNecessary,
    savePreferences,
} from './preferences';
import {getProfilesByIds, getProfilesByUsernames, getStatusesByIds} from './users';

// receivedPost should be dispatched after a single post from the server. This typically happens when an existing post
// is updated.
export function receivedPost(post: Post) {
    return {
        type: PostTypes.RECEIVED_POST,
        data: post,
    };
}

// receivedNewPost should be dispatched when receiving a newly created post or when sending a request to the server
// to make a new post.
export function receivedNewPost(post: Post) {
    return {
        type: PostTypes.RECEIVED_NEW_POST,
        data: post,
    };
}

// receivedPosts should be dispatched when receiving multiple posts from the server that may or may not be ordered.
// This will typically be used alongside other actions like receivedPostsAfter which require the posts to be ordered.
export function receivedPosts(posts: CombinedPostList) {
    return {
        type: PostTypes.RECEIVED_POSTS,
        data: posts,
    };
}

// receivedPostsAfter should be dispatched when receiving an ordered list of posts that come before a given post.
export function receivedPostsAfter(posts: Array<Post>, channelId: string, afterPostId: string, recent = false) {
    return {
        type: PostTypes.RECEIVED_POSTS_AFTER,
        channelId,
        data: posts,
        afterPostId,
        recent,
    };
}

// receivedPostsBefore should be dispatched when receiving an ordered list of posts that come after a given post.
export function receivedPostsBefore(posts: Array<Post>, channelId: string, beforePostId: string, oldest = false) {
    return {
        type: PostTypes.RECEIVED_POSTS_BEFORE,
        channelId,
        data: posts,
        beforePostId,
        oldest,
    };
}

// receivedPostsSince should be dispatched when receiving a list of posts that have been updated since a certain time.
// Due to how the API endpoint works, some of these posts will be ordered, but others will not, so this needs special
// handling from the reducers.
export function receivedPostsSince(posts: Array<Post>, channelId: string) {
    return {
        type: PostTypes.RECEIVED_POSTS_SINCE,
        channelId,
        data: posts,
    };
}

// receivedPostsInChannel should be dispatched when receiving a list of ordered posts within a channel when the
// adjacent posts are not known.
export function receivedPostsInChannel(posts: CombinedPostList, channelId: string, recent = false, oldest = false) {
    return {
        type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
        channelId,
        data: posts,
        recent,
        oldest,
    };
}

// receivedPostsInThread should be dispatched when receiving a list of unordered posts in a thread.
export function receivedPostsInThread(posts: Array<Post>, rootId: string) {
    return {
        type: PostTypes.RECEIVED_POSTS_IN_THREAD,
        data: posts,
        rootId,
    };
}

// postDeleted should be dispatched when a post has been deleted and should be replaced with a "message deleted"
// placeholder. This typically happens when a post is deleted by another user.
export function postDeleted(post: Post) {
    return {
        type: PostTypes.POST_DELETED,
        data: post,
    };
}

// postRemoved should be dispatched when a post should be immediately removed. This typically happens when a post is
// deleted by the current user.
export function postRemoved(post: Post) {
    return {
        type: PostTypes.POST_REMOVED,
        data: post,
    };
}

export function getPost(postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let post;

        try {
            post = await Client4.getPost(postId);
            getProfilesAndStatusesForPosts([post], dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            receivedPost(post),
            {
                type: PostTypes.GET_POSTS_SUCCESS,
            },
        ]));

        return {data: post};
    };
}

export function createPost(post: Post, files: any[] = []) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentUserId = state.entities.users.currentUserId;
        const timestamp = Date.now();
        const pendingPostId = post.pending_post_id || `${currentUserId}:${timestamp}`;
        let actions: Array<Action> = [];

        if (Selectors.isPostIdSending(state, pendingPostId)) {
            return {data: true};
        }

        let newPost = {
            ...post,
            pending_post_id: pendingPostId,
            create_at: timestamp,
            update_at: timestamp,
            ownPost: true,
        };

        // We are retrying a pending post that had files
        if (newPost.file_ids && !files.length) {
            files = newPost.file_ids.map((id) => state.entities.files.files[id]); // eslint-disable-line
        }

        if (files.length) {
            const fileIds = files.map((file) => file.id);

            newPost = {
                ...newPost,
                file_ids: fileIds,
            };

            actions.push({
                type: FileTypes.RECEIVED_FILES_FOR_POST,
                postId: pendingPostId,
                data: files,
            });
        }

        actions.push({
            type: PostTypes.RECEIVED_NEW_POST,
            data: {
                ...newPost,
                id: pendingPostId,
            },
        });

        dispatch(batchActions(actions, 'BATCH_CREATE_POST_INIT'));

        try {
            const created = await Client4.createPost({...newPost, create_at: 0});

            actions = [
                receivedPost({...created, ownPost: true}),
                {
                    type: ChannelTypes.INCREMENT_TOTAL_MSG_COUNT,
                    data: {
                        channelId: newPost.channel_id,
                        amount: 1,
                    },
                },
                {
                    type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                    data: {
                        channelId: newPost.channel_id,
                        amount: 1,
                    },
                },
            ];

            if (files) {
                actions.push({
                    type: FileTypes.RECEIVED_FILES_FOR_POST,
                    postId: created.id,
                    data: files,
                });
            }

            dispatch(batchActions(actions, 'BATCH_CREATE_POST'));
            return {data: true};
        } catch (error) {
            const data = {
                ...newPost,
                id: pendingPostId,
                failed: true,
                update_at: Date.now(),
            };
            actions = [{type: PostTypes.CREATE_POST_FAILURE, error}];

            // If the failure was because: the root post was deleted or
            // TownSquareIsReadOnly=true then remove the post
            if (error.server_error_id === 'api.post.create_post.root_id.app_error' ||
                error.server_error_id === 'api.post.create_post.town_square_read_only' ||
                error.server_error_id === 'plugin.message_will_be_posted.dismiss_post'
            ) {
                actions.push(removePost(data) as any);
            } else {
                actions.push(receivedPost(data));
            }

            dispatch(batchActions(actions, 'BATCH_CREATE_POST_FAILED'));
            return {data: false};
        }
    };
}

export function createPostImmediately(post: Post, files: any[] = []) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentUserId = state.entities.users.currentUserId;

        const timestamp = Date.now();
        const pendingPostId = `${currentUserId}:${timestamp}`;

        let newPost: Post = {
            ...post,
            pending_post_id: pendingPostId,
            create_at: timestamp,
            update_at: timestamp,
            ownPost: true,
        };

        if (files.length) {
            const fileIds = files.map((file) => file.id);

            newPost = {
                ...newPost,
                file_ids: fileIds,
            };

            dispatch({
                type: FileTypes.RECEIVED_FILES_FOR_POST,
                postId: pendingPostId,
                data: files,
            });
        }

        dispatch(
            receivedNewPost({
                ...newPost,
                id: pendingPostId,
            }),
        );

        try {
            const created = await Client4.createPost({...newPost, create_at: 0});

            const actions: Action[] = [
                receivedPost({...created, ownPost: true}),
                {
                    type: ChannelTypes.INCREMENT_TOTAL_MSG_COUNT,
                    data: {
                        channelId: newPost.channel_id,
                        amount: 1,
                    },
                },
                {
                    type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                    data: {
                        channelId: newPost.channel_id,
                        amount: 1,
                    },
                },
            ];

            if (files) {
                actions.push({
                    type: FileTypes.RECEIVED_FILES_FOR_POST,
                    postId: newPost.id,
                    data: files,
                });
            }

            dispatch(batchActions(actions));
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: PostTypes.CREATE_POST_FAILURE, error},
                removePost({...newPost, id: pendingPostId}) as any,
                logError(error),
            ]));
            return {error};
        }

        return {data: newPost};
    };
}

export function resetCreatePostRequest() {
    return {type: PostTypes.CREATE_POST_RESET_REQUEST};
}

export function deletePost(post: ExtendedPost) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        if (post.type === Posts.POST_TYPES.COMBINED_USER_ACTIVITY && post.system_post_ids) {
            post.system_post_ids.forEach((systemPostId) => {
                const systemPost = Selectors.getPost(state, systemPostId);
                if (systemPost) {
                    dispatch(deletePost(systemPost));
                }
            });
        } else {
            dispatch({
                type: PostTypes.POST_DELETED,
                data: post,
            });

            try {
                await Client4.deletePost(post.id);
            } catch (error) {
                dispatch(receivedPost(post));
            }
        }

        return {data: true};
    };
}

export function editPost(post: Post) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;

        try {
            data = await Client4.patchPost(post);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            return {error};
        }

        dispatch(receivedPost(post));

        return {data};
    };
}

export function getUnreadPostData(unreadChan: ChannelUnread, state: GlobalState) {
    const member = getMyChannelMemberSelector(state, unreadChan.channel_id);
    const delta = member ? member.msg_count - unreadChan.msg_count : unreadChan.msg_count;

    const data = {
        teamId: unreadChan.team_id,
        channelId: unreadChan.channel_id,
        msgCount: unreadChan.msg_count,
        mentionCount: unreadChan.mention_count,
        lastViewedAt: unreadChan.last_viewed_at,
        deltaMsgs: delta,
    };

    return data;
}

export function setUnreadPost(userId: string, postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let state = getState();
        const post = Selectors.getPost(state, postId);
        let unreadChan;

        try {
            if (isCombinedUserActivityPost(postId)) {
                return {};
            }
            unreadChan = await Client4.markPostAsUnread(userId, postId);
            dispatch({
                type: ChannelTypes.ADD_MANUALLY_UNREAD,
                data: {
                    channelId: post.channel_id,
                },
            });
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            dispatch({
                type: ChannelTypes.REMOVE_MANUALLY_UNREAD,
                data: {
                    channelId: post.channel_id,
                },
            });
            return {error};
        }

        state = getState();
        const data = getUnreadPostData(unreadChan, state);
        dispatch({
            type: ChannelTypes.POST_UNREAD_SUCCESS,
            data,
        });
        return {data};
    };
}

export function pinPost(postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: PostTypes.EDIT_POST_REQUEST});
        let posts;

        try {
            posts = await Client4.pinPost(postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: PostTypes.EDIT_POST_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        const actions: Action[] = [
            {
                type: PostTypes.EDIT_POST_SUCCESS,
            },
        ];

        const post = Selectors.getPost(getState(), postId);
        if (post) {
            actions.push(
                receivedPost({
                    ...post,
                    is_pinned: true,
                    update_at: Date.now(),
                }),
                {
                    type: ChannelTypes.INCREMENT_PINNED_POST_COUNT,
                    id: post.channel_id,
                },
            );
        }

        dispatch(batchActions(actions));

        return {data: posts};
    };
}

export function unpinPost(postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: PostTypes.EDIT_POST_REQUEST});
        let posts;

        try {
            posts = await Client4.unpinPost(postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: PostTypes.EDIT_POST_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        const actions: Action[] = [
            {
                type: PostTypes.EDIT_POST_SUCCESS,
            },
        ];

        const post = Selectors.getPost(getState(), postId);
        if (post) {
            actions.push(
                receivedPost({
                    ...post,
                    is_pinned: false,
                    update_at: Date.now(),
                }),
                {
                    type: ChannelTypes.DECREMENT_PINNED_POST_COUNT,
                    id: post.channel_id,
                },
            );
        }

        dispatch(batchActions(actions));

        return {data: posts};
    };
}

export function addReaction(postId: string, emojiName: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const currentUserId = getState().entities.users.currentUserId;

        let reaction;
        try {
            reaction = await Client4.addReaction(currentUserId, postId, emojiName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: PostTypes.RECEIVED_REACTION,
            data: reaction,
        });

        return {data: true};
    };
}

export function removeReaction(postId: string, emojiName: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const currentUserId = getState().entities.users.currentUserId;

        try {
            await Client4.removeReaction(currentUserId, postId, emojiName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: PostTypes.REACTION_DELETED,
            data: {user_id: currentUserId, post_id: postId, emoji_name: emojiName},
        });

        return {data: true};
    };
}

export function getCustomEmojiForReaction(name: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const nonExistentEmoji = getState().entities.emojis.nonExistentEmoji;
        const customEmojisByName = selectCustomEmojisByName(getState());

        if (nonExistentEmoji.has(name)) {
            return {data: true};
        }

        if (customEmojisByName.has(name)) {
            return {data: true};
        }

        return dispatch(getCustomEmojiByName(name));
    };
}

export function getReactionsForPost(postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let reactions;
        try {
            reactions = await Client4.getReactionsForPost(postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        if (reactions && reactions.length > 0) {
            const nonExistentEmoji = getState().entities.emojis.nonExistentEmoji;
            const customEmojisByName = selectCustomEmojisByName(getState());
            const emojisToLoad = new Set<string>();

            reactions.forEach((r: Reaction) => {
                const name = r.emoji_name;

                if (nonExistentEmoji.has(name)) {
                    // We've previously confirmed this is not a custom emoji
                    return;
                }

                if (customEmojisByName.has(name)) {
                    // We have the emoji, go to the next match
                    return;
                }

                emojisToLoad.add(name);
            });

            dispatch(getCustomEmojisByName(Array.from(emojisToLoad)));
        }

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_REACTIONS,
                data: reactions,
                postId,
            },
        ]));

        return reactions;
    };
}

export function flagPost(postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {currentUserId} = getState().entities.users;
        const preference = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FLAGGED_POST,
            name: postId,
            value: 'true',
        };

        analytics.trackAction('action_posts_flag');

        return savePreferences(currentUserId, [preference])(dispatch);
    };
}

export function getPostThread(rootId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: PostTypes.GET_POST_THREAD_REQUEST});

        let posts;
        try {
            posts = await Client4.getPostThread(rootId);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: PostTypes.GET_POST_THREAD_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            receivedPosts(posts),
            receivedPostsInThread(posts, rootId),
            {
                type: PostTypes.GET_POST_THREAD_SUCCESS,
            },
        ]));

        return {data: posts};
    };
}

export function getPosts(channelId: string, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let posts;

        try {
            posts = await Client4.getPosts(channelId, page, perPage);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            receivedPosts(posts),
            receivedPostsInChannel(posts, channelId, page === 0, posts.prev_post_id === ''),
        ]));

        return {data: posts};
    };
}

export function getPostsSince(channelId: string, since: number) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let posts;
        try {
            posts = await Client4.getPostsSince(channelId, since);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            receivedPosts(posts),
            receivedPostsSince(posts, channelId),
            {
                type: PostTypes.GET_POSTS_SINCE_SUCCESS,
            },
        ]));

        return {data: posts};
    };
}

export function getPostsBefore(channelId: string, postId: string, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let posts;
        try {
            posts = await Client4.getPostsBefore(channelId, postId, page, perPage);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            receivedPosts(posts),
            receivedPostsBefore(posts, channelId, postId, posts.prev_post_id === ''),
        ]));

        return {data: posts};
    };
}

export function getPostsAfter(channelId: string, postId: string, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let posts;
        try {
            posts = await Client4.getPostsAfter(channelId, postId, page, perPage);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            receivedPosts(posts),
            receivedPostsAfter(posts, channelId, postId, posts.next_post_id === ''),
        ]));

        return {data: posts};
    };
}
export type CombinedPostList = {
    posts: Array<Post>;
    order: Array<string>;
    next_post_id: string;
    prev_post_id: string;
}

export function getPostsAround(channelId: string, postId: string, perPage = Posts.POST_CHUNK_SIZE / 2) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let after;
        let thread;
        let before;

        try {
            [after, thread, before] = await Promise.all([
                Client4.getPostsAfter(channelId, postId, 0, perPage),
                Client4.getPostThread(postId),
                Client4.getPostsBefore(channelId, postId, 0, perPage),
            ]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        // Dispatch a combined post list so that the order is correct for postsInChannel
        const posts: CombinedPostList = {
            posts: {
                ...after.posts,
                ...thread.posts,
                ...before.posts,
            },
            order: [ // Remember that the order is newest posts first
                ...after.order,
                postId,
                ...before.order,
            ],
            next_post_id: after.next_post_id,
            prev_post_id: before.prev_post_id,
        };

        getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);

        dispatch(batchActions([
            receivedPosts(posts),
            receivedPostsInChannel(posts, channelId, after.next_post_id === '', before.prev_post_id === ''),
        ]));

        return {data: posts};
    };
}

// getThreadsForPosts is intended for an array of posts that have been batched
// (see the actions/websocket_actions/handleNewPostEvents function in the webapp)
export function getThreadsForPosts(posts: Array<Post>) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        if (!Array.isArray(posts) || !posts.length) {
            return {data: true};
        }

        const state = getState();
        const promises: Promise<ActionResult>[] = [];

        posts.forEach((post) => {
            if (!post.root_id) {
                return;
            }

            const rootPost = Selectors.getPost(state, post.root_id);
            if (!rootPost) {
                promises.push(dispatch(getPostThread(post.root_id)));
            }
        });

        return Promise.all(promises);
    };
}

// Note that getProfilesAndStatusesForPosts can take either an array of posts or a map of ids to posts
export function getProfilesAndStatusesForPosts(postsArrayOrMap: Array<Post>|Map<string, Post>, dispatch: DispatchFunc, getState: GetStateFunc) {
    if (!postsArrayOrMap) {
        // Some API methods return {error} for no results
        return Promise.resolve();
    }

    const posts = Object.values(postsArrayOrMap);

    if (posts.length === 0) {
        return Promise.resolve();
    }

    const state = getState();
    const {currentUserId, profiles, statuses} = state.entities.users;

    // Statuses and profiles of the users who made the posts
    const userIdsToLoad = new Set<string>();
    const statusesToLoad = new Set<string>();

    Object.values(posts).forEach((post) => {
        const userId = post.user_id;

        if (!statuses[userId]) {
            statusesToLoad.add(userId);
        }

        if (userId === currentUserId) {
            return;
        }

        if (!profiles[userId]) {
            userIdsToLoad.add(userId);
        }
    });

    const promises: any[] = [];
    if (userIdsToLoad.size > 0) {
        promises.push(getProfilesByIds(Array.from(userIdsToLoad))(dispatch, getState));
    }

    if (statusesToLoad.size > 0) {
        promises.push(getStatusesByIds(Array.from(statusesToLoad))(dispatch, getState));
    }

    // Profiles of users mentioned in the posts
    const usernamesToLoad = getNeededAtMentionedUsernames(state, posts);

    if (usernamesToLoad.size > 0) {
        promises.push(getProfilesByUsernames(Array.from(usernamesToLoad))(dispatch, getState));
    }

    // Emojis used in the posts
    const emojisToLoad = getNeededCustomEmojis(state, posts);

    if (emojisToLoad && emojisToLoad.size > 0) {
        promises.push(getCustomEmojisByName(Array.from(emojisToLoad))(dispatch, getState));
    }

    return Promise.all(promises);
}

export function getNeededAtMentionedUsernames(state: GlobalState, posts: Array<Post>): Set<string> {
    let usersByUsername: Dictionary<UserProfile>; // Populate this lazily since it's relatively expensive

    const usernamesToLoad = new Set<string>();

    posts.forEach((post) => {
        if (!post.message.includes('@')) {
            return;
        }

        if (!usersByUsername) {
            usersByUsername = getUsersByUsername(state);
        }

        const pattern = /\B@(([a-z0-9_.-]*[a-z0-9_])[.-]*)/gi;

        let match;
        while ((match = pattern.exec(post.message)) !== null) {
            // match[1] is the matched mention including trailing punctuation
            // match[2] is the matched mention without trailing punctuation
            if (General.SPECIAL_MENTIONS.indexOf(match[2]) !== -1) {
                continue;
            }

            if (usersByUsername[match[1]] || usersByUsername[match[2]]) {
                // We have the user, go to the next match
                continue;
            }

            // If there's no trailing punctuation, this will only add 1 item to the set
            usernamesToLoad.add(match[1]);
            usernamesToLoad.add(match[2]);
        }
    });

    return usernamesToLoad;
}

function buildPostAttachmentText(attachments: Array<any>) {
    let attachmentText = '';

    attachments.forEach((a) => {
        if (a.fields && a.fields.length) {
            a.fields.forEach((f: any) => {
                attachmentText += ' ' + (f.value || '');
            });
        }

        if (a.pretext) {
            attachmentText += ' ' + a.pretext;
        }

        if (a.text) {
            attachmentText += ' ' + a.text;
        }
    });

    return attachmentText;
}

export function getNeededCustomEmojis(state: GlobalState, posts: Array<Post>): Set<string> {
    if (getConfig(state).EnableCustomEmoji !== 'true') {
        return new Set<string>();
    }

    // If post metadata is supported, custom emojis will have been provided as part of that
    if (posts[0].metadata) {
        return new Set<string>();
    }

    let customEmojisToLoad = new Set<string>();

    let customEmojisByName: Map<string, CustomEmoji>; // Populate this lazily since it's relatively expensive
    const nonExistentEmoji = state.entities.emojis.nonExistentEmoji;

    posts.forEach((post) => {
        if (post.message.includes(':')) {
            if (!customEmojisByName) {
                customEmojisByName = selectCustomEmojisByName(state);
            }

            const emojisFromPost = parseNeededCustomEmojisFromText(post.message, customEmojisByName, nonExistentEmoji);

            if (emojisFromPost.size > 0) {
                customEmojisToLoad = new Set([...customEmojisToLoad, ...emojisFromPost]);
            }
        }

        const props = post.props;
        if (props && props.attachments && props.attachments.length) {
            if (!customEmojisByName) {
                customEmojisByName = selectCustomEmojisByName(state);
            }

            const attachmentText = buildPostAttachmentText(props.attachments);

            if (attachmentText) {
                const emojisFromAttachment = parseNeededCustomEmojisFromText(attachmentText, customEmojisByName, nonExistentEmoji);

                if (emojisFromAttachment.size > 0) {
                    customEmojisToLoad = new Set([...customEmojisToLoad, ...emojisFromAttachment]);
                }
            }
        }
    });

    return customEmojisToLoad;
}
export type ExtendedPost = Post & { system_post_ids?: string[] };

export function removePost(post: ExtendedPost) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        if (post.type === Posts.POST_TYPES.COMBINED_USER_ACTIVITY && post.system_post_ids) {
            const state = getState();

            for (const systemPostId of post.system_post_ids) {
                const systemPost = Selectors.getPost(state, systemPostId);

                if (systemPost) {
                    dispatch(removePost(systemPost as any) as any);
                }
            }
        } else {
            dispatch(postRemoved(post));
            if (post.is_pinned) {
                dispatch(
                    {
                        type: ChannelTypes.DECREMENT_PINNED_POST_COUNT,
                        id: post.channel_id,
                    },
                );
            }
        }
    };
}

export function selectPost(postId: string) {
    return async (dispatch: DispatchFunc) => {
        dispatch({
            type: PostTypes.RECEIVED_POST_SELECTED,
            data: postId,
        });

        return {data: true};
    };
}

export function selectFocusedPostId(postId: string) {
    return {
        type: PostTypes.RECEIVED_FOCUSED_POST,
        data: postId,
    };
}

export function unflagPost(postId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {currentUserId} = getState().entities.users;
        const preference = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FLAGGED_POST,
            name: postId,
        };

        analytics.trackAction('action_posts_unflag');

        return deletePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export function getOpenGraphMetadata(url: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await Client4.getOpenGraphMetadata(url);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        if (data && (data.url || data.type || data.title || data.description)) {
            dispatch({
                type: PostTypes.RECEIVED_OPEN_GRAPH_METADATA,
                data,
                url,
            });
        }

        return {data};
    };
}

export function doPostAction(postId: string, actionId: string, selectedOption = '') {
    return doPostActionWithCookie(postId, actionId, '', selectedOption);
}

export function doPostActionWithCookie(postId: string, actionId: string, actionCookie: string, selectedOption = '') {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await Client4.doPostActionWithCookie(postId, actionId, actionCookie, selectedOption);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        if (data && data.trigger_id) {
            dispatch({
                type: IntegrationTypes.RECEIVED_DIALOG_TRIGGER_ID,
                data: data.trigger_id,
            });
        }

        return {data};
    };
}

export function addMessageIntoHistory(message: string) {
    return async (dispatch: DispatchFunc) => {
        dispatch({
            type: PostTypes.ADD_MESSAGE_INTO_HISTORY,
            data: message,
        });

        return {data: true};
    };
}

export function resetHistoryIndex(index: number) {
    return async (dispatch: DispatchFunc) => {
        dispatch({
            type: PostTypes.RESET_HISTORY_INDEX,
            data: index,
        });

        return {data: true};
    };
}

export function moveHistoryIndexBack(index: number) {
    return async (dispatch: DispatchFunc) => {
        dispatch({
            type: PostTypes.MOVE_HISTORY_INDEX_BACK,
            data: index,
        });

        return {data: true};
    };
}

export function moveHistoryIndexForward(index: number) {
    return async (dispatch: DispatchFunc) => {
        dispatch({
            type: PostTypes.MOVE_HISTORY_INDEX_FORWARD,
            data: index,
        });

        return {data: true};
    };
}

export function handleNewPost(msg: Omit<GenericAction, 'type'>) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const post = JSON.parse(msg.data.post);
        const myChannelMember = getMyChannelMemberSelector(state, post.channel_id);
        const websocketMessageProps = msg.data;

        if (myChannelMember && Object.keys(myChannelMember).length === 0 && (myChannelMember as any).constructor === 'Object') {
            await dispatch(getMyChannelMember(post.channel_id));
        }

        dispatch(completePostReceive(post, websocketMessageProps) as any);

        if (msg.data.channel_type === General.DM_CHANNEL) {
            const otherUserId = getUserIdFromChannelName(currentUserId, msg.data.channel_name);
            dispatch(makeDirectChannelVisibleIfNecessary(otherUserId));
        } else if (msg.data.channel_type === General.GM_CHANNEL) {
            dispatch(makeGroupMessageVisibleIfNecessary(post.channel_id));
        }

        return {data: true};
    };
}

function completePostReceive(post: Post, websocketMessageProps: any) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const rootPost = Selectors.getPost(state, post.root_id);

        if (post.root_id && !rootPost) {
            dispatch(getPostThread(post.root_id));
        }

        dispatch(lastPostActions(post, websocketMessageProps) as any);
    };
}

export function lastPostActions(post: Post, websocketMessageProps: any) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const actions = [
            receivedNewPost(post),
            {
                type: WebsocketEvents.STOP_TYPING,
                data: {
                    id: post.channel_id + post.root_id,
                    userId: post.user_id,
                    now: Date.now(),
                },
            },
        ];

        await dispatch(batchActions(actions));

        if (shouldIgnorePost(post)) {
            return;
        }

        let markAsRead = false;
        let markAsReadOnServer = false;
        if (!isManuallyUnread(getState(), post.channel_id)) {
            if (
                post.user_id === getCurrentUserId(state) &&
                !isSystemMessage(post) &&
                !isFromWebhook(post)
            ) {
                markAsRead = true;
                markAsReadOnServer = false;
            } else if (post.channel_id === getCurrentChannelId(state)) {
                markAsRead = true;
                markAsReadOnServer = true;
            }
        }

        if (markAsRead) {
            await dispatch(markChannelAsRead(post.channel_id, undefined, markAsReadOnServer));
            await dispatch(markChannelAsViewed(post.channel_id));
        } else {
            await dispatch(markChannelAsUnread(websocketMessageProps.team_id, post.channel_id, websocketMessageProps.mentions));
        }
    };
}
