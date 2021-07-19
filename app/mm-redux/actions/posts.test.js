// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */

import fs from 'fs';
import assert from 'assert';
import nock from 'nock';

import * as Actions from '@mm-redux/actions/posts';
import {getChannelStats} from '@mm-redux/actions/channels';
import {login} from '@mm-redux/actions/users';
import {createCustomEmoji} from '@mm-redux/actions/emojis';
import {Client4} from '@client/rest';
import {Preferences, Posts, RequestStatus} from '../constants';
import {ChannelTypes, PostTypes} from '@mm-redux/action_types';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';
import {getPreferenceKey} from '@mm-redux/utils/preference_utils';

const OK_RESPONSE = {status: 'OK'};

describe('Actions.Posts', () => {
    let store;
    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('createPost', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, {...post, id: TestHelper.generateId()});

        await Actions.createPost(post)(store.dispatch, store.getState);

        const state = store.getState();
        const createRequest = state.requests.posts.createPost;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        const {posts, postsInChannel} = state.entities.posts;
        assert.ok(posts);
        assert.ok(postsInChannel);

        let found = false;
        for (const storedPost of Object.values(posts)) {
            if (storedPost.message === post.message) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find new post in posts');

        // postsInChannel[channelId] should not exist as create post should not add entry to postsInChannel when it did not exist before
        assert.ok(!postsInChannel[channelId], 'postIds in channel do not exist');
    });

    it('resetCreatePostRequest', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);
        const createPostError = {
            message: 'Invalid RootId parameter',
            server_error_id: 'api.post.create_post.root_id.app_error',
            status_code: 400,
            url: 'http://localhost:8065/api/v4/posts',
        };

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(400, createPostError);

        await Actions.createPost(post)(store.dispatch, store.getState);
        await TestHelper.wait(50);

        let state = store.getState();
        let createRequest = state.requests.posts.createPost;
        if (createRequest.status !== RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        assert.equal(createRequest.status, RequestStatus.FAILURE);
        assert.equal(createRequest.error.message, createPostError.message);
        assert.equal(createRequest.error.status_code, createPostError.status_code);

        store.dispatch(Actions.resetCreatePostRequest());
        await TestHelper.wait(50);

        state = store.getState();
        createRequest = state.requests.posts.createPost;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        assert.equal(createRequest.status, RequestStatus.NOT_STARTED);
        assert.equal(createRequest.error, null);
    });

    // it('retry failed post', async () => {
    //     const channelId = TestHelper.basicChannel.id;
    //     const post = TestHelper.fakePost(channelId);

    //     nock(Client4.getBaseRoute()).
    //         post('/posts').
    //         reply(400, {});

    //     nock(Client4.getBaseRoute()).
    //         post('').
    //         reply(201, {...post, id: TestHelper.generateId()});

    //     await Actions.createPost(post)(store.dispatch, store.getState);

    //     await TestHelper.wait(200);

    //     let state = store.getState();

    //     const {posts} = state.entities.posts;
    //     assert.ok(posts);

    //     let failedPost;
    //     for (const storedPost of Object.values(posts)) {
    //         if (storedPost.failed) {
    //             failedPost = storedPost;
    //             break;
    //         }
    //     }

    //     assert.ok(failedPost, 'failed to find failed post');

    //     // Retry the post
    //     const {id, failed, ...retryPost} = failedPost; // eslint-disable-line
    //     await Actions.createPost(retryPost)(store.dispatch, store.getState);

    //     await TestHelper.wait(500);

    //     state = store.getState();
    //     const {posts: nextPosts} = state.entities.posts;

    //     let found = false;
    //     for (const storedPost of Object.values(nextPosts)) {
    //         if (storedPost.pending_post_id === failedPost.pending_post_id) {
    //             if (!storedPost.failed) {
    //                 found = true;
    //                 break;
    //             }
    //         }
    //     }

    //     assert.ok(found, 'Retried post failed again.');
    // });

    it('editPost', async () => {
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(channelId));

        const post = await Client4.createPost(
            TestHelper.fakePost(channelId),
        );
        const message = post.message;

        post.message = `${message} (edited)`;

        nock(Client4.getBaseRoute()).
            put(`/posts/${post.id}/patch`).
            reply(200, post);

        await Actions.editPost(
            post,
        )(store.dispatch, store.getState);

        const state = store.getState();
        const editRequest = state.requests.posts.editPost;
        const {posts} = state.entities.posts;

        if (editRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(editRequest.error));
        }

        assert.ok(posts);
        assert.ok(posts[post.id]);

        assert.strictEqual(
            posts[post.id].message,
            `${message} (edited)`,
        );
    });

    it('deletePost', async () => {
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(channelId));
        await Actions.createPost(TestHelper.fakePost(channelId))(store.dispatch, store.getState);
        const initialPosts = store.getState().entities.posts;
        const postId = Object.keys(initialPosts.posts)[0];

        nock(Client4.getBaseRoute()).
            delete(`/posts/${postId}`).
            reply(200, {});
        await Actions.deletePost(initialPosts.posts[postId])(store.dispatch, store.getState);

        const state = store.getState();
        const {posts} = state.entities.posts;

        assert.ok(posts);
        assert.ok(posts[postId]);
        assert.strictEqual(
            posts[postId].state,
            Posts.POST_DELETED,
        );
    });

    it('deletePostWithReaction', async () => {
        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id),
        );

        const emojiName = '+1';

        nock(Client4.getBaseRoute()).
            post('/reactions').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(store.dispatch, store.getState);

        let reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(reactions[post1.id]);
        assert.ok(reactions[post1.id][TestHelper.basicUser.id + '-' + emojiName]);

        nock(Client4.getBaseRoute()).
            delete(`/posts/${post1.id}`).
            reply(200, {});
        await Actions.deletePost(post1)(store.dispatch, store.getState);

        reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(!reactions[post1.id]);
    });

    it('removePost', async () => {
        const post1 = {id: 'post1', channel_id: 'channel1', create_at: 1001, message: ''};
        const post2 = {id: 'post2', channel_id: 'channel1', create_at: 1002, message: '', is_pinned: true};
        const post3 = {id: 'post3', channel_id: 'channel1', root_id: 'post2', create_at: 1003, message: ''};
        const post4 = {id: 'post4', channel_id: 'channel1', root_id: 'post1', create_at: 1004, message: ''};

        store = await configureStore({
            entities: {
                posts: {
                    posts: {
                        post1,
                        post2,
                        post3,
                        post4,
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post4', 'post3', 'post2', 'post1'], recent: false},
                        ],
                    },
                    postsInThread: {
                        post1: ['post4'],
                        post2: ['post3'],
                    },
                },
                channels: {
                    stats: {
                        channel1: {
                            pinnedpost_count: 2,
                        },
                    },
                },
            },
        });

        await store.dispatch(Actions.removePost(post2));

        const state = store.getState();
        const {stats} = state.entities.channels;
        const pinnedPostCount = stats.channel1.pinnedpost_count;

        expect(state.entities.posts.posts).toEqual({
            post1,
            post4,
        });
        expect(state.entities.posts.postsInChannel).toEqual({
            channel1: [
                {order: ['post4', 'post1'], recent: false},
            ],
        });
        expect(state.entities.posts.postsInThread).toEqual({
            post1: ['post4'],
        });
        expect(pinnedPostCount).toEqual(1);
    });

    it('removePostWithReaction', async () => {
        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id),
        );

        const emojiName = '+1';

        nock(Client4.getBaseRoute()).
            post('/reactions').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(store.dispatch, store.getState);

        let reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(reactions[post1.id]);
        assert.ok(reactions[post1.id][TestHelper.basicUser.id + '-' + emojiName]);

        await store.dispatch(Actions.removePost(post1));

        reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(!reactions[post1.id]);
    });

    it('getPostThread', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = {id: TestHelper.generateId(), channel_id: channelId, message: ''};
        const comment = {id: TestHelper.generateId(), root_id: post.id, channel_id: channelId, message: ''};

        store.dispatch(Actions.receivedPostsInChannel({order: [post.id], posts: {[post.id]: post}}, channelId));

        const postList = {
            order: [post.id],
            posts: {
                [post.id]: post,
                [comment.id]: comment,
            },
        };

        nock(Client4.getBaseRoute()).
            get(`/posts/${post.id}/thread?skipFetchThreads=false&collapsedThreads=false&collapsedThreadsExtended=false`).
            reply(200, postList);
        await Actions.getPostThread(post.id)(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostThread;
        const {
            posts,
            postsInChannel,
            postsInThread,
        } = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(posts[post.id]);
        assert.ok(postsInThread[post.id]);
        assert.deepEqual(postsInThread[post.id], [comment.id]);
        assert.ok(postsInChannel[channelId]);

        const found = postsInChannel[channelId].find((block) => block.order.indexOf(comment.id) !== -1);
        assert.ok(!found, 'should not have found comment in postsInChannel');
    });

    it('getPosts', async () => {
        const post0 = {id: 'post0', channel_id: 'channel1', create_at: 1000, message: ''};
        const post1 = {id: 'post1', channel_id: 'channel1', create_at: 1001, message: ''};
        const post2 = {id: 'post2', channel_id: 'channel1', create_at: 1002, message: ''};
        const post3 = {id: 'post3', channel_id: 'channel1', root_id: 'post2', create_at: 1003, message: '', user_id: 'user1'};
        const post4 = {id: 'post4', channel_id: 'channel1', root_id: 'post0', create_at: 1004, message: '', user_id: 'user2'};

        const postList = {
            order: ['post4', 'post3', 'post2', 'post1'],
            posts: {
                post0,
                post1,
                post2,
                post3,
                post4,
            },
        };

        nock(Client4.getChannelsRoute()).
            get('/channel1/posts').
            query(true).
            reply(200, postList);

        const result = await store.dispatch(Actions.getPosts('channel1'));

        expect(result).toEqual({data: postList});

        const state = store.getState();

        expect(state.entities.posts.posts).toEqual({
            post0: {...post0, participants: [{id: 'user2'}]},
            post1,
            post2: {...post2, participants: [{id: 'user1'}]},
            post3,
            post4,
        });
        expect(state.entities.posts.postsInChannel).toEqual({
            channel1: [
                {order: ['post4', 'post3', 'post2', 'post1'], recent: true, oldest: false},
            ],
        });
        expect(state.entities.posts.postsInThread).toEqual({
            post0: ['post4'],
            post2: ['post3'],
        });
    });

    it('getNeededAtMentionedUsernames', async () => {
        const state = {
            entities: {
                users: {
                    profiles: {
                        1: {
                            id: '1',
                            username: 'aaa',
                        },
                    },
                },
            },
        };

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: 'aaa'},
            ]),
            new Set(),
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@aaa'},
            ]),
            new Set(),
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@aaa @bbb @ccc'},
            ]),
            new Set(['bbb', 'ccc']),
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@bbb. @ccc.ddd'},
            ]),
            new Set(['bbb.', 'bbb', 'ccc.ddd']),
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@bbb- @ccc-ddd'},
            ]),
            new Set(['bbb-', 'bbb', 'ccc-ddd']),
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@bbb_ @ccc_ddd'},
            ]),
            new Set(['bbb_', 'ccc_ddd']),
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '(@bbb/@ccc) ddd@eee'},
            ]),
            new Set(['bbb', 'ccc']),
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@all'},
                {message: '@here'},
                {message: '@channel'},
                {message: '@all.'},
                {message: '@here.'},
                {message: '@channel.'},
            ]),
            new Set(),
            'should never try to request usernames matching special mentions',
        );
    });

    describe('getNeededCustomEmojis', () => {
        const state = {
            entities: {
                emojis: {
                    customEmoji: {
                        1: {
                            id: '1',
                            creator_id: '1',
                            name: 'name1',
                        },
                    },
                    nonExistentEmoji: new Set(['name2']),
                },
                general: {
                    config: {
                        EnableCustomEmoji: 'true',
                    },
                },
            },
        };

        it('no emojis in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: 'aaa'},
                ]),
                new Set(),
            );
        });

        it('already loaded custom emoji in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name1:'},
                ]),
                new Set(),
            );
        });

        it('mixed emojis in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':mattermost: :name1: :name2: :name3:'},
                ]),
                new Set(['mattermost', 'name3']),
            );
        });

        it('custom emojis and text in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: 'aaa :name3: :name4:'},
                ]),
                new Set(['name3', 'name4']),
            );
        });

        it('custom emoji followed by punctuation', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name3:!'},
                ]),
                new Set(['name3']),
            );
        });

        it('custom emoji including hyphen', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name-3:'},
                ]),
                new Set(['name-3']),
            );
        });

        it('custom emoji including underscore', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name_3:'},
                ]),
                new Set(['name_3']),
            );
        });

        it('custom emoji in message attachment text', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{text: ':name3:'}]}},
                ]),
                new Set(['name3']),
            );
        });

        it('custom emoji in message attachment pretext', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{pretext: ':name3:'}]}},
                ]),
                new Set(['name3']),
            );
        });

        it('custom emoji in message attachment field', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{fields: [{value: ':name3:'}]}]}},
                ]),
                new Set(['name3']),
            );
        });

        it('mixed emojis in message attachment', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{text: ':name4: :name1:', pretext: ':name3: :mattermost:', fields: [{value: ':name3:'}]}]}},
                ]),
                new Set(['name3', 'mattermost', 'name4']),
            );
        });

        it('empty message attachment field', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{fields: [{}]}]}},
                ]),
                new Set([]),
            );
        });

        it('null message attachment contents', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{text: null, pretext: null, fields: null}]}},
                ]),
                new Set([]),
            );
        });

        it('null message attachment', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: null}},
                ]),
                new Set([]),
            );
        });

        it('multiple posts', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':emoji3:'},
                    {message: ':emoji4:'},
                ]),
                new Set(['emoji3', 'emoji4']),
            );
        });

        it('with custom emojis disabled', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis({
                    entities: {
                        ...state.entities,
                        general: {
                            config: {
                                EnableCustomEmoji: 'false',
                            },
                        },
                    },
                }, [
                    {message: ':emoji3:'},
                ]),
                new Set([]),
            );
        });

        it('do not load emojis when the post has metadata', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {
                        message: ':emoji3:',
                        metadata: {
                            emojis: [{name: 'emoji3'}],
                        },
                    },
                ]),
                new Set([]),
            );
        });
    });

    it('getPostsSince', async () => {
        const post0 = {id: 'post0', channel_id: 'channel1', create_at: 1000, message: ''};
        const post1 = {id: 'post1', channel_id: 'channel1', create_at: 1001, message: ''};
        const post2 = {id: 'post2', channel_id: 'channel1', create_at: 1002, message: ''};
        const post3 = {id: 'post3', channel_id: 'channel1', create_at: 1003, message: ''};
        const post4 = {id: 'post4', channel_id: 'channel1', root_id: 'post0', create_at: 1004, message: '', user_id: 'user1'};

        store = await configureStore({
            entities: {
                posts: {
                    posts: {
                        post1,
                        post2,
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post2', 'post1'], recent: true},
                        ],
                    },
                },
            },
        });

        const postList = {
            order: ['post4', 'post3', 'post1'],
            posts: {
                post0,
                post1, // Pretend post1 has been updated
                post3,
                post4,
            },
        };

        nock(Client4.getChannelsRoute()).
            get('/channel1/posts').
            query(true).
            reply(200, postList);

        const result = await store.dispatch(Actions.getPostsSince('channel1', post2.create_at));

        expect(result).toEqual({data: postList});

        const state = store.getState();

        expect(state.entities.posts.posts).toEqual({
            post0: {...post0, participants: [{id: 'user1'}]},
            post1,
            post2,
            post3,
            post4,
        });
        expect(state.entities.posts.postsInChannel).toEqual({
            channel1: [
                {order: ['post4', 'post3', 'post2', 'post1'], recent: true},
            ],
        });
        expect(state.entities.posts.postsInThread).toEqual({
            post0: ['post4'],
        });
    });

    it('getPostsBefore', async () => {
        const channelId = 'channel1';

        const post1 = {id: 'post1', channel_id: channelId, create_at: 1001, message: ''};
        const post2 = {id: 'post2', channel_id: channelId, root_id: 'post1', create_at: 1002, message: ''};
        const post3 = {id: 'post3', channel_id: channelId, create_at: 1003, message: ''};

        store = await configureStore({
            entities: {
                posts: {
                    posts: {
                        post3,
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post1'], recent: false, oldest: false},
                        ],
                    },
                },
            },
        });

        const postList = {
            order: [post2.id, post1.id],
            posts: {
                post2,
                post1,
            },
            prev_post_id: '',
            next_post_id: 'post3',
        };

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        const result = await store.dispatch(Actions.getPostsBefore(channelId, 'post3', 0, 10));

        expect(result).toEqual({data: postList});

        const state = store.getState();

        expect(state.entities.posts.posts).toEqual({post1, post2, post3});
        expect(state.entities.posts.postsInChannel.channel1).toEqual([
            {order: ['post3', 'post2', 'post1'], recent: false, oldest: true},
        ]);
        expect(state.entities.posts.postsInThread).toEqual({
            post1: ['post2'],
        });
    });

    it('getPostsAfter', async () => {
        const channelId = 'channel1';

        const post1 = {id: 'post1', channel_id: channelId, create_at: 1001, message: ''};
        const post2 = {id: 'post2', channel_id: channelId, root_id: 'post1', create_at: 1002, message: '', user_id: 'user1'};
        const post3 = {id: 'post3', channel_id: channelId, create_at: 1003, message: ''};

        store = await configureStore({
            entities: {
                posts: {
                    posts: {
                        post1,
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post1'], recent: false},
                        ],
                    },
                },
            },
        });

        const postList = {
            order: [post3.id, post2.id],
            posts: {
                post2,
                post3,
            },
        };

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        const result = await store.dispatch(Actions.getPostsAfter(channelId, 'post1', 0, 10));

        expect(result).toEqual({data: postList});

        const state = store.getState();

        expect(state.entities.posts.posts).toEqual({
            post1: {...post1, participants: [{id: 'user1'}]},
            post2,
            post3,
        });
        expect(state.entities.posts.postsInChannel.channel1).toEqual([
            {order: ['post3', 'post2', 'post1'], recent: false},
        ]);
        expect(state.entities.posts.postsInThread).toEqual({
            post1: ['post2'],
        });
    });

    it('getPostsAfter with empty next_post_id', async () => {
        const channelId = 'channel1';

        const post1 = {id: 'post1', channel_id: channelId, create_at: 1001, message: ''};
        const post2 = {id: 'post2', channel_id: channelId, root_id: 'post1', create_at: 1002, message: '', user_id: 'user1'};
        const post3 = {id: 'post3', channel_id: channelId, create_at: 1003, message: ''};

        store = await configureStore({
            entities: {
                posts: {
                    posts: {
                        post1,
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post1'], recent: false},
                        ],
                    },
                },
            },
        });

        const postList = {
            order: [post3.id, post2.id],
            posts: {
                post2,
                post3,
            },
            next_post_id: '',
        };

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        const result = await store.dispatch(Actions.getPostsAfter(channelId, 'post1', 0, 10));

        expect(result).toEqual({data: postList});

        const state = store.getState();

        expect(state.entities.posts.posts).toEqual({
            post1: {...post1, participants: [{id: 'user1'}]},
            post2,
            post3,
        });
        expect(state.entities.posts.postsInChannel.channel1).toEqual([
            {order: ['post3', 'post2', 'post1'], recent: true},
        ]);
    });

    it('getPostsAround', async () => {
        const postId = 'post3';
        const channelId = 'channel1';

        const postsAfter = {
            posts: {
                post1: {id: 'post1', create_at: 10002, message: ''},
                post2: {id: 'post2', create_at: 10001, message: ''},
            },
            order: ['post1', 'post2'],
            next_post_id: 'post0',
            before_post_id: 'post3',
        };
        const postsThread = {
            posts: {
                root: {id: 'root', create_at: 10010, message: ''},
                post3: {id: 'post3', root_id: 'root', create_at: 10000, message: ''},
            },
            order: ['post3'],
            next_post_id: 'post2',
            before_post_id: 'post5',
        };
        const postsBefore = {
            posts: {
                post4: {id: 'post4', create_at: 9999, message: ''},
                post5: {id: 'post5', create_at: 9998, message: ''},
            },
            order: ['post4', 'post5'],
            next_post_id: 'post3',
            before_post_id: 'post6',
        };

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query((params) => Boolean(params.after)).
            reply(200, postsAfter);
        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query((params) => Boolean(params.before)).
            reply(200, postsBefore);
        nock(Client4.getBaseRoute()).
            get(`/posts/${postId}/thread`).
            query(true).
            reply(200, postsThread);

        const result = await store.dispatch(Actions.getPostsAround(channelId, postId));

        expect(result.error).toBeFalsy();
        expect(result.data).toEqual({
            posts: {
                ...postsAfter.posts,
                ...postsThread.posts,
                ...postsBefore.posts,
            },
            order: [
                ...postsAfter.order,
                postId,
                ...postsBefore.order,
            ],
            next_post_id: postsAfter.next_post_id,
            prev_post_id: postsBefore.prev_post_id,
        });

        const {posts, postsInChannel, postsInThread} = store.getState().entities.posts;

        // should store all of the posts
        expect(posts).toHaveProperty('post1');
        expect(posts).toHaveProperty('post2');
        expect(posts).toHaveProperty('post3');
        expect(posts).toHaveProperty('post4');
        expect(posts).toHaveProperty('post5');
        expect(posts).toHaveProperty('root');

        // should only store the posts that we know the order of
        expect(postsInChannel[channelId]).toEqual([{order: ['post1', 'post2', 'post3', 'post4', 'post5'], recent: false, oldest: false}]);

        // should populate postsInThread
        expect(postsInThread.root).toEqual(['post3']);
    });

    it('flagPost', async () => {
        const {dispatch, getState} = store;
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getUsersRoute()).
            post('/logout').
            reply(200, OK_RESPONSE);
        await TestHelper.basicClient4.logout();

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId),
        );

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);

        Actions.flagPost(post1.id)(dispatch, getState);
        const state = getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, post1.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);
    });

    it('unflagPost', async () => {
        const {dispatch, getState} = store;
        const channelId = TestHelper.basicChannel.id;
        nock(Client4.getUsersRoute()).
            post('/logout').
            reply(200, OK_RESPONSE);
        await TestHelper.basicClient4.logout();

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId),
        );

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        Actions.flagPost(post1.id)(dispatch, getState);
        let state = getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, post1.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);

        nock(Client4.getUsersRoute()).
            delete(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        Actions.unflagPost(post1.id)(dispatch, getState);
        state = getState();
        const unflagged = state.entities.preferences.myPreferences[prefKey];
        assert.ifError(unflagged);
    });

    it('setUnreadPost', async () => {
        const teamId = TestHelper.generateId();
        const channelId = TestHelper.generateId();
        const userId = TestHelper.generateId();
        const postId = TestHelper.generateId();

        store = await configureStore({
            entities: {
                channels: {
                    channels: {
                        [channelId]: {team_id: teamId, total_msg_count: 10},
                    },
                    myMembers: {
                        [channelId]: {msg_count: 10, mention_count: 0, last_viewed_at: 0},
                    },
                },
                teams: {
                    myMembers: {
                        [teamId]: {msg_count: 15, mention_count: 0},
                    },
                },
                users: {
                    currentUserId: userId,
                },
                posts: {
                    posts: {
                        [postId]: {id: postId, msg: 'test message', create_at: 123, delete_at: 0, channel_id: channelId},
                    },
                },
            },
        });

        nock(Client4.getUserRoute(userId)).post(`/posts/${postId}/set_unread`).reply(200, {
            team_id: teamId,
            channel_id: channelId,
            msg_count: 3,
            last_viewed_at: 1565605543,
            mention_count: 1,
        });

        await store.dispatch(Actions.setUnreadPost(userId, postId));
        const state = store.getState();

        assert.equal(state.entities.channels.channels[channelId].total_msg_count, 10);
        assert.equal(state.entities.channels.myMembers[channelId].msg_count, 3);
        assert.equal(state.entities.channels.myMembers[channelId].mention_count, 1);
        assert.equal(state.entities.channels.myMembers[channelId].last_viewed_at, 1565605543);
        assert.equal(state.entities.teams.myMembers[teamId].msg_count, 8);
        assert.equal(state.entities.teams.myMembers[teamId].mention_count, 1);
    });

    it('pinPost', async () => {
        const {dispatch, getState} = store;

        nock(Client4.getBaseRoute()).
            get(`/channels/${TestHelper.basicChannel.id}/stats`).
            reply(200, {channel_id: TestHelper.basicChannel.id, member_count: 1, pinnedpost_count: 0});

        await dispatch(getChannelStats(TestHelper.basicChannel.id));

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id),
        );

        const postList = {order: [post1.id], posts: {}};
        postList.posts[post1.id] = post1;

        nock(Client4.getBaseRoute()).
            get(`/posts/${post1.id}/thread?skipFetchThreads=false&collapsedThreads=false&collapsedThreadsExtended=false`).
            reply(200, postList);
        await Actions.getPostThread(post1.id)(dispatch, getState);

        nock(Client4.getBaseRoute()).
            post(`/posts/${post1.id}/pin`).
            reply(200, OK_RESPONSE);
        await Actions.pinPost(post1.id)(dispatch, getState);

        const state = getState();
        const {stats} = state.entities.channels;
        const post = state.entities.posts.posts[post1.id];
        const pinnedPostCount = stats[TestHelper.basicChannel.id].pinnedpost_count;

        assert.ok(post);
        assert.ok(post.is_pinned === true);
        assert.ok(pinnedPostCount === 1);
    });

    it('unpinPost', async () => {
        const {dispatch, getState} = store;

        nock(Client4.getBaseRoute()).
            get(`/channels/${TestHelper.basicChannel.id}/stats`).
            reply(200, {channel_id: TestHelper.basicChannel.id, member_count: 1, pinnedpost_count: 0});

        await dispatch(getChannelStats(TestHelper.basicChannel.id));

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id),
        );

        const postList = {order: [post1.id], posts: {}};
        postList.posts[post1.id] = post1;

        nock(Client4.getBaseRoute()).
            get(`/posts/${post1.id}/thread?skipFetchThreads=false&collapsedThreads=false&collapsedThreadsExtended=false`).
            reply(200, postList);
        await Actions.getPostThread(post1.id)(dispatch, getState);

        nock(Client4.getBaseRoute()).
            post(`/posts/${post1.id}/pin`).
            reply(200, OK_RESPONSE);
        await Actions.pinPost(post1.id)(dispatch, getState);

        nock(Client4.getBaseRoute()).
            post(`/posts/${post1.id}/unpin`).
            reply(200, OK_RESPONSE);
        await Actions.unpinPost(post1.id)(dispatch, getState);

        const state = getState();
        const {stats} = state.entities.channels;
        const post = state.entities.posts.posts[post1.id];
        const pinnedPostCount = stats[TestHelper.basicChannel.id].pinnedpost_count;

        assert.ok(post);
        assert.ok(post.is_pinned === false);
        assert.ok(pinnedPostCount === 0);
    });

    it('addReaction', async () => {
        const {dispatch, getState} = store;

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id),
        );

        const emojiName = '+1';

        nock(Client4.getBaseRoute()).
            post('/reactions').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];
        assert.ok(reactions);
        assert.ok(reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('removeReaction', async () => {
        const {dispatch, getState} = store;

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id),
        );

        const emojiName = '+1';

        nock(Client4.getBaseRoute()).
            post('/reactions').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        nock(Client4.getUsersRoute()).
            delete(`/${TestHelper.basicUser.id}/posts/${post1.id}/reactions/${emojiName}`).
            reply(200, OK_RESPONSE);
        await Actions.removeReaction(post1.id, emojiName)(dispatch, getState);

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];
        assert.ok(reactions);
        assert.ok(!reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('getReactionsForPost', async () => {
        const {dispatch, getState} = store;

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id),
        );

        const emojiName = '+1';

        nock(Client4.getBaseRoute()).
            post('/reactions').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        dispatch({
            type: PostTypes.REACTION_DELETED,
            data: {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName},
        });

        nock(Client4.getBaseRoute()).
            get(`/posts/${post1.id}/reactions`).
            reply(200, [{user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721}]);
        await Actions.getReactionsForPost(post1.id)(dispatch, getState);

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];

        assert.ok(reactions);
        assert.ok(reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('getCustomEmojiForReaction', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');
        const {dispatch, getState} = store;

        nock(Client4.getBaseRoute()).
            post('/emoji').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData,
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get(`/name/${created.name}`).
            reply(200, created);

        const missingEmojiName = ':notrealemoji:';

        nock(Client4.getEmojisRoute()).
            get(`/name/${missingEmojiName}`).
            reply(404, {message: 'Not found', status_code: 404});

        await Actions.getCustomEmojiForReaction(missingEmojiName)(dispatch, getState);

        const state = getState();
        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);
        assert.ok(state.entities.emojis.nonExistentEmoji.has(missingEmojiName));
    });

    it('getOpenGraphMetadata', async () => {
        const {dispatch, getState} = store;

        const url = 'https://about.mattermost.com';
        const docs = 'https://docs.mattermost.com/';

        nock(Client4.getBaseRoute()).
            post('/opengraph').
            reply(200, {type: 'article', url: 'https://about.mattermost.com/', title: 'Mattermost private cloud messaging', description: 'Open source,  private cloud\nSlack-alternative, \nWorkplace messaging for web, PCs and phones.'});
        await dispatch(Actions.getOpenGraphMetadata(url));

        nock(Client4.getBaseRoute()).
            post('/opengraph').
            reply(200, {type: '', url: '', title: '', description: ''});
        await dispatch(Actions.getOpenGraphMetadata(docs));

        nock(Client4.getBaseRoute()).
            post('/opengraph').
            reply(200, null);
        await dispatch(Actions.getOpenGraphMetadata(docs));

        const state = getState();
        const metadata = state.entities.posts.openGraph;
        assert.ok(metadata);
        assert.ok(metadata[url]);
        assert.ifError(metadata[docs]);
    });

    it('doPostAction', async () => {
        nock(Client4.getBaseRoute()).
            post('/posts/posth67ja7ntdkek6g13dp3wka/actions/action7ja7ntdkek6g13dp3wka').
            reply(200, {});

        const {data} = await Actions.doPostAction('posth67ja7ntdkek6g13dp3wka', 'action7ja7ntdkek6g13dp3wka', 'option')(store.dispatch, store.getState);
        assert.deepEqual(data, {});
    });

    it('doPostActionWithCookie', async () => {
        nock(Client4.getBaseRoute()).
            post('/posts/posth67ja7ntdkek6g13dp3wka/actions/action7ja7ntdkek6g13dp3wka').
            reply(200, {});

        const {data} = await Actions.doPostActionWithCookie('posth67ja7ntdkek6g13dp3wka', 'action7ja7ntdkek6g13dp3wka', '', 'option')(store.dispatch, store.getState);
        assert.deepEqual(data, {});
    });

    it('addMessageIntoHistory', async () => {
        const {dispatch, getState} = store;

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);

        let history = getState().entities.posts.messagesHistory.messages;
        assert.ok(history.length === 1);
        assert.ok(history[0] === 'test1');

        await Actions.addMessageIntoHistory('test2')(dispatch, getState);

        history = getState().entities.posts.messagesHistory.messages;
        assert.ok(history.length === 2);
        assert.ok(history[1] === 'test2');

        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        history = getState().entities.posts.messagesHistory.messages;
        assert.ok(history.length === 3);
        assert.ok(history[2] === 'test3');
    });

    it('resetHistoryIndex', async () => {
        const {dispatch, getState} = store;

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);
        await Actions.addMessageIntoHistory('test2')(dispatch, getState);
        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        let index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 1);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);

        await Actions.resetHistoryIndex(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);

        await Actions.resetHistoryIndex(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);
    });

    it('moveHistoryIndexBack', async () => {
        const {dispatch, getState} = store;

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        let index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === -1);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === -1);

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);
        await Actions.addMessageIntoHistory('test2')(dispatch, getState);
        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 1);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);
    });

    it('moveHistoryIndexForward', async () => {
        const {dispatch, getState} = store;

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        let index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);
        await Actions.addMessageIntoHistory('test2')(dispatch, getState);
        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 1);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 1);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 2);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 1);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 2);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);
    });

    describe('getProfilesAndStatusesForPosts', () => {
        describe('different values for posts argument', () => {
            // Mock the state to prevent any followup requests since we aren't testing those
            const currentUserId = 'user';
            const post = {id: 'post', user_id: currentUserId, message: 'This is a post'};

            const dispatch = null;
            const getState = () => ({
                entities: {
                    general: {
                        config: {
                            EnableCustomEmoji: 'false',
                        },
                    },
                    users: {
                        currentUserId,
                        statuses: {
                            [currentUserId]: 'status',
                        },
                    },
                },
            });

            it('null', async () => {
                await Actions.getProfilesAndStatusesForPosts(null, dispatch, getState);
            });

            it('array of posts', async () => {
                const posts = [post];

                await Actions.getProfilesAndStatusesForPosts(posts, dispatch, getState);
            });

            it('object map of posts', async () => {
                const posts = {
                    [post.id]: post,
                };

                await Actions.getProfilesAndStatusesForPosts(posts, dispatch, getState);
            });
        });
    });

    describe('getThreadsForPosts', () => {
        beforeAll(async () => {
            await TestHelper.initBasic(Client4);
        });

        afterAll(async () => {
            await TestHelper.tearDown();
        });

        let channelId;
        let post1;
        let post2;
        let post3;
        let comment;

        beforeEach(async () => {
            store = await configureStore();

            channelId = TestHelper.basicChannel.id;
            post1 = {id: TestHelper.generateId(), channel_id: channelId, message: ''};
            post2 = {id: TestHelper.generateId(), channel_id: channelId, message: ''};
            comment = {id: TestHelper.generateId(), root_id: post1.id, channel_id: channelId, message: ''};
            post3 = {id: TestHelper.generateId(), channel_id: channelId, message: ''};

            store.dispatch(Actions.receivedPostsInChannel({
                order: [post2.id, post3.id],
                posts: {[post2.id]: post2, [post3.id]: post3},
            }, channelId));

            const threadList = {
                order: [post1.id],
                posts: {
                    [post1.id]: post1,
                    [comment.id]: comment,
                },
            };

            nock(Client4.getBaseRoute()).
                get(`/posts/${post1.id}/thread?skipFetchThreads=false&collapsedThreads=false&collapsedThreadsExtended=false`).
                reply(200, threadList);
        });

        it('handlesNull', async () => {
            const ret = await store.dispatch(Actions.getThreadsForPosts(null));
            expect(ret).toEqual({data: true});

            const state = store.getState();

            const getRequest = state.requests.posts.getPostThread;
            if (getRequest.status === RequestStatus.FAILURE) {
                throw new Error(JSON.stringify(getRequest.error));
            }

            const {
                postsInChannel,
                postsInThread,
            } = state.entities.posts;

            assert.ok(postsInChannel[channelId]);
            assert.deepEqual(postsInChannel[channelId][0].order, [post2.id, post3.id]);
            assert.ok(!postsInThread[post1.id]);

            const found = postsInChannel[channelId].find((block) => block.order.indexOf(comment.id) !== -1);
            assert.ok(!found, 'should not have found comment in postsInChannel');
        });

        it('pullsUpTheThreadOfAMissingPost', async () => {
            await store.dispatch(Actions.getThreadsForPosts([comment]));

            const state = store.getState();

            const getRequest = state.requests.posts.getPostThread;
            if (getRequest.status === RequestStatus.FAILURE) {
                throw new Error(JSON.stringify(getRequest.error));
            }

            const {
                posts,
                postsInChannel,
                postsInThread,
            } = state.entities.posts;

            assert.ok(posts);
            assert.deepEqual(postsInChannel[channelId][0].order, [post2.id, post3.id]);
            assert.ok(posts[post1.id]);
            assert.ok(postsInThread[post1.id]);
            assert.deepEqual(postsInThread[post1.id], [comment.id]);

            const found = postsInChannel[channelId].find((block) => block.order.indexOf(comment.id) !== -1);
            assert.ok(!found, 'should not have found comment in postsInChannel');
        });
    });

    describe('receivedPostsBefore', () => {
        it('Should return default false for oldest key if param does not exist', () => {
            const posts = [];
            const result = Actions.receivedPostsBefore(posts, 'channelId', 'beforePostId');
            assert.deepEqual(result, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channelId',
                data: posts,
                beforePostId: 'beforePostId',
                oldest: false,
            });
        });

        it('Should return true for oldest key', () => {
            const posts = [];
            const result = Actions.receivedPostsBefore(posts, 'channelId', 'beforePostId', true);
            assert.deepEqual(result, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channelId',
                data: posts,
                beforePostId: 'beforePostId',
                oldest: true,
            });
        });
    });

    describe('receivedPostsInChannel', () => {
        it('Should return default false for both recent and oldest keys if params dont exist', () => {
            const posts = [];
            const result = Actions.receivedPostsInChannel(posts, 'channelId');
            assert.deepEqual(result, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channelId',
                data: posts,
                recent: false,
                oldest: false,
            });
        });

        it('Should return true for oldest and recent keys', () => {
            const posts = [];
            const result = Actions.receivedPostsInChannel(posts, 'channelId', true, true);
            assert.deepEqual(result, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channelId',
                data: posts,
                recent: true,
                oldest: true,
            });
        });
    });

    describe('lastPostActions', () => {
        test('should mark channel as read when viewing channel', async () => {
            const channelId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        currentChannelId: channelId,
                        myMembers: {
                            [channelId]: {channel_id: channelId, last_viewed_at: 0, roles: ''},
                        },
                    },
                },
            });

            const post1 = {channel_id: channelId, create_at: 1000};
            await store.dispatch(Actions.receivedPost(post1));

            const post2 = {channel_id: channelId, create_at: 2000};
            await store.dispatch(Actions.lastPostActions(post2, {}));

            expect(store.getState().entities.channels.myMembers[channelId].last_viewed_at).toBeGreaterThan(post2.create_at);
        });

        test('should not mark channel as read when not viewing channel', async () => {
            const channelId = TestHelper.generateId();
            const otherChannelId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        currentChannelId: otherChannelId,
                        myMembers: {
                            [channelId]: {channel_id: channelId, last_viewed_at: 500, roles: ''},
                            [otherChannelId]: {channel_id: otherChannelId, last_viewed_at: 500, roles: ''},
                        },
                    },
                },
            });

            const post1 = {channel_id: channelId, create_at: 1000};
            await store.dispatch(Actions.receivedPost(post1));

            const post2 = {channel_id: channelId, create_at: 2000};
            await store.dispatch(Actions.lastPostActions(post2, {}));

            expect(store.getState().entities.channels.myMembers[channelId].last_viewed_at).toBe(500);
        });

        test('should mark channel as read when not viewing channel and post is from current user', async () => {
            const channelId = TestHelper.generateId();
            const otherChannelId = TestHelper.generateId();
            const currentUserId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        currentChannelId: otherChannelId,
                        myMembers: {
                            [channelId]: {channel_id: channelId, last_viewed_at: 500, roles: ''},
                            [otherChannelId]: {channel_id: otherChannelId, last_viewed_at: 500, roles: ''},
                        },
                    },
                    users: {
                        currentUserId,
                    },
                },
            });

            const post1 = {channel_id: channelId, create_at: 1000};
            await store.dispatch(Actions.receivedPost(post1));

            const post2 = {channel_id: channelId, create_at: 2000, user_id: currentUserId};
            await store.dispatch(Actions.lastPostActions(post2, {}));

            expect(store.getState().entities.channels.myMembers[channelId].last_viewed_at).toBeGreaterThan(post2.create_at);
        });

        test('should mark channel as unread when not viewing channel and post is from webhook owned by current user', async () => {
            const channelId = TestHelper.generateId();
            const otherChannelId = TestHelper.generateId();
            const currentUserId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        currentChannelId: otherChannelId,
                        myMembers: {
                            [channelId]: {channel_id: channelId, last_viewed_at: 500, roles: ''},
                            [otherChannelId]: {channel_id: otherChannelId, last_viewed_at: 500, roles: ''},
                        },
                    },
                    users: {
                        currentUserId,
                    },
                },
            });

            const post1 = {channel_id: channelId, create_at: 1000};
            await store.dispatch(Actions.receivedPost(post1));

            const post2 = {channel_id: channelId, create_at: 2000, props: {from_webhook: 'true'}, user_id: currentUserId};
            await store.dispatch(Actions.lastPostActions(post2, {}));

            expect(store.getState().entities.channels.myMembers[channelId].last_viewed_at).toBe(500);
        });

        test('should not mark channel as read when viewing channel that was marked as unread', async () => {
            const channelId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        currentChannelId: channelId,
                        myMembers: {
                            [channelId]: {channel_id: channelId, last_viewed_at: 500, roles: ''},
                        },
                        manuallyUnread: {
                            [channelId]: true,
                        },
                    },
                },
            });

            const post1 = {id: 'post1', channel_id: channelId, create_at: 1000};
            await store.dispatch(Actions.receivedPost(post1));

            await store.dispatch({
                type: ChannelTypes.POST_UNREAD_SUCCESS,
                data: {
                    channelId,
                    lastViewedAt: post1.create_at - 1,
                },
            });

            const post2 = {channel_id: channelId, create_at: 2000};
            await store.dispatch(Actions.lastPostActions(post2, {}));

            expect(store.getState().entities.channels.myMembers[channelId].last_viewed_at).toBe(post1.create_at - 1);
        });
    });
});
