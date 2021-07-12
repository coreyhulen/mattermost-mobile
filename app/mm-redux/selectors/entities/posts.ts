// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {createSelector} from 'reselect';

import {getCurrentUser} from '@mm-redux/selectors/entities/common';
import {getMyPreferences} from '@mm-redux/selectors/entities/preferences';
import {Channel} from '@mm-redux/types/channels';
import {Post, PostWithFormatData, MessageHistory, PostOrderBlock} from '@mm-redux/types/posts';
import {Reaction} from '@mm-redux/types/reactions';
import {GlobalState} from '@mm-redux/types/store';
import {UserProfile} from '@mm-redux/types/users';
import {$ID, IDMappedObjects, RelationOneToOne, RelationOneToMany, Dictionary} from '@mm-redux/types/utilities';
import {createIdsSelector} from '@mm-redux/utils/helpers';
import {isPostEphemeral, isSystemMessage, shouldFilterJoinLeavePost, comparePosts, isPostPendingOrFailed, isPostCommentMention} from '@mm-redux/utils/post_utils';
import {getPreferenceKey} from '@mm-redux/utils/preference_utils';

import {Posts, Preferences} from '../../constants';
export function getAllPosts(state: GlobalState) {
    return state.entities.posts.posts;
}

export function getPost(state: GlobalState, postId: $ID<Post>): Post {
    return getAllPosts(state)[postId];
}

export function getPostsInThread(state: GlobalState): RelationOneToMany<Post, Post> {
    return state.entities.posts.postsInThread;
}

export function getThreadForPost(state: GlobalState, postId: string, rootId?: string): string[] | undefined {
    const id = rootId || postId;
    return state.entities.posts.postsInThread[id];
}

export function getReactionsForPosts(state: GlobalState): RelationOneToOne<Post, {
  [x: string]: Reaction;
}> {
    return state.entities.posts.reactions;
}

export function postHasReactions(state: GlobalState, postId: string): boolean {
    const reactions = getReactionsForPosts(state);
    return Boolean(reactions[postId] && Object.keys(reactions[postId]).length);
}

export function makeGetReactionsForPost(): (b: GlobalState, a: $ID<Post>) => {
  [x: string]: Reaction;
} | undefined | null {
    return createSelector(getReactionsForPosts, (state: GlobalState, postId: string) => postId, (reactions, postId) => {
        if (reactions[postId]) {
            return reactions[postId];
        }

        return null;
    });
}

export function getOpenGraphMetadata(state: GlobalState): RelationOneToOne<Post, object> {
    return state.entities.posts.openGraph;
}

export function getOpenGraphMetadataForUrl(state: GlobalState, postId: string, url: string): object {
    const openGraphForPost = state.entities.posts.openGraph[postId];
    return openGraphForPost ? openGraphForPost[url] : undefined;
}

// getPostIdsInCurrentChannel returns the IDs of posts loaded at the bottom of the channel. It does not include older
// posts such as those loaded by viewing a thread or a permalink.

export function getPostIdsInCurrentChannel(state: GlobalState): Array<$ID<Post>> | undefined | null {
    return getPostIdsInChannel(state, state.entities.channels.currentChannelId);
}

// getPostsInCurrentChannel returns the posts loaded at the bottom of the channel. It does not include older posts
// such as those loaded by viewing a thread or a permalink.

export const getPostsInCurrentChannel: (a: GlobalState) => Array<PostWithFormatData> | undefined | null = (() => {
    const getPostsInChannel = makeGetPostsInChannel();
    return (state: GlobalState) => getPostsInChannel(state, state.entities.channels.currentChannelId, -1);
})();
export function makeGetPostIdsForThread(): (b: GlobalState, a: $ID<Post>) => Array<$ID<Post>> {
    return createIdsSelector(
        getAllPosts,
        (state: GlobalState, rootId: string) => state.entities.posts.posts[rootId],
        (posts, rootPost) => {
            const thread: Post[] = [];

            if (rootPost) {
                thread.push(rootPost);

                const postsArray = Object.values(posts).filter((p) => p.root_id === rootPost.id);
                if (postsArray.length) {
                    thread.push(...postsArray);
                }

                thread.sort(comparePosts);
            }

            return thread.map((post) => post.id);
        },
    );
}

