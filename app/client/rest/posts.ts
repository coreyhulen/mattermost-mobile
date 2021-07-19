// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {analytics} from '@init/analytics';
import {FileInfo} from '@mm-redux/types/files';
import {Post} from '@mm-redux/types/posts';
import {buildQueryString} from '@mm-redux/utils/helpers';

import {PER_PAGE_DEFAULT} from './constants';

export interface ClientPostsMix {
    createPost: (post: Post) => Promise<Post>;
    updatePost: (post: Post) => Promise<Post>;
    getPost: (postId: string) => Promise<Post>;
    patchPost: (postPatch: Partial<Post> & {id: string}) => Promise<Post>;
    deletePost: (postId: string) => Promise<any>;
    getPostThread: (postId: string, fetchThreads?: boolean, collapsedThreads?: boolean, collapsedThreadsExtended?: boolean) => Promise<any>;
    getPosts: (channelId: string, page?: number, perPage?: number, fetchThreads?: boolean, collapsedThreads?: boolean, collapsedThreadsExtended?: boolean) => Promise<any>;
    getPostsSince: (channelId: string, since: number, fetchThreads?: boolean, collapsedThreads?: boolean, collapsedThreadsExtended?: boolean) => Promise<any>;
    getPostsBefore: (channelId: string, postId: string, page?: number, perPage?: number, fetchThreads?: boolean, collapsedThreads?: boolean, collapsedThreadsExtended?: boolean) => Promise<any>;
    getPostsAfter: (channelId: string, postId: string, page?: number, perPage?: number, fetchThreads?: boolean, collapsedThreads?: boolean, collapsedThreadsExtended?: boolean) => Promise<any>;
    getUserThreads: (userId: string, teamId: string, before?: string, after?: string, pageSize?: number, extended?: boolean, deleted?: boolean, unread?: boolean, since?: number) => Promise<any>;
    getUserThread: (userId: string, teamId: string, threadId: string, extended?: boolean) => Promise<any>;
    updateThreadsReadForUser: (userId: string, teamId: string) => Promise<any>;
    updateThreadReadForUser: (userId: string, teamId: string, threadId: string, timestamp: number) => Promise<any>;
    updateThreadFollowForUser: (userId: string, teamId: string, threadId: string, state: boolean) => Promise<any>;
    getFileInfosForPost: (postId: string) => Promise<FileInfo[]>;
    getFlaggedPosts: (userId: string, channelId?: string, teamId?: string, page?: number, perPage?: number) => Promise<any>;
    getPinnedPosts: (channelId: string) => Promise<any>;
    markPostAsUnread: (userId: string, postId: string) => Promise<any>;
    pinPost: (postId: string) => Promise<any>;
    unpinPost: (postId: string) => Promise<any>;
    addReaction: (userId: string, postId: string, emojiName: string) => Promise<any>;
    removeReaction: (userId: string, postId: string, emojiName: string) => Promise<any>;
    getReactionsForPost: (postId: string) => Promise<any>;
    searchPostsWithParams: (teamId: string, params: any) => Promise<any>;
    searchPosts: (teamId: string, terms: string, isOrSearch: boolean) => Promise<any>;
    doPostAction: (postId: string, actionId: string, selectedOption?: string) => Promise<any>;
    doPostActionWithCookie: (postId: string, actionId: string, actionCookie: string, selectedOption?: string) => Promise<any>;
}

