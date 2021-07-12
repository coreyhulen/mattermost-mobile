// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import * as Selectors from '@mm-redux/selectors/entities/posts';
import {makeGetProfilesForReactions} from '@mm-redux/selectors/entities/users';
import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import TestHelper from '@test/test_helper';

import {Posts, Preferences} from '../../constants';

describe('Selectors.Posts', () => {
    const user1 = TestHelper.fakeUserWithId();
    user1.notify_props = {};
    const profiles = {};
    profiles[user1.id] = user1;

    const posts = {
        a: {id: 'a', channel_id: '1', create_at: 1, highlight: false, user_id: user1.id},
        b: {id: 'b', channel_id: '1', create_at: 2, highlight: false, user_id: user1.id},
        c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, highlight: false, user_id: 'b'},
        d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, highlight: false, user_id: 'b'},
        e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, highlight: false, user_id: 'b'},
        f: {id: 'f', channel_id: '2', create_at: 6, highlight: false, user_id: 'b'},
    };

    const reaction1 = {user_id: user1.id, emoji_name: '+1'};
    const reactionA = {[reaction1.user_id + '-' + reaction1.emoji_name]: reaction1};
    const reactions = {
        a: reactionA,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user1.id,
                profiles,
            },
            posts: {
                posts,
                postsInChannel: {
                    1: [
                        {order: ['e', 'd', 'c', 'b', 'a'], recent: true},
                    ],
                    2: [
                        {order: ['f'], recent: true},
                    ],
                },
                postsInThread: {
                    a: ['c', 'e'],
                    b: ['d'],
                },
                reactions,
            },
            preferences: {
                myPreferences: {},
            },
        },
    });

    it('should return the most recent post for each channel', () => {
        const lastPosts = Selectors.getLastPostPerChannel(testState);

        assert.deepEqual(lastPosts, {1: posts.e, 2: posts.f});
    });

    it('should return single post with no children', () => {
        const getPostsForThread = Selectors.makeGetPostsForThread();

        assert.deepEqual(getPostsForThread(testState, {channelId: '2', rootId: 'f'}), [posts.f]);
    });

    it('should return post with children', () => {
        const getPostsForThread = Selectors.makeGetPostsForThread();

        assert.deepEqual(getPostsForThread(testState, {channelId: '1', rootId: 'a'}), [posts.e, posts.c, posts.a]);
    });

    it('should return memoized result for identical props', () => {
        const getPostsForThread = Selectors.makeGetPostsForThread();

        const props = {channelId: '1', rootId: 'a'};
        const result = getPostsForThread(testState, props);

        assert.equal(result, getPostsForThread(testState, props));
    });

    it('should return memoized result for multiple selectors with different props', () => {
        const getPostsForThread1 = Selectors.makeGetPostsForThread();
        const getPostsForThread2 = Selectors.makeGetPostsForThread();

        const props1 = {channelId: '1', rootId: 'a'};
        const result1 = getPostsForThread1(testState, props1);

        const props2 = {channelId: '1', rootId: 'b'};
        const result2 = getPostsForThread2(testState, props2);

        assert.equal(result1, getPostsForThread1(testState, props1));
        assert.equal(result2, getPostsForThread2(testState, props2));
    });

    it('should return reactions for post', () => {
        const getReactionsForPost = Selectors.makeGetReactionsForPost();
        assert.deepEqual(getReactionsForPost(testState, posts.a.id), reactionA);
    });

    it('should return profiles for reactions', () => {
        const getProfilesForReactions = makeGetProfilesForReactions();
        assert.deepEqual(getProfilesForReactions(testState, [reaction1]), [user1]);
    });

    it('get posts in channel', () => {
        const post1 = {
            ...posts.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post2 = {
            ...posts.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false,
        };

        const post3 = {
            ...posts.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: posts.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post4 = {
            ...posts.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.b,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false,
        };

        const post5 = {
            ...posts.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false,
        };

        const getPostsInChannel = Selectors.makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testState, '1', 30), [post5, post4, post3, post2, post1]);
    });

    it('get posts around post in channel', () => {
        const post1 = {
            ...posts.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post2 = {
            ...posts.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false,
        };

        const post3 = {
            ...posts.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: posts.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
            highlight: true,
        };

        const post4 = {
            ...posts.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.b,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false,
        };

        const post5 = {
            ...posts.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false,
        };

        const getPostsAroundPost = Selectors.makeGetPostsAroundPost();
        assert.deepEqual(getPostsAroundPost(testState, post3.id, '1'), [post5, post4, post3, post2, post1]);
    });

    it('get posts in channel with notify comments as any', () => {
        const userAny = TestHelper.fakeUserWithId();
        userAny.notify_props = {comments: 'any'};
        const profilesAny = {};
        profilesAny[userAny.id] = userAny;

        const postsAny = {
            a: {id: 'a', channel_id: '1', create_at: 1, highlight: false, user_id: userAny.id},
            b: {id: 'b', channel_id: '1', create_at: 2, highlight: false, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, highlight: false, user_id: 'b'},
            d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, highlight: false, user_id: userAny.id},
            e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, highlight: false, user_id: 'b'},
            f: {id: 'f', root_id: 'b', channel_id: '1', create_at: 6, highlight: false, user_id: 'b'},
            g: {id: 'g', channel_id: '2', create_at: 7, highlight: false, user_id: 'b'},
        };

        const testStateAny = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userAny.id,
                    profiles: profilesAny,
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        1: [
                            {order: ['f', 'e', 'd', 'c', 'b', 'a'], recent: true},
                        ],
                        2: [
                            {order: ['g'], recent: true},
                        ],
                    },
                    postsInThread: {
                        a: ['c', 'e'],
                        b: ['d', 'f'],
                    },
                },
                preferences: {
                    myPreferences: {},
                },
            },
        });

        const post1 = {
            ...postsAny.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post2 = {
            ...postsAny.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: true,
        };

        const post3 = {
            ...postsAny.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: postsAny.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: true,
        };

        const post4 = {
            ...postsAny.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsAny.b,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post5 = {
            ...postsAny.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsAny.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: true,
        };

        const post6 = {
            ...postsAny.f,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsAny.b,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: true,
        };

        const getPostsInChannel = Selectors.makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateAny, '1'), [post6, post5, post4, post3, post2, post1]);
    });

    it('get posts in channel with notify comments as root', () => {
        const userRoot = TestHelper.fakeUserWithId();
        userRoot.notify_props = {comments: 'root'};
        const profilesRoot = {};
        profilesRoot[userRoot.id] = userRoot;

        const postsRoot = {
            a: {id: 'a', channel_id: '1', create_at: 1, highlight: false, user_id: userRoot.id},
            b: {id: 'b', channel_id: '1', create_at: 2, highlight: false, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, highlight: false, user_id: 'b'},
            d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, highlight: false, user_id: userRoot.id},
            e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, highlight: false, user_id: 'b'},
            f: {id: 'f', root_id: 'b', channel_id: '1', create_at: 6, highlight: false, user_id: 'b'},
            g: {id: 'g', channel_id: '2', create_at: 7, highlight: false, user_id: 'b'},
        };

        const testStateRoot = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userRoot.id,
                    profiles: profilesRoot,
                },
                posts: {
                    posts: postsRoot,
                    postsInChannel: {
                        1: [
                            {order: ['f', 'e', 'd', 'c', 'b', 'a'], recent: true},
                        ],
                        2: [
                            {order: ['g'], recent: true},
                        ],
                    },
                    postsInThread: {
                        a: ['c', 'e'],
                        b: ['d', 'f'],
                    },
                },
                preferences: {
                    myPreferences: {},
                },
            },
        });

        const post1 = {
            ...postsRoot.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post2 = {
            ...postsRoot.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post3 = {
            ...postsRoot.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: postsRoot.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: true,
        };

        const post4 = {
            ...postsRoot.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsRoot.b,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post5 = {
            ...postsRoot.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsRoot.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: true,
        };

        const post6 = {
            ...postsRoot.f,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsRoot.b,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false,
        };

        const getPostsInChannel = Selectors.makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateRoot, '1'), [post6, post5, post4, post3, post2, post1]);
    });

    it('get posts in channel with notify comments as never', () => {
        const userNever = TestHelper.fakeUserWithId();
        userNever.notify_props = {comments: 'never'};
        const profilesNever = {};
        profilesNever[userNever.id] = userNever;

        const postsNever = {
            a: {id: 'a', channel_id: '1', create_at: 1, highlight: false, user_id: userNever.id},
            b: {id: 'b', channel_id: '1', create_at: 2, highlight: false, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, highlight: false, user_id: 'b'},
            d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, highlight: false, user_id: userNever.id},
            e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, highlight: false, user_id: 'b'},
            f: {id: 'f', root_id: 'b', channel_id: '1', create_at: 6, highlight: false, user_id: 'b'},
            g: {id: 'g', channel_id: '2', create_at: 7, highlight: false, user_id: 'b'},
        };

        const testStateNever = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userNever.id,
                    profiles: profilesNever,
                },
                posts: {
                    posts: postsNever,
                    postsInChannel: {
                        1: [
                            {order: ['f', 'e', 'd', 'c', 'b', 'a'], recent: true},
                        ],
                        2: [
                            {order: ['g'], recent: true},
                        ],
                    },
                    postsInThread: {
                        a: ['c', 'e'],
                        b: ['d', 'f'],
                    },
                },
                preferences: {
                    myPreferences: {},
                },
            },
        });

        const post1 = {
            ...postsNever.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post2 = {
            ...postsNever.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post3 = {
            ...postsNever.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: postsNever.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false,
        };

        const post4 = {
            ...postsNever.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsNever.b,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post5 = {
            ...postsNever.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsNever.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
        };

        const post6 = {
            ...postsNever.f,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsNever.b,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false,
        };

        const getPostsInChannel = Selectors.makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateNever, '1'), [post6, post5, post4, post3, post2, post1]);
    });

    it('gets posts around post in channel not adding ephemeral post to replyCount', () => {
        const userAny = TestHelper.fakeUserWithId();
        userAny.notify_props = {comments: 'any'};
        const profilesAny = {};
        profilesAny[userAny.id] = userAny;

        const postsAny = {
            a: {id: 'a', channel_id: '1', create_at: 1, highlight: false, user_id: userAny.id},
            b: {id: 'b', root_id: 'a', channel_id: '1', create_at: 2, highlight: false, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, highlight: false, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
            d: {id: 'd', channel_id: '2', create_at: 4, highlight: false, user_id: 'b'},
        };

        const testStateAny = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userAny.id,
                    profiles: profilesAny,
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        1: [
                            {order: ['c', 'b', 'a'], recent: true},
                        ],
                        2: [
                            {order: ['d'], recent: true},
                        ],
                    },
                    postsInThread: {
                        a: ['b', 'c'],
                    },
                },
                preferences: {
                    myPreferences: {},
                },
            },
        });

        const post1 = {
            ...postsAny.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 1,
            isCommentMention: false,
            highlight: true,
        };

        const post2 = {
            ...postsAny.b,
            isFirstReply: true,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 1,
            isCommentMention: true,
        };

        const post3 = {
            ...postsAny.c,
            isFirstReply: false,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 1,
            isCommentMention: true,
        };

        const getPostsAroundPost = Selectors.makeGetPostsAroundPost();
        assert.deepEqual(getPostsAroundPost(testStateAny, post1.id, '1'), [post3, post2, post1]);
    });

    it('gets posts in channel not adding ephemeral post to replyCount', () => {
        const userAny = TestHelper.fakeUserWithId();
        userAny.notify_props = {comments: 'any'};
        const profilesAny = {};
        profilesAny[userAny.id] = userAny;

        const postsAny = {
            a: {id: 'a', channel_id: '1', create_at: 1, highlight: false, user_id: userAny.id},
            b: {id: 'b', root_id: 'a', channel_id: '1', create_at: 2, highlight: false, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, highlight: false, user_id: 'b', state: Posts.POST_DELETED},
            d: {id: 'd', channel_id: '2', create_at: 4, highlight: false, user_id: 'b'},
        };

        const testStateAny = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userAny.id,
                    profiles: profilesAny,
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        1: [
                            {order: ['c', 'b', 'a'], recent: true},
                        ],
                        2: [
                            {order: ['d'], recent: true},
                        ],
                    },
                    postsInThread: {
                        a: ['b', 'c'],
                    },
                },
                preferences: {
                    myPreferences: {},
                },
            },
        });

        const post1 = {
            ...postsAny.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 0,
            isCommentMention: false,
        };

        const post2 = {
            ...postsAny.b,
            isFirstReply: true,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 0,
            isCommentMention: true,
        };

        const post3 = {
            ...postsAny.c,
            isFirstReply: false,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 0,
            isCommentMention: true,
        };

        const getPostsInChannel = Selectors.makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateAny, '1'), [post3, post2, post1]);
    });

    it('get current history item', () => {
        const testState1 = deepFreezeAndThrowOnMutation({
            entities: {
                posts: {
                    messagesHistory: {
                        messages: ['test1', 'test2', 'test3'],
                        index: {
                            post: 1,
                            comment: 2,
                        },
                    },
                },
            },
        });

        const testState2 = deepFreezeAndThrowOnMutation({
            entities: {
                posts: {
                    messagesHistory: {
                        messages: ['test1', 'test2', 'test3'],
                        index: {
                            post: 0,
                            comment: 0,
                        },
                    },
                },
            },
        });

        const testState3 = deepFreezeAndThrowOnMutation({
            entities: {
                posts: {
                    messagesHistory: {
                        messages: [],
                        index: {
                            post: -1,
                            comment: -1,
                        },
                    },
                },
            },
        });

        const getHistoryMessagePost = Selectors.makeGetMessageInHistoryItem(Posts.MESSAGE_TYPES.POST);
        const getHistoryMessageComment = Selectors.makeGetMessageInHistoryItem(Posts.MESSAGE_TYPES.COMMENT);
        assert.equal(getHistoryMessagePost(testState1), 'test2');
        assert.equal(getHistoryMessageComment(testState1), 'test3');
        assert.equal(getHistoryMessagePost(testState2), 'test1');
        assert.equal(getHistoryMessageComment(testState2), 'test1');
        assert.equal(getHistoryMessagePost(testState3), '');
        assert.equal(getHistoryMessageComment(testState3), '');
    });

    describe('getPostIdsForThread', () => {
        it('single post', () => {
            const getPostIdsForThread = Selectors.makeGetPostIdsForThread();

            const state = {
                entities: {
                    posts: {
                        posts: {
                            1001: {id: '1001', create_at: 1001},
                            1002: {id: '1002', create_at: 1002, root_id: '1001'},
                            1003: {id: '1003', create_at: 1003},
                            1004: {id: '1004', create_at: 1004, root_id: '1001'},
                            1005: {id: '1005', create_at: 1005},
                        },
                        postsInThread: {
                            1001: ['1002', '1004'],
                        },
                    },
                },
            };
            const expected = ['1005'];

            assert.deepEqual(getPostIdsForThread(state, '1005'), expected);
        });

        it('thread', () => {
            const getPostIdsForThread = Selectors.makeGetPostIdsForThread();

            const state = {
                entities: {
                    posts: {
                        posts: {
                            1001: {id: '1001', create_at: 1001},
                            1002: {id: '1002', create_at: 1002, root_id: '1001'},
                            1003: {id: '1003', create_at: 1003},
                            1004: {id: '1004', create_at: 1004, root_id: '1001'},
                            1005: {id: '1005', create_at: 1005},
                        },
                        postsInThread: {
                            1001: ['1002', '1004'],
                        },
                    },
                },
            };
            const expected = ['1004', '1002', '1001'];

            assert.deepEqual(getPostIdsForThread(state, '1001'), expected);
        });

        it('memoization', () => {
            const getPostIdsForThread = Selectors.makeGetPostIdsForThread();

            let state = {
                entities: {
                    posts: {
                        posts: {
                            1001: {id: '1001', create_at: 1001},
                            1002: {id: '1002', create_at: 1002, root_id: '1001'},
                            1003: {id: '1003', create_at: 1003},
                            1004: {id: '1004', create_at: 1004, root_id: '1001'},
                            1005: {id: '1005', create_at: 1005},
                        },
                        postsInThread: {
                            1001: ['1002', '1004'],
                        },
                    },
                },
            };

            // One post, no changes
            let previous = getPostIdsForThread(state, '1005');
            let now = getPostIdsForThread(state, '1005');
            assert.deepEqual(now, ['1005']);
            assert.equal(now, previous);

            // One post, unrelated changes
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                            1006: {id: '1006', create_at: 1006, root_id: '1003'},
                        },
                        postsInThread: {
                            ...state.entities.posts.postsInThread,
                            1003: ['1006'],
                        },
                    },
                },
            };

            previous = now;
            now = getPostIdsForThread(state, '1005');
            assert.deepEqual(now, ['1005']);
            assert.equal(now, previous);

            // One post, changes to post
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                            1005: {id: '1005', create_at: 1005, update_at: 1006},
                        },
                        postsInThread: state.entities.posts.postsInThread,
                    },
                },
            };

            previous = now;
            now = getPostIdsForThread(state, '1005');
            assert.deepEqual(now, ['1005']);
            assert.equal(now, previous);

            // Change of thread
            previous = now;
            now = getPostIdsForThread(state, '1001');
            assert.deepEqual(now, ['1004', '1002', '1001']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsForThread(state, '1001');
            assert.equal(now, previous);

            // New post in thread
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                            1007: {id: '1007', create_at: 1007, root_id: '1001'},
                        },
                        postsInThread: {
                            ...state.entities.posts.postsInThread,
                            1001: [...state.entities.posts.postsInThread['1001'], '1007'],
                        },
                    },
                },
            };

            previous = now;
            now = getPostIdsForThread(state, '1001');
            assert.deepEqual(now, ['1007', '1004', '1002', '1001']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsForThread(state, '1001');
            assert.deepEqual(now, ['1007', '1004', '1002', '1001']);
            assert.equal(now, previous);
        });

        it('memoization with multiple selectors', () => {
            const getPostIdsForThread1 = Selectors.makeGetPostIdsForThread();
            const getPostIdsForThread2 = Selectors.makeGetPostIdsForThread();

            const state = {
                entities: {
                    posts: {
                        posts: {
                            1001: {id: '1001', create_at: 1001},
                            1002: {id: '1002', create_at: 1002, root_id: '1001'},
                            1003: {id: '1003', create_at: 1003},
                            1004: {id: '1004', create_at: 1004, root_id: '1001'},
                            1005: {id: '1005', create_at: 1005},
                        },
                        postsInThread: {
                            1001: ['1002', '1004'],
                        },
                    },
                },
            };

            let now1 = getPostIdsForThread1(state, '1001');
            let now2 = getPostIdsForThread2(state, '1001');
            assert.notEqual(now1, now2);
            assert.deepEqual(now1, now2);

            let previous1 = now1;
            now1 = getPostIdsForThread1(state, '1001');
            assert.equal(now1, previous1);

            const previous2 = now2;
            now2 = getPostIdsForThread2(state, '1003');
            assert.notEqual(now2, previous2);
            assert.notDeepEqual(now1, now2);

            previous1 = now1;
            now1 = getPostIdsForThread1(state, '1001');
            assert.equal(now1, previous1);
        });
    });

    describe('getPostIdsAroundPost', () => {
        it('no posts around', () => {
            const getPostIdsAroundPost = Selectors.makeGetPostIdsAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostIdsAroundPost(state, 'a', '1234'), ['a']);
        });

        it('posts around', () => {
            const getPostIdsAroundPost = Selectors.makeGetPostIdsAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostIdsAroundPost(state, 'c', '1234'), ['a', 'b', 'c', 'd', 'e']);
        });

        it('posts before limit', () => {
            const getPostIdsAroundPost = Selectors.makeGetPostIdsAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostIdsAroundPost(state, 'a', '1234', {postsBeforeCount: 2}), ['a', 'b', 'c']);
        });

        it('posts after limit', () => {
            const getPostIdsAroundPost = Selectors.makeGetPostIdsAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostIdsAroundPost(state, 'e', '1234', {postsAfterCount: 3}), ['b', 'c', 'd', 'e']);
        });

        it('posts before/after limit', () => {
            const getPostIdsAroundPost = Selectors.makeGetPostIdsAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostIdsAroundPost(state, 'c', '1234', {postsBeforeCount: 2, postsAfterCount: 1}), ['b', 'c', 'd', 'e']);
        });

        it('memoization', () => {
            const getPostIdsAroundPost = Selectors.makeGetPostIdsAroundPost();

            let state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e'], recent: true},
                            ],
                        },
                    },
                },
            };

            // No limit, no changes
            let previous = getPostIdsAroundPost(state, 'c', '1234');
            let now = getPostIdsAroundPost(state, 'c', '1234');
            assert.deepEqual(now, ['a', 'b', 'c', 'd', 'e']);
            assert.equal(now, previous);

            // Changes to posts in another channel
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        postsInChannel: {
                            ...state.entities.posts.postsInChannel,
                            abcd: [
                                {order: ['g', 'h', 'i', 'j', 'k', 'l'], recent: true},
                            ],
                        },
                    },
                },
            };

            previous = now;
            now = getPostIdsAroundPost(state, 'c', '1234');
            assert.deepEqual(now, ['a', 'b', 'c', 'd', 'e']);
            assert.equal(now, previous);

            // Changes to posts in this channel
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        postsInChannel: {
                            ...state.entities.posts.postsInChannel,
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                            ],
                        },
                    },
                },
            };

            previous = now;
            now = getPostIdsAroundPost(state, 'c', '1234');
            assert.deepEqual(now, ['a', 'b', 'c', 'd', 'e', 'f']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsAroundPost(state, 'c', '1234');
            assert.deepEqual(now, ['a', 'b', 'c', 'd', 'e', 'f']);
            assert.equal(now, previous);

            // Change of channel
            previous = now;
            now = getPostIdsAroundPost(state, 'i', 'abcd');
            assert.deepEqual(now, ['g', 'h', 'i', 'j', 'k', 'l']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsAroundPost(state, 'i', 'abcd');
            assert.deepEqual(now, ['g', 'h', 'i', 'j', 'k', 'l']);
            assert.equal(now, previous);

            // With limits
            previous = now;
            now = getPostIdsAroundPost(state, 'i', 'abcd', {postsBeforeCount: 2, postsAfterCount: 1});
            assert.deepEqual(now, ['h', 'i', 'j', 'k']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsAroundPost(state, 'i', 'abcd', {postsBeforeCount: 2, postsAfterCount: 1}); // Note that the options object is a new object each time
            assert.deepEqual(now, ['h', 'i', 'j', 'k']);
            assert.equal(now, previous);

            // Change of limits
            previous = now;
            now = getPostIdsAroundPost(state, 'i', 'abcd', {postsBeforeCount: 1, postsAfterCount: 2});
            assert.deepEqual(now, ['g', 'h', 'i', 'j']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsAroundPost(state, 'i', 'abcd', {postsBeforeCount: 1, postsAfterCount: 2});
            assert.deepEqual(now, ['g', 'h', 'i', 'j']);
            assert.equal(now, previous);

            // Change of post
            previous = now;
            now = getPostIdsAroundPost(state, 'j', 'abcd', {postsBeforeCount: 1, postsAfterCount: 2});
            assert.deepEqual(now, ['h', 'i', 'j', 'k']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsAroundPost(state, 'j', 'abcd', {postsBeforeCount: 1, postsAfterCount: 2});
            assert.deepEqual(now, ['h', 'i', 'j', 'k']);
            assert.equal(now, previous);

            // Change of posts past limit
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        postsInChannel: {
                            ...state.entities.posts.postsInChannel,
                            abcd: [
                                {order: ['y', 'g', 'h', 'i', 'j', 'k', 'l', 'f', 'z'], recent: true},
                            ],
                        },
                    },
                },
            };
            previous = now;
            now = getPostIdsAroundPost(state, 'j', 'abcd', {postsBeforeCount: 1, postsAfterCount: 2});
            assert.deepEqual(now, ['h', 'i', 'j', 'k']);
            assert.equal(now, previous);

            // Change of post order
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        postsInChannel: {
                            ...state.entities.posts.postsInChannel,
                            abcd: [
                                {order: ['y', 'g', 'i', 'h', 'j', 'l', 'k', 'z'], recent: true},
                            ],
                        },
                    },
                },
            };

            previous = now;
            now = getPostIdsAroundPost(state, 'j', 'abcd', {postsBeforeCount: 1, postsAfterCount: 2});
            assert.deepEqual(now, ['i', 'h', 'j', 'l']);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostIdsAroundPost(state, 'j', 'abcd', {postsBeforeCount: 1, postsAfterCount: 2});
            assert.deepEqual(now, ['i', 'h', 'j', 'l']);
            assert.equal(now, previous);
        });

        it('memoization with multiple selectors', () => {
            const getPostIdsAroundPost1 = Selectors.makeGetPostIdsAroundPost();
            const getPostIdsAroundPost2 = Selectors.makeGetPostIdsAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                            ],
                            abcd: [
                                {order: ['g', 'h', 'i'], recent: true},
                            ],
                        },
                    },
                },
            };

            const previous1 = getPostIdsAroundPost1(state, 'c', '1234');
            const previous2 = getPostIdsAroundPost2(state, 'h', 'abcd', {postsBeforeCount: 1, postsAfterCount: 0});

            assert.notEqual(previous1, previous2);

            const now1 = getPostIdsAroundPost1(state, 'c', '1234');
            const now2 = getPostIdsAroundPost2(state, 'i', 'abcd', {postsBeforeCount: 1, postsAfterCount: 0});

            assert.equal(now1, previous1);
            assert.notEqual(now2, previous2);
            assert.notEqual(now1, now2);
        });
    });

    describe('makeGetPostsChunkAroundPost', () => {
        it('no posts around', () => {
            const getPostsChunkAroundPost = Selectors.makeGetPostsChunkAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostsChunkAroundPost(state, 'a', '1234'), {order: ['a'], recent: true});
        });

        it('posts around', () => {
            const getPostsChunkAroundPost = Selectors.makeGetPostsChunkAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostsChunkAroundPost(state, 'c', '1234'), {order: ['a', 'b', 'c', 'd', 'e'], recent: true});
        });

        it('no matching posts', () => {
            const getPostsChunkAroundPost = Selectors.makeGetPostsChunkAroundPost();

            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                            ],
                        },
                    },
                },
            };

            assert.deepEqual(getPostsChunkAroundPost(state, 'noChunk', '1234'), null);
        });

        it('memoization', () => {
            const getPostsChunkAroundPost = Selectors.makeGetPostsChunkAroundPost();

            let state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e'], recent: true},
                            ],
                        },
                    },
                },
            };

            // No limit, no changes
            let previous = getPostsChunkAroundPost(state, 'c', '1234');

            // Changes to posts in another channel
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        postsInChannel: {
                            ...state.entities.posts.postsInChannel,
                            abcd: [
                                {order: ['g', 'h', 'i', 'j', 'k', 'l'], recent: true},
                            ],
                        },
                    },
                },
            };

            let now = getPostsChunkAroundPost(state, 'c', '1234');
            assert.deepEqual(now, {order: ['a', 'b', 'c', 'd', 'e'], recent: true});
            assert.equal(now, previous);

            // Changes to posts in this channel
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        postsInChannel: {
                            ...state.entities.posts.postsInChannel,
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                            ],
                        },
                    },
                },
            };

            previous = now;
            now = getPostsChunkAroundPost(state, 'c', '1234');
            assert.deepEqual(now, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true});
            assert.notEqual(now, previous);

            previous = now;
            now = getPostsChunkAroundPost(state, 'c', '1234');
            assert.deepEqual(now, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true});
            assert.equal(now, previous);

            // Change of channel
            previous = now;
            now = getPostsChunkAroundPost(state, 'i', 'abcd');
            assert.deepEqual(now, {order: ['g', 'h', 'i', 'j', 'k', 'l'], recent: true});
            assert.notEqual(now, previous);

            previous = now;
            now = getPostsChunkAroundPost(state, 'i', 'abcd');
            assert.deepEqual(now, {order: ['g', 'h', 'i', 'j', 'k', 'l'], recent: true});
            assert.equal(now, previous);

            // Change of post in the chunk
            previous = now;
            now = getPostsChunkAroundPost(state, 'j', 'abcd');
            assert.deepEqual(now, {order: ['g', 'h', 'i', 'j', 'k', 'l'], recent: true});
            assert.equal(now, previous);

            // Change of post order
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        postsInChannel: {
                            ...state.entities.posts.postsInChannel,
                            abcd: [
                                {order: ['y', 'g', 'i', 'h', 'j', 'l', 'k', 'z'], recent: true},
                            ],
                        },
                    },
                },
            };

            previous = now;
            now = getPostsChunkAroundPost(state, 'j', 'abcd');
            assert.deepEqual(now, {order: ['y', 'g', 'i', 'h', 'j', 'l', 'k', 'z'], recent: true});
            assert.notEqual(now, previous);

            previous = now;
            now = getPostsChunkAroundPost(state, 'j', 'abcd');
            assert.deepEqual(now, {order: ['y', 'g', 'i', 'h', 'j', 'l', 'k', 'z'], recent: true});
            assert.equal(now, previous);
        });
    });
    describe('getRecentPostsChunkInChannel', () => {
        it('Should return as recent chunk exists', () => {
            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                            ],
                        },
                    },
                },
            };

            const recentPostsChunkInChannel = Selectors.getRecentPostsChunkInChannel(state, 1234);
            assert.deepEqual(recentPostsChunkInChannel, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true});
        });

        it('Should return null as recent chunk does not exists', () => {
            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: false},
                            ],
                        },
                    },
                },
            };

            const recentPostsChunkInChannel = Selectors.getRecentPostsChunkInChannel(state, 1234);
            assert.deepEqual(recentPostsChunkInChannel, null);
        });
    });

    describe('getOldestPostsChunkInChannel', () => {
        it('Should return as oldest chunk exists', () => {
            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], oldest: true, recent: true},
                            ],
                        },
                    },
                },
            };

            const oldestPostsChunkInChannel = Selectors.getOldestPostsChunkInChannel(state, 1234);
            assert.deepEqual(oldestPostsChunkInChannel, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true, oldest: true});
        });

        it('Should return null as recent chunk does not exists', () => {
            const state = {
                entities: {
                    posts: {
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: false, oldest: false},
                            ],
                        },
                    },
                },
            };

            const oldestPostsChunkInChannel = Selectors.getOldestPostsChunkInChannel(state, 1234);
            assert.deepEqual(oldestPostsChunkInChannel, null);
        });
    });

    describe('getPostsChunkInChannelAroundTime', () => {
        it('getPostsChunkInChannelAroundTime', () => {
            const state = {
                entities: {
                    posts: {
                        posts: {
                            e: {id: 'e', create_at: 1010},
                            j: {id: 'j', create_at: 1001},
                            a: {id: 'a', create_at: 1020},
                            f: {id: 'f', create_at: 1010},
                        },
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                                {order: ['e', 'f', 'g', 'h', 'i', 'j'], recent: false},
                            ],
                        },
                    },
                },
            };

            const postsChunkInChannelAroundTime1 = Selectors.getPostsChunkInChannelAroundTime(state, 1234, 1011);
            assert.deepEqual(postsChunkInChannelAroundTime1, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true});

            const postsChunkInChannelAroundTime2 = Selectors.getPostsChunkInChannelAroundTime(state, 1234, 1002);
            assert.deepEqual(postsChunkInChannelAroundTime2, {order: ['e', 'f', 'g', 'h', 'i', 'j'], recent: false});

            const postsChunkInChannelAroundTime3 = Selectors.getPostsChunkInChannelAroundTime(state, 1234, 1010);
            assert.deepEqual(postsChunkInChannelAroundTime3, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true});

            const postsChunkInChannelAroundTime4 = Selectors.getPostsChunkInChannelAroundTime(state, 1234, 1020);
            assert.deepEqual(postsChunkInChannelAroundTime4, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true});
        });
    });

    describe('getUnreadPostsChunk', () => {
        it('should return recent chunk even if the timstamp is greater than the last post', () => {
            const state = {
                entities: {
                    posts: {
                        posts: {
                            e: {id: 'e', create_at: 1010},
                            j: {id: 'j', create_at: 1001},
                            a: {id: 'a', create_at: 1020},
                            f: {id: 'f', create_at: 1010},
                        },
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                                {order: ['e', 'f', 'g', 'h', 'i', 'j'], recent: false},
                            ],
                        },
                    },
                },
            };

            const unreadPostsChunk = Selectors.getUnreadPostsChunk(state, 1234, 1030);
            assert.deepEqual(unreadPostsChunk, {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true});
        });

        it('should return a not recent chunk based on the timestamp', () => {
            const state = {
                entities: {
                    posts: {
                        posts: {
                            e: {id: 'e', create_at: 1010},
                            j: {id: 'j', create_at: 1001},
                            a: {id: 'a', create_at: 1020},
                            f: {id: 'f', create_at: 1010},
                        },
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c', 'd', 'e', 'f'], recent: true},
                                {order: ['e', 'f', 'g', 'h', 'i', 'j'], recent: false},
                            ],
                        },
                    },
                },
            };

            const unreadPostsChunk = Selectors.getUnreadPostsChunk(state, 1234, 1002);
            assert.deepEqual(unreadPostsChunk, {order: ['e', 'f', 'g', 'h', 'i', 'j'], recent: false});
        });

        it('should return recent chunk if it is an empty array', () => {
            const state = {
                entities: {
                    posts: {
                        posts: {},
                        postsInChannel: {
                            1234: [
                                {order: [], recent: true},
                            ],
                        },
                    },
                },
            };

            const unreadPostsChunk = Selectors.getUnreadPostsChunk(state, 1234, 1002);
            assert.deepEqual(unreadPostsChunk, {order: [], recent: true});
        });

        it('should return oldest chunk if timstamp greater than the oldest post', () => {
            const state = {
                entities: {
                    posts: {
                        posts: {
                            a: {id: 'a', create_at: 1001},
                            b: {id: 'b', create_at: 1002},
                            c: {id: 'c', create_at: 1003},
                        },
                        postsInChannel: {
                            1234: [
                                {order: ['a', 'b', 'c'], recent: true, oldest: true},
                            ],
                        },
                    },
                },
            };

            const unreadPostsChunk = Selectors.getUnreadPostsChunk(state, 1234, 1000);
            assert.deepEqual(unreadPostsChunk, {order: ['a', 'b', 'c'], recent: true, oldest: true});
        });
    });

    describe('getPostsForIds', () => {
        it('selector', () => {
            const getPostsForIds = Selectors.makeGetPostsForIds();

            const testPosts = {
                1000: {id: '1000'},
                1001: {id: '1001'},
                1002: {id: '1002'},
                1003: {id: '1003'},
                1004: {id: '1004'},
            };
            const state = {
                entities: {
                    posts: {
                        posts: testPosts,
                    },
                },
            };

            const postIds = ['1000', '1002', '1003'];

            const actual = getPostsForIds(state, postIds);
            assert.equal(actual.length, 3);
            assert.equal(actual[0], testPosts[postIds[0]]);
            assert.equal(actual[1], testPosts[postIds[1]]);
            assert.equal(actual[2], testPosts[postIds[2]]);
        });

        it('memoization', () => {
            const getPostsForIds = Selectors.makeGetPostsForIds();

            const testPosts = {
                1000: {id: '1000'},
                1001: {id: '1001'},
                1002: {id: '1002'},
                1003: {id: '1003'},
                1004: {id: '1004'},
            };
            let state = {
                entities: {
                    posts: {
                        posts: {
                            ...testPosts,
                        },
                    },
                },
            };
            let postIds = ['1000', '1002', '1003'];

            let now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1000'], testPosts['1002'], testPosts['1003']]);

            // No changes
            let previous = now;
            now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1000'], testPosts['1002'], testPosts['1003']]);
            assert.equal(now, previous);

            // New, identical ids
            postIds = ['1000', '1002', '1003'];

            previous = now;
            now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1000'], testPosts['1002'], testPosts['1003']]);
            assert.equal(now, previous);

            // New posts, no changes to ones in ids
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                        },
                    },
                },
            };

            previous = now;
            now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1000'], testPosts['1002'], testPosts['1003']]);
            assert.equal(now, previous);

            // New ids
            postIds = ['1001', '1002', '1004'];

            previous = now;
            now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1001'], testPosts['1002'], testPosts['1004']]);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1001'], testPosts['1002'], testPosts['1004']]);
            assert.equal(now, previous);

            // New posts, changes to ones in ids
            const newPost = {id: '1002', message: 'abcd'};
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                            [newPost.id]: newPost,
                        },
                    },
                },
            };

            previous = now;
            now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1001'], newPost, testPosts['1004']]);
            assert.notEqual(now, previous);

            previous = now;
            now = getPostsForIds(state, postIds);
            assert.deepEqual(now, [testPosts['1001'], newPost, testPosts['1004']]);
            assert.equal(now, previous);
        });
    });

    describe('getMostRecentPostIdInChannel', () => {
        it('system messages visible', () => {
            const testPosts = {
                1000: {id: '1000', type: 'system_join_channel'},
                1001: {id: '1001', type: 'system_join_channel'},
                1002: {id: '1002'},
                1003: {id: '1003'},
            };
            const state = {
                entities: {
                    posts: {
                        posts: testPosts,
                        postsInChannel: {
                            channelId: [
                                {order: ['1000', '1001', '1002', '1003'], recent: true},
                            ],
                        },
                    },
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_ADVANCED_SETTINGS}--${Preferences.ADVANCED_FILTER_JOIN_LEAVE}`]: {value: 'true'},
                        },
                    },
                },
            };

            const postId = Selectors.getMostRecentPostIdInChannel(state, 'channelId');
            assert.equal(postId, '1000');
        });

        it('system messages hidden', () => {
            const testPosts = {
                1000: {id: '1000', type: 'system_join_channel'},
                1001: {id: '1001', type: 'system_join_channel'},
                1002: {id: '1002'},
                1003: {id: '1003'},
            };
            const state = {
                entities: {
                    posts: {
                        posts: testPosts,
                        postsInChannel: {
                            channelId: [
                                {order: ['1000', '1001', '1002', '1003'], recent: true},
                            ],
                        },
                    },
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_ADVANCED_SETTINGS}--${Preferences.ADVANCED_FILTER_JOIN_LEAVE}`]: {value: 'false'},
                        },
                    },
                },
            };

            const postId = Selectors.getMostRecentPostIdInChannel(state, 'channelId');
            assert.equal(postId, '1002');
        });
    });

    describe('getLatestReplyablePostId', () => {
        it('no posts', () => {
            const state = {
                entities: {
                    channels: {
                        currentChannelId: 'abcd',
                    },
                    posts: {
                        posts: {},
                        postsInChannel: [],
                    },
                    preferences: {
                        myPreferences: {},
                    },
                    users: {
                        profiles: {},
                    },
                },
            };
            const actual = Selectors.getLatestReplyablePostId(state);

            expect(actual).toEqual('');
        });

        it('return first post which dosent have POST_DELETED state', () => {
            const postsAny = {
                a: {id: 'a', channel_id: 'a', create_at: 1, highlight: false, user_id: 'a'},
                b: {id: 'b', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', state: Posts.POST_DELETED},
                c: {id: 'c', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', type: 'system_join_channel'},
                d: {id: 'd', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
                e: {id: 'e', channel_id: 'abcd', create_at: 4, highlight: false, user_id: 'b'},
            };
            const state = {
                entities: {
                    channels: {
                        currentChannelId: 'abcd',
                    },
                    posts: {
                        posts: postsAny,
                        postsInChannel: {
                            abcd: [
                                {order: ['b', 'c', 'd', 'e'], recent: true},
                            ],
                        },
                    },
                    preferences: {
                        myPreferences: {},
                    },
                    users: {
                        profiles: {},
                    },
                },
            };
            const actual = Selectors.getLatestReplyablePostId(state);

            expect(actual).toEqual(postsAny.e.id);
        });
    });

    describe('makeIsPostCommentMention', () => {
        const currentUser = {
            ...testState.entities.users.profiles[user1.id],
            notify_props: {
                comments: 'any',
            },
        };

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: {
                        ...testState.entities.users.profiles,
                        [user1.id]: currentUser,
                    },
                },
            },
        };

        const isPostCommentMention = Selectors.makeIsPostCommentMention();

        it('Should return true as root post is by the current user', () => {
            assert.equal(isPostCommentMention(modifiedState, 'e', 'a'), true);
        });

        it('Should return false as post is not from currentUser', () => {
            assert.equal(isPostCommentMention(modifiedState, 'b'), false);
        });

        it('Should return true as post is from webhook but user created rootPost', () => {
            const modifiedWbhookPostState = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    posts: {
                        ...modifiedState.entities.posts,
                        posts: {
                            ...modifiedState.entities.posts.posts,
                            e: {
                                ...modifiedState.entities.posts.posts.e,
                                props: {
                                    from_webhook: true,
                                },
                                user_id: user1.id,
                            },
                        },
                    },
                },
            };

            assert.equal(isPostCommentMention(modifiedWbhookPostState, 'e', 'a'), true);
        });

        it('Should return true as user commented in the thread', () => {
            const modifiedThreadState = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    posts: {
                        ...modifiedState.entities.posts,
                        posts: {
                            ...modifiedState.entities.posts.posts,
                            a: {
                                ...modifiedState.entities.posts.posts.a,
                                user_id: 'b',
                            },
                            c: {
                                ...modifiedState.entities.posts.posts.c,
                                user_id: user1.id,
                            },
                        },
                    },
                },
            };

            assert.equal(isPostCommentMention(modifiedThreadState, 'e', 'a'), true);
        });

        it('Should return false as user commented in the thread but notify_props is for root only', () => {
            const modifiedCurrentUserForNotifyProps = {
                ...testState.entities.users.profiles[user1.id],
                notify_props: {
                    comments: 'root',
                },
            };

            const modifiedStateForRoot = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    posts: {
                        ...modifiedState.entities.posts,
                        posts: {
                            ...modifiedState.entities.posts.posts,
                            a: {
                                ...modifiedState.entities.posts.posts.a,
                                user_id: 'not current',
                            },
                            c: {
                                ...modifiedState.entities.posts.posts.c,
                                user_id: user1.id,
                            },
                        },
                    },
                    users: {
                        ...modifiedState.entities.users,
                        profiles: {
                            ...modifiedState.entities.users.profiles,
                            [user1.id]: modifiedCurrentUserForNotifyProps,
                        },
                    },
                },
            };

            assert.equal(isPostCommentMention(modifiedStateForRoot, 'e'), false);
        });

        it('Should return false as user created root post', () => {
            const modifiedCurrentUserForNotifyProps = {
                ...testState.entities.users.profiles[user1.id],
                notify_props: {
                    comments: 'root',
                },
            };

            const modifiedStateForRoot = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    users: {
                        ...modifiedState.entities.users,
                        profiles: {
                            ...modifiedState.entities.users.profiles,
                            [user1.id]: modifiedCurrentUserForNotifyProps,
                        },
                    },
                },
            };

            assert.equal(isPostCommentMention(modifiedStateForRoot, 'e'), false);
        });
    });
});