export function makeGetPostsChunkAroundPost(): (c: GlobalState, b: $ID<Post>, a: $ID<Channel>) => PostOrderBlock| null | undefined {
    return createIdsSelector(
        (state: GlobalState, postId: string, channelId: string) => state.entities.posts.postsInChannel[channelId],
        (state: GlobalState, postId) => postId,
        (postsForChannel, postId) => {
            if (!postsForChannel) {
                return null;
            }

            let postChunk;

            for (const block of postsForChannel) {
                const index = block.order.indexOf(postId);

                if (index === -1) {
                    continue;
                }

                postChunk = block;
            }

            return postChunk;
        },
    );
}

export function makeGetPostIdsAroundPost(): (d: GlobalState, c: $ID<Post>, b: $ID<Channel>, a: {
  postsBeforeCount: number;
  postsAfterCount: number;
}) => Array<$ID<Post>> | undefined | null {
    const getPostsChunkAroundPost = makeGetPostsChunkAroundPost();
    return createIdsSelector(
        (state: GlobalState, postId: string, channelId: string) => getPostsChunkAroundPost(state, postId, channelId),
        (state: GlobalState, postId) => postId,
        (state: GlobalState, postId, channelId, options) => options && options.postsBeforeCount,
        (state: GlobalState, postId, channelId, options) => options && options.postsAfterCount,
        (postsChunk, postId, postsBeforeCount = Posts.POST_CHUNK_SIZE / 2, postsAfterCount = Posts.POST_CHUNK_SIZE / 2) => {
            if (!postsChunk || !postsChunk.order) {
                return null;
            }

            const postIds = postsChunk.order;
            const index = postIds.indexOf(postId);

            // Remember that posts that come after the post have a smaller index
            const minPostIndex = postsAfterCount === -1 ? 0 : Math.max(index - postsAfterCount, 0);
            const maxPostIndex = postsBeforeCount === -1 ? postIds.length : Math.min(index + postsBeforeCount + 1, postIds.length); // Needs the extra 1 to include the focused post

            return postIds.slice(minPostIndex, maxPostIndex);
        },
    );
}

function formatPostInChannel(post: Post, previousPost: Post | undefined | null, index: number, allPosts: IDMappedObjects<Post>, postsInThread: RelationOneToMany<Post, Post>, postIds: Array<$ID<Post>>, currentUser: UserProfile, focusedPostId: $ID<Post>): PostWithFormatData {
    let isFirstReply = false;
    let isLastReply = false;
    let highlight = false;
    let commentedOnPost: Post| undefined;

    if (post.id === focusedPostId) {
        highlight = true;
    }

    if (post.root_id) {
        if (previousPost && previousPost.root_id !== post.root_id) {
            // Post is the first reply in a list of consecutive replies
            isFirstReply = true;

            if (previousPost && previousPost.id !== post.root_id) {
                commentedOnPost = allPosts[post.root_id];
            }
        }

        if (index - 1 < 0 || allPosts[postIds[index - 1]].root_id !== post.root_id) {
            // Post is the last reply in a list of consecutive replies
            isLastReply = true;
        }
    }

    let previousPostIsComment = false;

    if (previousPost && previousPost.root_id) {
        previousPostIsComment = true;
    }

    const postFromWebhook = Boolean(post.props && post.props.from_webhook);
    const prevPostFromWebhook = Boolean(previousPost && previousPost.props && previousPost.props.from_webhook);
    let consecutivePostByUser = false;
    if (previousPost &&
            previousPost.user_id === post.user_id &&
            post.create_at - previousPost.create_at <= Posts.POST_COLLAPSE_TIMEOUT &&
            !postFromWebhook && !prevPostFromWebhook &&
            !isSystemMessage(post) && !isSystemMessage(previousPost)) {
        // The last post and this post were made by the same user within some time
        consecutivePostByUser = true;
    }

    let threadRepliedToByCurrentUser = false;
    let replyCount = 0;
    let isCommentMention = false;

    if (currentUser) {
        const rootId = post.root_id || post.id;
        const threadIds = postsInThread[rootId] || [];

        for (const pid of threadIds) {
            const p = allPosts[pid];
            if (!p) {
                continue;
            }

            if (p.user_id === currentUser.id) {
                threadRepliedToByCurrentUser = true;
            }

            if (!isPostEphemeral(p)) {
                replyCount += 1;
            }
        }

        const rootPost = allPosts[rootId];

        isCommentMention = isPostCommentMention({post, currentUser, threadRepliedToByCurrentUser, rootPost});
    }

    return {
        ...post,
        isFirstReply,
        isLastReply,
        previousPostIsComment,
        commentedOnPost,
        consecutivePostByUser,
        replyCount,
        isCommentMention,
        highlight,
    };
}