const ClientPosts = (superclass: any) => class extends superclass {
    createPost = async (post: Post) => {
        analytics.trackAPI('api_posts_create', {channel_id: post.channel_id});

        if (post.root_id != null && post.root_id !== '') {
            analytics.trackAPI('api_posts_replied', {channel_id: post.channel_id});
        }

        return this.doFetch(
            `${this.getPostsRoute()}`,
            {method: 'post', body: JSON.stringify(post)},
        );
    };

    updatePost = async (post: Post) => {
        analytics.trackAPI('api_posts_update', {channel_id: post.channel_id});

        return this.doFetch(
            `${this.getPostRoute(post.id)}`,
            {method: 'put', body: JSON.stringify(post)},
        );
    };

    getPost = async (postId: string) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}`,
            {method: 'get'},
        );
    };

    patchPost = async (postPatch: Partial<Post> & {id: string}) => {
        analytics.trackAPI('api_posts_patch', {channel_id: postPatch.channel_id});

        return this.doFetch(
            `${this.getPostRoute(postPatch.id)}/patch`,
            {method: 'put', body: JSON.stringify(postPatch)},
        );
    };

    deletePost = async (postId: string) => {
        analytics.trackAPI('api_posts_delete');

        return this.doFetch(
            `${this.getPostRoute(postId)}`,
            {method: 'delete'},
        );
    };

    getPostThread = async (postId: string, fetchThreads = true, collapsedThreads = false, collapsedThreadsExtended = false) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/thread${buildQueryString({skipFetchThreads: !fetchThreads, collapsedThreads, collapsedThreadsExtended})}`,
            {method: 'get'},
        );
    };

    getPosts = async (channelId: string, page = 0, perPage = PER_PAGE_DEFAULT, fetchThreads = true, collapsedThreads = false, collapsedThreadsExtended = false) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({page, per_page: perPage, skipFetchThreads: !fetchThreads, collapsedThreads, collapsedThreadsExtended})}`,
            {method: 'get'},
        );
    };

    getPostsSince = async (channelId: string, since: number, fetchThreads = true, collapsedThreads = false, collapsedThreadsExtended = false) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({since, skipFetchThreads: !fetchThreads, collapsedThreads, collapsedThreadsExtended})}`,
            {method: 'get'},
        );
    };

    getPostsBefore = async (channelId: string, postId: string, page = 0, perPage = PER_PAGE_DEFAULT, fetchThreads = true, collapsedThreads = false, collapsedThreadsExtended = false) => {
        analytics.trackAPI('api_posts_get_before', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({before: postId, page, per_page: perPage, skipFetchThreads: !fetchThreads, collapsedThreads, collapsedThreadsExtended})}`,
            {method: 'get'},
        );
    };

    getPostsAfter = async (channelId: string, postId: string, page = 0, perPage = PER_PAGE_DEFAULT, fetchThreads = true, collapsedThreads = false, collapsedThreadsExtended = false) => {
        analytics.trackAPI('api_posts_get_after', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({after: postId, page, per_page: perPage, skipFetchThreads: !fetchThreads, collapsedThreads, collapsedThreadsExtended})}`,
            {method: 'get'},
        );
    };

    getUserThreads = async (userId: string, teamId: string, before = '', after = '', pageSize = PER_PAGE_DEFAULT, extended = false, deleted = false, unread = false, since = 0) => {
        return this.doFetch(
            `${this.getUserThreadsRoute(userId, teamId)}${buildQueryString({before, after, pageSize, extended, deleted, unread, since})}`,
            {method: 'get'},
        );
    };

    getUserThread = async (userId: string, teamId: string, threadId: string, extended = false) => {
        return this.doFetch(
            `${this.getUserThreadRoute(userId, teamId, threadId)}${buildQueryString({extended})}`,
            {method: 'get'},
        );
    };

    updateThreadsReadForUser = (userId: string, teamId: string) => {
        const url = `${this.getUserThreadsRoute(userId, teamId)}/read`;
        return this.doFetch(
            url,
            {method: 'put'},
        );
    };

    updateThreadReadForUser = (userId: string, teamId: string, threadId: string, timestamp: number) => {
        const url = `${this.getUserThreadRoute(userId, teamId, threadId)}/read/${timestamp}`;
        return this.doFetch(
            url,
            {method: 'put'},
        );
    };

    updateThreadFollowForUser = (userId: string, teamId: string, threadId: string, state: boolean) => {
        const url = this.getUserThreadRoute(userId, teamId, threadId) + '/following';
        return this.doFetch(
            url,
            {method: state ? 'put' : 'delete'},
        );
    };

    getFileInfosForPost = async (postId: string) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/files/info`,
            {method: 'get'},
        );
    };

    getFlaggedPosts = async (userId: string, channelId = '', teamId = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        analytics.trackAPI('api_posts_get_flagged', {team_id: teamId});

        return this.doFetch(
            `${this.getUserRoute(userId)}/posts/flagged${buildQueryString({channel_id: channelId, team_id: teamId, page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getPinnedPosts = async (channelId: string) => {
        analytics.trackAPI('api_posts_get_pinned', {channel_id: channelId});
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/pinned`,
            {method: 'get'},
        );
    };

    markPostAsUnread = async (userId: string, postId: string) => {
        analytics.trackAPI('api_post_set_unread_post');

        return this.doFetch(
            `${this.getUserRoute(userId)}/posts/${postId}/set_unread`,
            {method: 'post', body: JSON.stringify({collapsed_threads_supported: true})},
        );
    }

    pinPost = async (postId: string) => {
        analytics.trackAPI('api_posts_pin');

        return this.doFetch(
            `${this.getPostRoute(postId)}/pin`,
            {method: 'post'},
        );
    };

    unpinPost = async (postId: string) => {
        analytics.trackAPI('api_posts_unpin');

        return this.doFetch(
            `${this.getPostRoute(postId)}/unpin`,
            {method: 'post'},
        );
    };

    addReaction = async (userId: string, postId: string, emojiName: string) => {
        analytics.trackAPI('api_reactions_save', {post_id: postId});

        return this.doFetch(
            `${this.getReactionsRoute()}`,
            {method: 'post', body: JSON.stringify({user_id: userId, post_id: postId, emoji_name: emojiName})},
        );
    };

    removeReaction = async (userId: string, postId: string, emojiName: string) => {
        analytics.trackAPI('api_reactions_delete', {post_id: postId});

        return this.doFetch(
            `${this.getUserRoute(userId)}/posts/${postId}/reactions/${emojiName}`,
            {method: 'delete'},
        );
    };

    getReactionsForPost = async (postId: string) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/reactions`,
            {method: 'get'},
        );
    };

    searchPostsWithParams = async (teamId: string, params: any) => {
        analytics.trackAPI('api_posts_search', {team_id: teamId});

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/posts/search`,
            {method: 'post', body: JSON.stringify(params)},
        );
    };

    searchPosts = async (teamId: string, terms: string, isOrSearch: boolean) => {
        return this.searchPostsWithParams(teamId, {terms, is_or_search: isOrSearch});
    };

    doPostAction = async (postId: string, actionId: string, selectedOption = '') => {
        return this.doPostActionWithCookie(postId, actionId, '', selectedOption);
    };

    doPostActionWithCookie = async (postId: string, actionId: string, actionCookie: string, selectedOption = '') => {
        if (selectedOption) {
            analytics.trackAPI('api_interactive_messages_menu_selected');
        } else {
            analytics.trackAPI('api_interactive_messages_button_clicked');
        }

        const msg: any = {
            selected_option: selectedOption,
        };
        if (actionCookie !== '') {
            msg.cookie = actionCookie;
        }
        return this.doFetch(
            `${this.getPostRoute(postId)}/actions/${encodeURIComponent(actionId)}`,
            {method: 'post', body: JSON.stringify(msg)},
        );
    };
};

export default ClientPosts;
