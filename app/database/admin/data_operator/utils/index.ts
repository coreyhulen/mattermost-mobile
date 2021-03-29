// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Q} from '@nozbe/watermelondb';
import Model from '@nozbe/watermelondb/Model';

import {MM_TABLES} from '@constants/database';
import {
    ChainPosts,
    IdenticalRecord,
    MatchExistingRecord,
    MatchingRecords,
    RawPost,
    RawReaction,
    RawUser,
    SanitizePosts,
    SanitizeReactions,
} from '@typings/database/database';
import Reaction from '@typings/database/reaction';
import Post from '@typings/database/post';

const {POST, USER, REACTION} = MM_TABLES.SERVER;

/**
 * sanitizePosts: Creates arrays of ordered and unordered posts.  Unordered posts are those posts that are not
 * present in the orders array
 * @param {SanitizePosts} sanitizePosts
 * @param {RawPost[]} sanitizePosts.posts
 * @param {string[]} sanitizePosts.orders
 */
export const sanitizePosts = ({posts, orders}: SanitizePosts) => {
    const orderedPosts:RawPost[] = [];
    const unOrderedPosts:RawPost[] = [];

    posts.forEach((post) => {
        if (post?.id && orders.includes(post.id)) {
            orderedPosts.push(post);
        } else {
            unOrderedPosts.push(post);
        }
    });

    return {
        orderedPosts,
        unOrderedPosts,
    };
};

/**
 * createPostsChain: Basically creates the 'chain of posts' using the 'orders' array; each post is linked to the other
 * by the previous_post_id field.
 * @param {ChainPosts} chainPosts
 * @param {string[]} chainPosts.orders
 * @param {RawPost[]} chainPosts.rawPosts
 * @param {string} chainPosts.previousPostId
 * @returns {RawPost[]}
 */
export const createPostsChain = ({orders, rawPosts, previousPostId = ''}: ChainPosts) => {
    const posts: MatchExistingRecord[] = [];

    rawPosts.forEach((post) => {
        const postId = post.id;
        const orderIndex = orders.findIndex((order) => {
            return order === postId;
        });

        if (orderIndex === -1) {
            // This case will not occur as we are using 'ordered' posts for this step.  However, if this happens, that
            // implies that we might be dealing with an unordered post and in which case we do not action on it.
        } else if (orderIndex === 0) {
            posts.push({record: undefined, raw: {...post, prev_post_id: previousPostId}});
        } else {
            posts.push({record: undefined, raw: {...post, prev_post_id: orders[orderIndex - 1]}});
        }
    });

    return posts;
};

/**
 * sanitizeReactions: Treats reactions happening on a Post. For example, a user can add/remove an emoji.  Hence, this function
 * tell us which reactions to create/delete in the Reaction table and which custom-emoji to create in our database.
 * For more information, please have a look at https://community.mattermost.com/core/pl/rq9e8jnonpyrmnyxpuzyc4d6ko
 * @param {SanitizeReactions} sanitizeReactions
 * @param {Database} sanitizeReactions.database
 * @param {string} sanitizeReactions.post_id
 * @param {RawReaction[]} sanitizeReactions.rawReactions
 * @returns {Promise<{createReactions: RawReaction[], createEmojis: {name: string}[], deleteReactions: Reaction[]}>}
 */
export const sanitizeReactions = async ({database, post_id, rawReactions}: SanitizeReactions) => {
    const reactions = (await database.collections.
        get(REACTION).
        query(Q.where('post_id', post_id)).
        fetch()) as Reaction[];

    // similarObjects: Contains objects that are in both the RawReaction array and in the Reaction entity
    const similarObjects: Reaction[] = [];

    const createReactions: MatchExistingRecord[] = [];

    const emojiSet = new Set();

    for (let i = 0; i < rawReactions.length; i++) {
        const rawReaction = rawReactions[i] as RawReaction;

        // Do we have a similar value of rawReaction in the REACTION table?
        const idxPresent = reactions.findIndex((value) => {
            return (
                value.userId === rawReaction.user_id &&
                value.emojiName === rawReaction.emoji_name
            );
        });

        if (idxPresent === -1) {
            // So, we don't have a similar Reaction object.  That one is new...so we'll create it
            createReactions.push({record: undefined, raw: rawReaction});

            // If that reaction is new, that implies that the emoji might also be new
            emojiSet.add(rawReaction.emoji_name);
        } else {
            // we have a similar object in both reactions and rawReactions; we'll pop it out from both arrays
            similarObjects.push(reactions[idxPresent]);
        }
    }

    // finding out elements to delete using array subtract
    const deleteReactions = reactions.
        filter((reaction) => !similarObjects.includes(reaction)).
        map((outCast) => outCast.prepareDestroyPermanently());

    const createEmojis = Array.from(emojiSet).map((emoji) => {
        return {name: emoji};
    });

    return {createReactions, createEmojis, deleteReactions};
};

/**
 * findMatchingRecords: This event will alert the DataOperator handler of the possibility of writing duplicates in the database.
 * @param {MatchingRecords} matchingRecords
 * @param {Database} matchingRecords.database
 * @param {string} matchingRecords.tableName
 * @param {any} matchingRecords.condition
 * @returns {Promise<Model[]>}
 */
export const findMatchingRecords = async ({database, tableName, condition}: MatchingRecords) => {
    const records = (await database.collections.get(tableName).query(condition).fetch()) as Model[];
    return records;
};

/**
 * hasSimilarUpdateAt: Database Operations on some entities are expensive.  As such, we would like to operate if we are
 * 100% sure that the records are actually different from what we already have in the database.
 * @param {IdenticalRecord} identicalRecord
 * @param {string} identicalRecord.tableName
 * @param {RecordValue} identicalRecord.newValue
 * @param {Model} identicalRecord.existingRecord
 * @returns {boolean}
 */
export const hasSimilarUpdateAt = ({tableName, newValue, existingRecord}: IdenticalRecord) => {
    const guardTables = [POST];
    if (guardTables.includes(tableName)) {
        switch (tableName) {
            case POST: {
                const tempPost = newValue as unknown as RawPost;
                const currentRecord = (existingRecord as unknown) as Post;
                return tempPost.update_at === currentRecord.updateAt;
            }
            case USER: {
                const tempUser = newValue as unknown as RawUser;
                const currentRecord = (existingRecord as unknown) as Post;
                return tempUser.update_at === currentRecord.updateAt;
            }
            default: {
                return false;
            }
        }
    }
    return false;
};