// makeGetPostsInChannel creates a selector that returns up to the given number of posts loaded at the bottom of the
// given channel. It does not include older posts such as those loaded by viewing a thread or a permalink.

export function makeGetPostsInChannel(): (c: GlobalState, b: $ID<Channel>, a: number) => Array<PostWithFormatData> | undefined | null {
    return createSelector(
        getAllPosts,
        getPostsInThread,
        (state: GlobalState, channelId: $ID<Channel>) => getPostIdsInChannel(state, channelId),
        getCurrentUser,
        getMyPreferences,
        (state: GlobalState, channelId: $ID<Channel>, numPosts: number) => numPosts || Posts.POST_CHUNK_SIZE,
        (allPosts, postsInThread, allPostIds, currentUser, myPreferences, numPosts) => {
            if (!allPostIds) {
                return null;
            }

            const posts: PostWithFormatData[] = [];

            const joinLeavePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)];
            const showJoinLeave = joinLeavePref ? joinLeavePref.value !== 'false' : true;

            const postIds = numPosts === -1 ? allPostIds : allPostIds.slice(0, numPosts);

            for (let i = 0; i < postIds.length; i++) {
                const post = allPosts[postIds[i]];

                if (shouldFilterJoinLeavePost(post, showJoinLeave, currentUser ? currentUser.username : '')) {
                    continue;
                }

                const previousPost = allPosts[postIds[i + 1]] || null;
                posts.push(formatPostInChannel(post, previousPost, i, allPosts, postsInThread, postIds, currentUser, ''));
            }

            return posts;
        },
    );
}

export function makeGetPostsAroundPost(): (c: GlobalState, b: $ID<Post>, a: $ID<Channel>) => Array<PostWithFormatData> | undefined | null {
    const getPostIdsAroundPost = makeGetPostIdsAroundPost();
    const options = {
        postsBeforeCount: -1, // Where this is used in the web app, view state is used to determine how far back to display
        postsAfterCount: Posts.POST_CHUNK_SIZE / 2,
    };

    return createSelector(
        (state: GlobalState, focusedPostId: string, channelId: string) => getPostIdsAroundPost(state, focusedPostId, channelId, options),
        getAllPosts,
        getPostsInThread,
        (state: GlobalState, focusedPostId) => focusedPostId,
        getCurrentUser,
        getMyPreferences,
        (postIds, allPosts, postsInThread, focusedPostId, currentUser, myPreferences) => {
            if (!postIds || !currentUser) {
                return null;
            }

            const posts: PostWithFormatData[] = [];
            const joinLeavePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)];
            const showJoinLeave = joinLeavePref ? joinLeavePref.value !== 'false' : true;

            for (let i = 0; i < postIds.length; i++) {
                const post = allPosts[postIds[i]];

                if (shouldFilterJoinLeavePost(post, showJoinLeave, currentUser.username)) {
                    continue;
                }

                const previousPost = allPosts[postIds[i + 1]] || null;
                const formattedPost = formatPostInChannel(post, previousPost, i, allPosts, postsInThread, postIds, currentUser, focusedPostId);

                posts.push(formattedPost);
            }

            return posts;
        },
    );
}

