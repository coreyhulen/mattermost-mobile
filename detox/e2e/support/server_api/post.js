// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import client from './client';
import {getResponseFromError} from './common';

// ****************************************************************
// Posts
// See https://api.mattermost.com/#tag/posts
//
// Exported API function should have the following:
// - documented using JSDoc
// - meaningful description
// - match the referenced API endpoints
// - parameter/s defined by `@param`
// - return value defined by `@return`
// ****************************************************************

/**
 * Create a new post in a channel. To create the post as a comment on another post, provide root_id.
 * See https://api.mattermost.com/#operation/CreatePost
 * @param {string} option.channelId - The channel ID to post in
 * @param {string} option.message - The message contents, can be formatted with Markdown
 * @param {string} option.rootId - The post ID to comment on
 * @param {Object} option.props - A general object property bag to attach to the post
 * @param {Date} option.createAt - The date the post is created at
 * @return {Object} returns {post} on success or {error, status} on error
 */
export const apiCreatePost = async ({channelId, message, rootId, props = {}, createAt = 0}) => {
    try {
        const payload = {
            channel_id: channelId,
            message,
            root_id: rootId,
            props,
            create_at: createAt,
        };
        const response = await client.post('/api/v4/posts', payload);

        return {post: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Get posts for a channel.
 * See https://api.mattermost.com/#operation/GetPostsForChannel
 * @param {string} channelId - The channel ID to get the posts for
 * @return {Object} returns {posts} on success or {error, status} on error
 */
export const apiGetPostsInChannel = async (channelId) => {
    try {
        const response = await client.get(`/api/v4/channels/${channelId}/posts`);

        const {order, posts} = response.data;

        const orderedPosts = order.map((postId) => posts[postId]);

        return {posts: orderedPosts};
    } catch (err) {
        return getResponseFromError(err);
    }
};

/**
 * Get last post in a channel.
 * @param {string} channelId - The channel ID to get the last post
 * @return {Object} returns {post} on success or {error, status} on error
 */
export const apiGetLastPostInChannel = async (channelId) => {
    const {posts} = await apiGetPostsInChannel(channelId);
    return {post: posts[0]};
};

/**
 * Patch a post.
 * See https://api.mattermost.com/#operation/PatchPost
 * @param {string} postId - the post ID
 * @param {Object} postData - data to partially update a post
 * @return {Object} returns {post} on success or {error, status} on error
 */
export const apiPatchPost = async (postId, postData) => {
    try {
        const response = await client.put(
            `/api/v4/posts/${postId}/patch`,
            postData,
        );

        return {post: response.data};
    } catch (err) {
        return getResponseFromError(err);
    }
};

export const Post = {
    apiCreatePost,
    apiGetLastPostInChannel,
    apiGetPostsInChannel,
    apiPatchPost,
};

export default Post;