describe('getPostIdsInCurrentChannel', () => {
    test('should return null when channel is not loaded', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                posts: {
                    postsInChannel: {},
                },
            },
        };

        const postIds = Selectors.getPostIdsInCurrentChannel(state);

        expect(postIds).toBe(null);
    });

    test('should return null when recent posts are not loaded', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                posts: {
                    postsInChannel: {
                        channel1: [
                            {order: ['post1', 'post2']},
                        ],
                    },
                },
            },
        };

        const postIds = Selectors.getPostIdsInCurrentChannel(state);

        expect(postIds).toBe(null);
    });

    test('should return post order from recent block', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                posts: {
                    postsInChannel: {
                        channel1: [
                            {order: ['post1', 'post2'], recent: true},
                        ],
                    },
                },
            },
        };

        const postIds = Selectors.getPostIdsInCurrentChannel(state);

        expect(postIds).toBe(state.entities.posts.postsInChannel.channel1[0].order);
    });
});

describe('getPostsInCurrentChannel', () => {
    test('should return null when channel is not loaded', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                posts: {
                    posts: {},
                    postsInChannel: {},
                    postsInThread: {},
                },
                preferences: {
                    myPreferences: {
                        [`${Preferences.CATEGORY_ADVANCED_SETTINGS}--${Preferences.ADVANCED_FILTER_JOIN_LEAVE}`]: {value: 'true'},
                    },
                },
                users: {
                    profiles: {},
                },
            },
        };

        const postIds = Selectors.getPostsInCurrentChannel(state);

        expect(postIds).toEqual(null);
    });

    test('should return null when recent posts are not loaded', () => {
        const post1 = {id: 'post1'};
        const post2 = {id: 'post2'};

        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                posts: {
                    posts: {
                        post1,
                        post2,
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post1', 'post2']},
                        ],
                    },
                    postsInThread: {},
                },
                preferences: {
                    myPreferences: {
                        [`${Preferences.CATEGORY_ADVANCED_SETTINGS}--${Preferences.ADVANCED_FILTER_JOIN_LEAVE}`]: {value: 'true'},
                    },
                },
                users: {
                    profiles: {},
                },
            },
        };

        const postIds = Selectors.getPostsInCurrentChannel(state);

        expect(postIds).toEqual(null);
    });

    test('should return post order from recent block', () => {
        const post1 = {id: 'post1'};
        const post2 = {id: 'post2'};

        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                posts: {
                    posts: {
                        post1,
                        post2,
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post1', 'post2'], recent: true},
                        ],
                    },
                    postsInThread: {},
                },
                preferences: {
                    myPreferences: {
                        [`${Preferences.CATEGORY_ADVANCED_SETTINGS}--${Preferences.ADVANCED_FILTER_JOIN_LEAVE}`]: {value: 'true'},
                    },
                },
                users: {
                    profiles: {},
                },
            },
        };

        const postIds = Selectors.getPostsInCurrentChannel(state);

        expect(postIds).toMatchObject([post1, post2]);
    });
});