// Returns a function that creates a creates a selector that will get the posts for a given thread.
// That selector will take a props object (containing a rootId field) as its
// only argument and will be memoized based on that argument.

export function makeGetPostsForThread(): (b: GlobalState, a: {
  rootId: $ID<Post>;
}) => Array<Post> {
    return createSelector(getAllPosts, (state: GlobalState, {
        rootId,
    }: {rootId: string}) => state.entities.posts.postsInThread[rootId] || [], (state: GlobalState, {
        rootId,
    }) => state.entities.posts.posts[rootId], (posts, postsForThread, rootPost) => {
        const thread: Post[] = [];

        if (rootPost) {
            thread.push(rootPost);
        }

        postsForThread.forEach((id) => {
            const post = posts[id];

            if (post) {
                thread.push(post);
            }
        });
        thread.sort(comparePosts);
        return thread;
    });
}

export function makeGetCommentCountForPost(): (b: GlobalState, a: Post) => number {
    return createSelector(
        getAllPosts,
        (state: GlobalState, post: Post) => state.entities.posts.postsInThread[post ? post.id : ''] || [],
        (state, post) => post,
        (posts, postsForThread, currentPost) => {
            if (!currentPost) {
                return 0;
            }

            let count = 0;
            postsForThread.forEach((id) => {
                const post = posts[id];
                if (post && post.state !== Posts.POST_DELETED && !isPostEphemeral(post)) {
                    count += 1;
                }
            });
            return count;
        },
    );
}

export const getSearchResults: (a: GlobalState) => Array<Post> = createSelector(
    getAllPosts,
    (state: GlobalState) => state.entities.search.results,
    (posts, postIds) => {
        if (!postIds) {
            return [];
        }

        return postIds.map((id) => posts[id]);
    },
);

// Returns the matched text from the search results, if the server has provided them.
// These matches will only be present if the server is running Mattermost 5.1 or higher
// with Elasticsearch enabled to search posts. Otherwise, null will be returned.

export function getSearchMatches(state: GlobalState): {
  [x: string]: Array<string>;
} {
    return state.entities.search.matches;
}

export function makeGetMessageInHistoryItem(type: 'post'|'comment'): (a: GlobalState) => string {
    return createSelector(
        (state: GlobalState) => state.entities.posts.messagesHistory,
        (messagesHistory: MessageHistory) => {
            const idx = messagesHistory.index[type];
            const messages = messagesHistory.messages;
            if (idx >= 0 && messages && messages.length > idx) {
                return messages[idx];
            }
            return '';
        },
    );
}

export function makeGetPostsForIds(): (b: GlobalState, a: Array<$ID<Post>>) => Array<Post> {
    return createIdsSelector(
        getAllPosts,
        (state: GlobalState, postIds: Array<$ID<Post>>) => postIds,
        (allPosts, postIds) => {
            if (!postIds) {
                return [];
            }

            return postIds.map((id) => allPosts[id]);
        },
    );
}

export const getLastPostPerChannel: (a: GlobalState) => RelationOneToOne<Channel, Post> = createSelector(
    getAllPosts,
    (state: GlobalState) => state.entities.posts.postsInChannel,
    (allPosts, postsInChannel) => {
        const ret: Dictionary<Post> = {};

        for (const [channelId, postsForChannel] of Object.entries(postsInChannel)) {
            const recentBlock = (postsForChannel).find((block) => block.recent);
            if (!recentBlock) {
                continue;
            }

            const postId = recentBlock.order[0];
            if (allPosts.hasOwnProperty(postId)) {
                ret[channelId] = allPosts[postId];
            }
        }

        return ret;
    },
);
export const getMostRecentPostIdInChannel: (b: GlobalState, a: $ID<Channel>) => $ID<Post> | undefined | null = createSelector(getAllPosts, (state: GlobalState, channelId: string) => getPostIdsInChannel(state, channelId), getMyPreferences, (posts, postIdsInChannel, preferences) => {
    if (!postIdsInChannel) {
        return '';
    }
    const key = getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE);
    const allowSystemMessages = preferences[key] ? preferences[key].value === 'true' : true;

    if (!allowSystemMessages) {
        // return the most recent non-system message in the channel
        let postId;
        for (let i = 0; i < postIdsInChannel.length; i++) {
            const p = posts[postIdsInChannel[i]];
            if (!p.type || !p.type.startsWith(Posts.SYSTEM_MESSAGE_PREFIX)) {
                postId = p.id;
                break;
            }
        }
        return postId;
    }

    // return the most recent message in the channel
    return postIdsInChannel[0];
},
);

export const getLatestReplyablePostId: (a: GlobalState) => $ID<Post> = createSelector(
    getPostsInCurrentChannel,
    (posts) => {
        if (!posts) {
            return '';
        }

        const latestReplyablePost = posts.find((post) => post.state !== Posts.POST_DELETED && !isSystemMessage(post) && !isPostEphemeral(post));
        if (!latestReplyablePost) {
            return '';
        }

        return latestReplyablePost.id;
    },
);

export const getCurrentUsersLatestPost: (b: GlobalState, a: $ID<Post>) => PostWithFormatData | undefined | null = createSelector(getPostsInCurrentChannel, getCurrentUser, (_: any, rootId: string) => rootId, (posts, currentUser, rootId) => {
    if (!posts) {
        return null;
    }

    const lastPost = posts.find((post) => {
    // don't edit webhook posts, deleted posts, or system messages
        if (post.user_id !== currentUser.id || post.props?.from_webhook || post.state === Posts.POST_DELETED || isSystemMessage(post) || isPostEphemeral(post) || isPostPendingOrFailed(post)) {
            return false;
        }

        if (rootId) {
            return post.root_id === rootId || post.id === rootId;
        }

        return true;
    });
    return lastPost;
});

export function getRecentPostsChunkInChannel(state: GlobalState, channelId: $ID<Channel>): PostOrderBlock|null|undefined {
    const postsForChannel = state.entities.posts.postsInChannel[channelId];

    if (!postsForChannel) {
        return null;
    }

    return postsForChannel.find((block) => block.recent);
}

export function getOldestPostsChunkInChannel(state: GlobalState, channelId: $ID<Channel>): PostOrderBlock|null|undefined {
    const postsForChannel = state.entities.posts.postsInChannel[channelId];

    if (!postsForChannel) {
        return null;
    }

    return postsForChannel.find((block) => block.oldest);
}

// getPostIdsInChannel returns the IDs of posts loaded at the bottom of the given channel. It does not include older
// posts such as those loaded by viewing a thread or a permalink.

export function getPostIdsInChannel(state: GlobalState, channelId: $ID<Channel>): Array<$ID<Post>> | undefined | null {
    const recentBlock = getRecentPostsChunkInChannel(state, channelId);

    if (!recentBlock) {
        return null;
    }

    return recentBlock.order;
}