describe('getCurrentUsersLatestPost', () => {
    const user1 = TestHelper.fakeUserWithId();
    user1.notify_props = {};
    const profiles = {};
    profiles[user1.id] = user1;
    it('no posts', () => {
        const noPosts = {};
        const state = {
            entities: {
                users: {
                    currentUserId: user1.id,
                    profiles,
                },
                posts: {
                    posts: noPosts,
                    postsInChannel: [],
                },
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    currentChannelId: 'abcd',
                },
            },
        };
        const actual = Selectors.getCurrentUsersLatestPost(state);

        expect(actual).toEqual(null);
    });

    it('return first post which user can edit', () => {
        const postsAny = {
            a: {id: 'a', channel_id: 'a', create_at: 1, highlight: false, user_id: 'a'},
            b: {id: 'b', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', state: Posts.POST_DELETED},
            c: {id: 'c', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', type: 'system_join_channel'},
            d: {id: 'd', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
            e: {id: 'e', channel_id: 'abcd', create_at: 4, highlight: false, user_id: 'c'},
            f: {id: 'f', channel_id: 'abcd', create_at: 4, highlight: false, user_id: user1.id},
        };
        const state = {
            entities: {
                users: {
                    currentUserId: user1.id,
                    profiles,
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        abcd: [
                            {order: ['b', 'c', 'd', 'e', 'f'], recent: true},
                        ],
                    },
                    postsInThread: {},
                },
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    currentChannelId: 'abcd',
                },
            },
        };
        const actual = Selectors.getCurrentUsersLatestPost(state);

        expect(actual).toMatchObject(postsAny.f);
    });

    it('return first post which user can edit ignore pending and failed', () => {
        const postsAny = {
            a: {id: 'a', channel_id: 'a', create_at: 1, highlight: false, user_id: 'a'},
            b: {id: 'b', channel_id: 'abcd', create_at: 4, highlight: false, user_id: user1.id, pending_post_id: 'b'},
            c: {id: 'c', channel_id: 'abcd', create_at: 4, highlight: false, user_id: user1.id, failed: true},
            d: {id: 'd', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
            e: {id: 'e', channel_id: 'abcd', create_at: 4, highlight: false, user_id: 'c'},
            f: {id: 'f', channel_id: 'abcd', create_at: 4, highlight: false, user_id: user1.id},
        };
        const state = {
            entities: {
                users: {
                    currentUserId: user1.id,
                    profiles,
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        abcd: [
                            {order: ['b', 'c', 'd', 'e', 'f'], recent: true},
                        ],
                    },
                    postsInThread: {},
                },
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    currentChannelId: 'abcd',
                },
            },
        };
        const actual = Selectors.getCurrentUsersLatestPost(state);

        expect(actual).toMatchObject(postsAny.f);
    });

    it('return first post which has rootId match', () => {
        const postsAny = {
            a: {id: 'a', channel_id: 'a', create_at: 1, highlight: false, user_id: 'a'},
            b: {id: 'b', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', state: Posts.POST_DELETED},
            c: {id: 'c', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', type: 'system_join_channel'},
            d: {id: 'd', root_id: 'a', channel_id: 'abcd', create_at: 3, highlight: false, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
            e: {id: 'e', channel_id: 'abcd', create_at: 4, highlight: false, user_id: 'c'},
            f: {id: 'f', root_id: 'e', channel_id: 'abcd', create_at: 4, highlight: false, user_id: user1.id},
        };
        const state = {
            entities: {
                users: {
                    currentUserId: user1.id,
                    profiles,
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        abcd: [
                            {order: ['b', 'c', 'd', 'e', 'f'], recent: true},
                        ],
                    },
                    postsInThread: {},
                },
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    currentChannelId: 'abcd',
                },
            },
        };
        const actual = Selectors.getCurrentUsersLatestPost(state, 'e');

        expect(actual).toMatchObject(postsAny.f);
    });

    it('should not return posts outside of the recent block', () => {
        const postsAny = {
            a: {id: 'a', channel_id: 'a', create_at: 1, user_id: 'a'},
        };
        const state = {
            entities: {
                users: {
                    currentUserId: user1.id,
                    profiles,
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        abcd: [
                            {order: ['a'], recent: false},
                        ],
                    },
                },
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    currentChannelId: 'abcd',
                },
            },
        };
        const actual = Selectors.getCurrentUsersLatestPost(state, 'e');

        assert.equal(actual, null);
    });

    it('determine the sending posts', () => {
        const state = {
            entities: {
                users: {
                    currentUserId: user1.id,
                    profiles,
                },
                posts: {
                    posts: {},
                    postsInChannel: {},
                    pendingPostIds: ['1', '2', '3'],
                },
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    currentChannelId: 'abcd',
                },
            },
        };

        assert.equal(Selectors.isPostIdSending(state, '1'), true);
        assert.equal(Selectors.isPostIdSending(state, '2'), true);
        assert.equal(Selectors.isPostIdSending(state, '3'), true);
        assert.equal(Selectors.isPostIdSending(state, '4'), false);
        assert.equal(Selectors.isPostIdSending(state), false);
    });
});

describe('getExpandedLink', () => {
    it('should get the expanded link from the state', () => {
        const state = {
            entities: {
                posts: {
                    expandedURLs: {
                        a: 'b',
                        c: 'd',
                    },
                },
            },
        };
        assert.equal(Selectors.getExpandedLink(state, 'a'), 'b');
        assert.equal(Selectors.getExpandedLink(state, 'c'), 'd');
    });

    it('should return undefined if it is not saved', () => {
        const state = {
            entities: {
                posts: {
                    expandedURLs: {
                        a: 'b',
                        c: 'd',
                    },
                },
            },
        };
        assert.equal(Selectors.getExpandedLink(state, 'b'), undefined);
        assert.equal(Selectors.getExpandedLink(state, ''), undefined);
    });
});