export function getPostsChunkInChannelAroundTime(state: GlobalState, channelId: $ID<Channel>, timeStamp: number): object | undefined | null {
    const postsEntity = state.entities.posts;
    const postsForChannel = postsEntity.postsInChannel[channelId];
    const posts = postsEntity.posts;
    if (!postsForChannel) {
        return null;
    }

    const blockAroundTimestamp = postsForChannel.find((block) => {
        const {order} = block;
        const recentPostInBlock = posts[order[0]];
        const oldestPostInBlock = posts[order[order.length - 1]];
        if (recentPostInBlock && oldestPostInBlock) {
            return (recentPostInBlock.create_at >= timeStamp && oldestPostInBlock.create_at <= timeStamp);
        }
        return false;
    });

    return blockAroundTimestamp;
}

export function getUnreadPostsChunk(state: GlobalState, channelId: $ID<Channel>, timeStamp: number): object | undefined | null {
    const postsEntity = state.entities.posts;
    const posts = postsEntity.posts;
    const recentChunk = getRecentPostsChunkInChannel(state, channelId);

    /* 1. lastViewedAt can be greater than the most recent chunk in case of edited posts etc.
          * return if recent block exists and oldest post is created after the last lastViewedAt timestamp
          i.e all posts are read and the lastViewedAt is greater than the last post

       2. lastViewedAt can be less than the first post in a channel if all the last viewed posts are deleted
          * return if oldest block exist and oldest post created_at is greater than the last viewed post
          i.e all posts are unread so the lastViewedAt is lessthan the first post

      The above two exceptions are added because we cannot select the chunk based on timestamp alone as these cases are out of bounds

      3. Normal cases where there are few unreads and few reads in a chunk as that is how unread API returns data
          * return getPostsChunkInChannelAroundTime
    */

    if (recentChunk) {
        // This would happen if there are no posts in channel.
        // If the system messages are deleted by sys admin.
        // Experimental changes like hiding Join/Leave still will have recent chunk so it follows the default path based on timestamp

        if (!recentChunk.order.length) {
            return recentChunk;
        }

        const {order} = recentChunk;
        const oldestPostInBlock = posts[order[order.length - 1]];

        // check for only oldest posts because this can be higher than the latest post if the last post is edited
        if (oldestPostInBlock.create_at <= timeStamp) {
            return recentChunk;
        }
    }

    const oldestPostsChunk = getOldestPostsChunkInChannel(state, channelId);

    if (oldestPostsChunk && oldestPostsChunk.order.length) {
        const {order} = oldestPostsChunk;
        const oldestPostInBlock = posts[order[order.length - 1]];

        if (oldestPostInBlock.create_at >= timeStamp) {
            return oldestPostsChunk;
        }
    }

    return getPostsChunkInChannelAroundTime(state, channelId, timeStamp);
}

export const isPostIdSending = (state: GlobalState, postId: $ID<Post>): boolean =>
    state.entities.posts.pendingPostIds.some((sendingPostId) => sendingPostId === postId);

export const isRootPost = (state: GlobalState, postId: $ID<Post>): boolean => {
    return Boolean(getThreadForPost(state, postId)?.length);
};

export const makeIsPostCommentMention = (): ((b: GlobalState, postId: $ID<Post>, rootId?: $ID<Post>) => boolean) => {
    return createSelector(
        getAllPosts,
        getThreadForPost,
        getCurrentUser,
        getPost,
        (allPosts, postsForThread, currentUser, post) => {
            if (!post) {
                return false;
            }

            let threadRepliedToByCurrentUser = false;
            let isCommentMention = false;
            if (currentUser && postsForThread?.length) {
                for (const pid of postsForThread) {
                    const p = allPosts[pid];
                    if (!p) {
                        continue;
                    }

                    if (p.user_id === currentUser.id) {
                        threadRepliedToByCurrentUser = true;
                    }
                }

                const rootId = post.root_id || post.id;
                const rootPost = allPosts[rootId];

                isCommentMention = isPostCommentMention({post, currentUser, threadRepliedToByCurrentUser, rootPost});
            }

            return isCommentMention;
        },
    );
};

export function getExpandedLink(state: GlobalState, link: string): string {
    return state.entities.posts.expandedURLs[link];
}
