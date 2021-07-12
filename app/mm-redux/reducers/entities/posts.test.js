// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import expect from 'expect';

import {
    ChannelTypes,
    GeneralTypes,
    PostTypes,
} from '@mm-redux/action_types';
import * as reducers from '@mm-redux/reducers/entities/posts';
import deepFreeze from '@mm-redux/utils/deep_freeze';

import {Posts} from '../../constants';

describe('posts', () => {
    for (const actionType of [
        PostTypes.RECEIVED_POST,
        PostTypes.RECEIVED_NEW_POST,
    ]) {
        describe(`received a single post (${actionType})`, () => {
            it('should add a new post', () => {
                const state = deepFreeze({
                    post1: {id: 'post1'},
                });

                const nextState = reducers.handlePosts(state, {
                    type: actionType,
                    data: {id: 'post2'},
                });

                expect(nextState).not.toBe(state);
                expect(nextState.post1).toBe(state.post1);
                expect(nextState).toEqual({
                    post1: {id: 'post1'},
                    post2: {id: 'post2'},
                });
            });

            it('should add a new pending post', () => {
                const state = deepFreeze({
                    post1: {id: 'post1'},
                });

                const nextState = reducers.handlePosts(state, {
                    type: actionType,
                    data: {id: 'post2', pending_post_id: 'post2'},
                });

                expect(nextState).not.toBe(state);
                expect(nextState.post1).toBe(state.post1);
                expect(nextState).toEqual({
                    post1: {id: 'post1'},
                    post2: {id: 'post2', pending_post_id: 'post2'},
                });
            });

            it('should update an existing post', () => {
                const state = deepFreeze({
                    post1: {id: 'post1', message: '123'},
                });

                const nextState = reducers.handlePosts(state, {
                    type: actionType,
                    data: {id: 'post1', message: 'abc'},
                });

                expect(nextState).not.toBe(state);
                expect(nextState.post1).not.toBe(state.post1);
                expect(nextState).toEqual({
                    post1: {id: 'post1', message: 'abc'},
                });
            });

            it('should remove any pending posts when receiving the actual post', () => {
                const state = deepFreeze({
                    pending: {id: 'pending'},
                });

                const nextState = reducers.handlePosts(state, {
                    type: actionType,
                    data: {id: 'post1', pending_post_id: 'pending'},
                });

                expect(nextState).not.toBe(state);
                expect(nextState).toEqual({
                    post1: {id: 'post1', pending_post_id: 'pending'},
                });
            });
        });
    }

    describe('received multiple posts', () => {
        it('should do nothing when post list is empty', () => {
            const state = deepFreeze({
                post1: {id: 'post1'},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: [],
                    posts: {},
                },
            });

            expect(nextState).toBe(state);
        });

        it('should add new posts', () => {
            const state = deepFreeze({
                post1: {id: 'post1'},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: ['post2', 'post3'],
                    posts: {
                        post2: {id: 'post2'},
                        post3: {id: 'post3'},
                    },
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.post1).toBe(state.post1);
            expect(nextState).toEqual({
                post1: {id: 'post1'},
                post2: {id: 'post2'},
                post3: {id: 'post3'},
            });
        });

        it('should update existing posts unless we have a more recent version', () => {
            const state = deepFreeze({
                post1: {id: 'post1', message: '123', update_at: 1000},
                post2: {id: 'post2', message: '456', update_at: 1000},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: ['post1', 'post2'],
                    posts: {
                        post1: {id: 'post1', message: 'abc', update_at: 2000},
                        post2: {id: 'post2', message: 'def', update_at: 500},
                    },
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.post1).not.toBe(state.post1);
            expect(nextState.post2).toBe(state.post2);
            expect(nextState).toEqual({
                post1: {id: 'post1', message: 'abc', update_at: 2000},
                post2: {id: 'post2', message: '456', update_at: 1000},
            });
        });

        it('should set state for deleted posts', () => {
            const state = deepFreeze({
                post1: {id: 'post1', message: '123', delete_at: 0, file_ids: ['file']},
                post2: {id: 'post2', message: '456', delete_at: 0, has_reactions: true},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: ['post1', 'post2'],
                    posts: {
                        post1: {id: 'post1', message: '123', delete_at: 2000, file_ids: ['file']},
                        post2: {id: 'post2', message: '456', delete_at: 500, has_reactions: true},
                    },
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.post1).not.toBe(state.post1);
            expect(nextState.post2).not.toBe(state.post2);
            expect(nextState).toEqual({
                post1: {id: 'post1', message: '123', delete_at: 2000, file_ids: [], has_reactions: false, state: Posts.POST_DELETED},
                post2: {id: 'post2', message: '456', delete_at: 500, file_ids: [], has_reactions: false, state: Posts.POST_DELETED},
            });
        });

        it('should remove any pending posts when receiving the actual post', () => {
            const state = deepFreeze({
                pending1: {id: 'pending1'},
                pending2: {id: 'pending2'},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: ['post1', 'post2'],
                    posts: {
                        post1: {id: 'post1', pending_post_id: 'pending1'},
                        post2: {id: 'post2', pending_post_id: 'pending2'},
                    },
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                post1: {id: 'post1', pending_post_id: 'pending1'},
                post2: {id: 'post2', pending_post_id: 'pending2'},
            });
        });

        it('should not add channelId entity to postsInChannel if there were no posts in channel and it has receivedNewPosts on action', () => {
            const state = deepFreeze({
                posts: {},
                postsInChannel: {},
            });
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: ['postId'],
                    posts: {
                        postId: {
                            id: 'postId',
                        },
                    },
                },
                channelId: 'channelId',
                receivedNewPosts: true,
            };

            const nextState = reducers.handlePosts(state, action);

            assert.deepEqual(nextState.postsInChannel, {});
        });
    });

    describe(`deleting a post (${PostTypes.POST_DELETED})`, () => {
        it('should mark the post as deleted and remove the rest of the thread', () => {
            const state = deepFreeze({
                post1: {id: 'post1', file_ids: ['file'], has_reactions: true},
                comment1: {id: 'comment1', root_id: 'post1'},
                comment2: {id: 'comment2', root_id: 'post1'},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.POST_DELETED,
                data: {id: 'post1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState.post1).not.toBe(state.post1);
            expect(nextState).toEqual({
                post1: {id: 'post1', file_ids: [], has_reactions: false, state: Posts.POST_DELETED},
            });
        });

        it('should not remove the rest of the thread when deleting a comment', () => {
            const state = deepFreeze({
                post1: {id: 'post1'},
                comment1: {id: 'comment1', root_id: 'post1'},
                comment2: {id: 'comment2', root_id: 'post1'},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.POST_DELETED,
                data: {id: 'comment1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState.post1).toBe(state.post1);
            expect(nextState.comment1).not.toBe(state.comment1);
            expect(nextState.comment2).toBe(state.comment2);
            expect(nextState).toEqual({
                post1: {id: 'post1'},
                comment1: {id: 'comment1', root_id: 'post1', file_ids: [], has_reactions: false, state: Posts.POST_DELETED},
                comment2: {id: 'comment2', root_id: 'post1'},
            });
        });

        it('should do nothing if the post is not loaded', () => {
            const state = deepFreeze({
                post1: {id: 'post1', file_ids: ['file'], has_reactions: true},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.POST_DELETED,
                data: {id: 'post2'},
            });

            expect(nextState).toBe(state);
            expect(nextState.post1).toBe(state.post1);
        });
    });

    describe(`removing a post (${PostTypes.POST_REMOVED})`, () => {
        it('should remove the post and the rest and the rest of the thread', () => {
            const state = deepFreeze({
                post1: {id: 'post1', file_ids: ['file'], has_reactions: true},
                comment1: {id: 'comment1', root_id: 'post1'},
                comment2: {id: 'comment2', root_id: 'post1'},
                post2: {id: 'post2'},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.POST_REMOVED,
                data: {id: 'post1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState.post2).toBe(state.post2);
            expect(nextState).toEqual({
                post2: {id: 'post2'},
            });
        });

        it('should not remove the rest of the thread when removing a comment', () => {
            const state = deepFreeze({
                post1: {id: 'post1'},
                comment1: {id: 'comment1', root_id: 'post1'},
                comment2: {id: 'comment2', root_id: 'post1'},
                post2: {id: 'post2'},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.POST_REMOVED,
                data: {id: 'comment1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState.post1).toBe(state.post1);
            expect(nextState.comment1).not.toBe(state.comment1);
            expect(nextState.comment2).toBe(state.comment2);
            expect(nextState).toEqual({
                post1: {id: 'post1'},
                comment2: {id: 'comment2', root_id: 'post1'},
                post2: {id: 'post2'},
            });
        });

        it('should do nothing if the post is not loaded', () => {
            const state = deepFreeze({
                post1: {id: 'post1', file_ids: ['file'], has_reactions: true},
            });

            const nextState = reducers.handlePosts(state, {
                type: PostTypes.POST_REMOVED,
                data: {id: 'post2'},
            });

            expect(nextState).toBe(state);
            expect(nextState.post1).toBe(state.post1);
        });
    });

    for (const actionType of [
        ChannelTypes.RECEIVED_CHANNEL_DELETED,
        ChannelTypes.DELETE_CHANNEL_SUCCESS,
        ChannelTypes.LEAVE_CHANNEL,
    ]) {
        describe(`when a channel is deleted (${actionType})`, () => {
            it('should remove any posts in that channel', () => {
                const state = deepFreeze({
                    post1: {id: 'post1', channel_id: 'channel1'},
                    post2: {id: 'post2', channel_id: 'channel1'},
                    post3: {id: 'post3', channel_id: 'channel2'},
                });

                const nextState = reducers.handlePosts(state, {
                    type: actionType,
                    data: {
                        id: 'channel1',
                        viewArchivedChannels: false,
                    },
                });

                expect(nextState).not.toBe(state);
                expect(nextState.post3).toBe(state.post3);
                expect(nextState).toEqual({
                    post3: {id: 'post3', channel_id: 'channel2'},
                });
            });

            it('should do nothing if no posts in that channel are loaded', () => {
                const state = deepFreeze({
                    post1: {id: 'post1', channel_id: 'channel1'},
                    post2: {id: 'post2', channel_id: 'channel1'},
                    post3: {id: 'post3', channel_id: 'channel2'},
                });

                const nextState = reducers.handlePosts(state, {
                    type: actionType,
                    data: {
                        id: 'channel3',
                        viewArchivedChannels: false,
                    },
                });

                expect(nextState).toBe(state);
                expect(nextState.post1).toBe(state.post1);
                expect(nextState.post2).toBe(state.post2);
                expect(nextState.post3).toBe(state.post3);
            });

            it('should not remove any posts with viewArchivedChannels enabled', () => {
                const state = deepFreeze({
                    post1: {id: 'post1', channel_id: 'channel1'},
                    post2: {id: 'post2', channel_id: 'channel1'},
                    post3: {id: 'post3', channel_id: 'channel2'},
                });

                const nextState = reducers.handlePosts(state, {
                    type: actionType,
                    data: {
                        id: 'channel1',
                        viewArchivedChannels: true,
                    },
                });

                expect(nextState).toBe(state);
                expect(nextState.post1).toBe(state.post1);
                expect(nextState.post2).toBe(state.post2);
                expect(nextState.post3).toBe(state.post3);
            });
        });
    }
});

describe('pendingPostIds', () => {
    describe('making a new pending post', () => {
        it('should add new entries for pending posts', () => {
            const state = deepFreeze(['1234']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    pending_post_id: 'abcd',
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual(['1234', 'abcd']);
        });

        it('should not add duplicate entries', () => {
            const state = deepFreeze(['1234']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    pending_post_id: '1234',
                },
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual(['1234']);
        });

        it('should do nothing for regular posts', () => {
            const state = deepFreeze(['1234']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    id: 'abcd',
                },
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual(['1234']);
        });
    });

    describe('removing a pending post', () => {
        it('should remove an entry when its post is deleted', () => {
            const state = deepFreeze(['1234', 'abcd']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.POST_REMOVED,
                data: {
                    id: 'abcd',
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual(['1234']);
        });

        it('should do nothing without an entry for the post', () => {
            const state = deepFreeze(['1234', 'abcd']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.POST_REMOVED,
                data: {
                    id: 'wxyz',
                },
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual(['1234', 'abcd']);
        });
    });

    describe('marking a pending post as completed', () => {
        it('should remove an entry when its post is successfully created', () => {
            const state = deepFreeze(['1234', 'abcd']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.RECEIVED_POST,
                data: {
                    id: 'post',
                    pending_post_id: 'abcd',
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual(['1234']);
        });

        it('should do nothing without an entry for the post', () => {
            const state = deepFreeze(['1234', 'abcd']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.RECEIVED_POST,
                data: {
                    id: 'post',
                    pending_post_id: 'wxyz',
                },
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual(['1234', 'abcd']);
        });

        it('should do nothing when receiving a non-pending post', () => {
            const state = deepFreeze(['1234', 'abcd']);

            const nextState = reducers.handlePendingPosts(state, {
                type: PostTypes.RECEIVED_POST,
                data: {
                    id: 'post',
                },
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual(['1234', 'abcd']);
        });
    });
});

describe('postsInChannel', () => {
    describe('receiving a new post', () => {
        it('should do nothing without posts loaded for the channel', () => {
            const state = deepFreeze({});

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {id: 'post1', channel_id: 'channel1'},
            }, {}, {});

            expect(nextState).toBe(state);
            expect(nextState).toEqual({});
        });

        it('should store the new post when the channel is empty', () => {
            const state = deepFreeze({
                channel1: [],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {id: 'post1', channel_id: 'channel1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1'], recent: true},
                ],
            });
        });

        it('should store the new post when the channel has recent posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {id: 'post1', channel_id: 'channel1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should not store the new post when the channel only has older posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: false},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {id: 'post1', channel_id: 'channel1'},
            });

            expect(nextState).toEqual({
                channel1: [
                    {order: ['post2', 'post3'], recent: false}, {order: ['post1'], recent: true},
                ],
            });
        });

        it('should do nothing for a duplicate post', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {id: 'post1', channel_id: 'channel1'},
            });

            expect(nextState).toBe(state);
        });

        it('should remove a previously pending post', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['pending', 'post2', 'post1'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {id: 'post3', channel_id: 'channel1', pending_post_id: 'pending'},
            }, {}, {post1: {create_at: 1}, post2: {create_at: 2}, post3: {create_at: 3}});

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post3', 'post2', 'post1'], recent: true},
                ],
            });
        });

        it('should just add the new post if the pending post was already removed', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {id: 'post3', channel_id: 'channel1', pending_post_id: 'pending'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post3', 'post1', 'post2'], recent: true},
                ],
            });
        });

        it('should not include a previously removed post', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_REMOVED,
                data: {id: 'post1', channel_id: 'channel1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [{
                    order: [],
                    recent: true,
                }],
            });
        });
    });

    describe('receiving a single post', () => {
        it('should replace a previously pending post', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'pending', 'post2'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POST,
                data: {id: 'post3', channel_id: 'channel1', pending_post_id: 'pending'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post3', 'post2'], recent: true},
                ],
            });
        });

        it('should do nothing for a pending post that was already removed', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POST,
                data: {id: 'post3', channel_id: 'channel1', pending_post_id: 'pending'},
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });
        });

        it('should do nothing for a post that was not previously pending', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'pending', 'post2'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POST,
                data: {id: 'post3', channel_id: 'channel1'},
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'pending', 'post2'], recent: true},
                ],
            });
        });

        it('should do nothing for a post without posts loaded for the channel', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POST,
                data: {id: 'post3', channel_id: 'channel2', pending_post_id: 'pending'},
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });
        });
    });

    describe('receiving consecutive recent posts in the channel', () => {
        it('should save posts in the correct order', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post4'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post3: nextPosts.post3,
                    },
                    order: ['post1', 'post3'],
                },
                recent: true,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });

        it('should not save duplicate posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post2: nextPosts.post2,
                        post4: nextPosts.post4,
                    },
                    order: ['post2', 'post4'],
                },
                recent: true,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });

        it('should do nothing when receiving no posts for loaded channel', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
                recent: true,
            }, null, {});

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should make entry for channel with no posts', () => {
            const state = deepFreeze({});

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
                recent: true,
            }, null, {});

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [{
                    order: [],
                    recent: true,
                }],
            });
        });

        it('should not save posts that are not in data.order', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                        post3: nextPosts.post3,
                        post4: nextPosts.post4,
                    },
                    order: ['post1', 'post2'],
                },
                recent: true,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should not save posts in an older block, even if they may be adjacent', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
                recent: true,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                    {order: ['post1', 'post2'], recent: true},
                ],
            });
        });

        it('should not save posts in the recent block even if new posts may be adjacent', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post3', 'post4'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
                recent: true,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                    {order: ['post1', 'post2'], recent: true},
                ],
            });
        });

        it('should add posts to non-recent block if there is overlap', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
                recent: true,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });
    });

    describe('receiving consecutive posts in the channel that are not recent', () => {
        it('should save posts in the correct order', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post4'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post3: nextPosts.post3,
                    },
                    order: ['post1', 'post3'],
                },
                recent: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });
        });

        it('should not save duplicate posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post2: nextPosts.post2,
                        post4: nextPosts.post4,
                    },
                    order: ['post2', 'post4'],
                },
                recent: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });
        });

        it('should do nothing when receiving no posts for loaded channel', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
                recent: false,
            }, null, {});

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should make entry for channel with no posts', () => {
            const state = deepFreeze({});

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
                recent: false,
            }, null, {});

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [{
                    order: [],
                    recent: false,
                }],
            });
        });

        it('should not save posts that are not in data.order', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                        post3: nextPosts.post3,
                        post4: nextPosts.post4,
                    },
                    order: ['post1', 'post2'],
                },
                recent: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should not save posts in another block without overlap', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
                recent: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                    {order: ['post1', 'post2'], recent: false},
                ],
            });
        });

        it('should add posts to recent block if there is overlap', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post2: nextPosts.post2,
                        post3: nextPosts.post3,
                    },
                    order: ['post2', 'post3'],
                },
                recent: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should save with chunk as oldest', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
                channelId: 'channel1',
                data: {
                    posts: {
                        post2: nextPosts.post2,
                        post3: nextPosts.post3,
                    },
                    order: ['post2', 'post3'],
                },
                recent: false,
                oldest: true,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true, oldest: true},
                ],
            });
        });
    });

    describe('receiving posts since', () => {
        it('should save posts in the channel in the correct order', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post3', 'post4'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });

        it('should not save older posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post4: nextPosts.post4,
                    },
                    order: ['post1', 'post4'],
                },
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should save any posts in between', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post4'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
                post5: {id: 'post5', channel_id: 'channel1', create_at: 500},
                post6: {id: 'post6', channel_id: 'channel1', create_at: 300},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                        post3: nextPosts.post5,
                        post4: nextPosts.post4,
                        post5: nextPosts.post5,
                        post6: nextPosts.post6,
                    },
                    order: ['post1', 'post2', 'post3', 'post4', 'post5', 'post6'],
                },
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });

        it('should do nothing if only receiving updated posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post4: nextPosts.post4,
                    },
                    order: ['post1', 'post4'],
                },
            }, null, nextPosts);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });

        it('should not save duplicate posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should do nothing when receiving no posts for loaded channel', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
            }, null, {});

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should do nothing for channel with no posts', () => {
            const state = deepFreeze({});

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
                page: 0,
            }, null, {});

            expect(nextState).toBe(state);
            expect(nextState).toEqual({});
        });

        it('should not save posts that are not in data.order', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post2', 'post3'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post4: nextPosts.post4,
                    },
                    order: ['post1'],
                },
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: true},
                ],
            });
        });

        it('should not save posts in an older block', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
            }, null, nextPosts);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                ],
            });
        });

        it('should always save posts in the recent block', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post3', 'post4'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_SINCE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });
    });

    describe('receiving posts after', () => {
        it('should save posts when channel is not loaded', () => {
            const state = deepFreeze({});

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_AFTER,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
                afterPostId: 'post3',
                recent: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should save posts when channel is empty', () => {
            const state = deepFreeze({
                channel1: [],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_AFTER,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
                afterPostId: 'post3',
                recent: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should add posts to existing block', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_AFTER,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post2: nextPosts.post2,
                    },
                    order: ['post1', 'post2'],
                },
                afterPostId: 'post3',
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });
        });

        it('should merge adjacent posts if we have newer posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post4'], recent: false},
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_AFTER,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post3: nextPosts.post3,
                    },
                    order: ['post2', 'post3'],
                },
                afterPostId: 'post4',
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });

        it('should do nothing when no posts are received', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_AFTER,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
                afterPostId: 'post1',
            }, null, nextPosts);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });
        });
    });

    describe('receiving posts before', () => {
        it('should save posts when channel is not loaded', () => {
            const state = deepFreeze({});

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post2: nextPosts.post2,
                        post3: nextPosts.post3,
                    },
                    order: ['post2', 'post3'],
                },
                beforePostId: 'post1',
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should have oldest set to false', () => {
            const state = deepFreeze({});

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post2: nextPosts.post2,
                        post3: nextPosts.post3,
                    },
                    order: ['post2', 'post3'],
                },
                beforePostId: 'post1',
                oldest: false,
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false, oldest: false},
                ],
            });
        });

        it('should save posts when channel is empty', () => {
            const state = deepFreeze({
                channel1: [],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post2: nextPosts.post2,
                        post3: nextPosts.post3,
                    },
                    order: ['post2', 'post3'],
                },
                beforePostId: 'post1',
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should add posts to existing block', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: false},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post3: nextPosts.post3,
                        post4: nextPosts.post4,
                    },
                    order: ['post3', 'post4'],
                },
                beforePostId: 'post2',
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });
        });

        it('should merge adjacent posts if we have newer posts', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post4'], recent: false},
                    {order: ['post1'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
                post3: {id: 'post3', channel_id: 'channel1', create_at: 2000},
                post4: {id: 'post4', channel_id: 'channel1', create_at: 1000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channel1',
                data: {
                    posts: {
                        post1: nextPosts.post1,
                        post3: nextPosts.post3,
                    },
                    order: ['post2', 'post3', 'post4'],
                },
                beforePostId: 'post1',
            }, null, nextPosts);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: true},
                ],
            });
        });

        it('should do nothing when no posts are received', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });

            const nextPosts = {
                post1: {id: 'post1', channel_id: 'channel1', create_at: 4000},
                post2: {id: 'post2', channel_id: 'channel1', create_at: 3000},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.RECEIVED_POSTS_BEFORE,
                channelId: 'channel1',
                data: {
                    posts: {},
                    order: [],
                },
                beforePostId: 'post2',
            }, null, nextPosts);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2'], recent: true},
                ],
            });
        });
    });

    describe('deleting a post', () => {
        it('should do nothing when deleting a post without comments', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post2,
            }, prevPosts, null);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should remove comments on the post when deleting a post with comments', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1', root_id: 'post4'},
                post2: {id: 'post2', channel_id: 'channel1', root_id: 'post3'},
                post3: {id: 'post3', channel_id: 'channel1'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post3,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post3', 'post4'], recent: false},
                ],
            });
        });

        it('should remove comments from multiple blocks', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: false},
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1', root_id: 'post4'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1', root_id: 'post4'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post4,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post2'], recent: false},
                    {order: ['post4'], recent: false},
                ],
            });
        });

        it('should do nothing to blocks without comments', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: false},
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1', root_id: 'post4'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post4,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState[0]).toBe(state[0]);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2'], recent: false},
                    {order: ['post4'], recent: false},
                ],
            });
        });

        it('should do nothing when deleting a comment', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1', root_id: 'post4'},
                post2: {id: 'post2', channel_id: 'channel1', root_id: 'post3'},
                post3: {id: 'post3', channel_id: 'channel1'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post2,
            }, prevPosts, null);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });
        });

        it('should do nothing if the post has not been loaded', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post4,
            }, prevPosts, null);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should do nothing if no posts in the channel have been loaded', () => {
            const state = deepFreeze({});

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post1,
            }, prevPosts, null);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({});
        });

        it('should remove empty blocks', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: false},
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1', root_id: 'post4'},
                post2: {id: 'post2', channel_id: 'channel1', root_id: 'post4'},
                post3: {id: 'post3', channel_id: 'channel1', root_id: 'post4'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_DELETED,
                data: prevPosts.post4,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post4'], recent: false},
                ],
            });
        });
    });

    describe('removing a post', () => {
        it('should remove the post', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_REMOVED,
                data: prevPosts.post2,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post3'], recent: false},
                ],
            });
        });

        it('should remove comments on the post', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1', root_id: 'post4'},
                post2: {id: 'post2', channel_id: 'channel1', root_id: 'post3'},
                post3: {id: 'post3', channel_id: 'channel1'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_REMOVED,
                data: prevPosts.post3,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post4'], recent: false},
                ],
            });
        });

        it('should remove a comment without removing the root post', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1', root_id: 'post4'},
                post2: {id: 'post2', channel_id: 'channel1', root_id: 'post3'},
                post3: {id: 'post3', channel_id: 'channel1'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_REMOVED,
                data: prevPosts.post2,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post3', 'post4'], recent: false},
                ],
            });
        });

        it('should do nothing if the post has not been loaded', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_REMOVED,
                data: prevPosts.post4,
            }, prevPosts, null);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post1', 'post2', 'post3'], recent: false},
                ],
            });
        });

        it('should do nothing if no posts in the channel have been loaded', () => {
            const state = deepFreeze({});

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_REMOVED,
                data: prevPosts.post1,
            }, prevPosts, null);

            expect(nextState).toBe(state);
            expect(nextState).toEqual({});
        });

        it('should remove empty blocks', () => {
            const state = deepFreeze({
                channel1: [
                    {order: ['post1', 'post2'], recent: false},
                    {order: ['post3', 'post4'], recent: false},
                ],
            });

            const prevPosts = {
                post1: {id: 'post1', channel_id: 'channel1', root_id: 'post4'},
                post2: {id: 'post2', channel_id: 'channel1'},
                post3: {id: 'post3', channel_id: 'channel1', root_id: 'post4'},
                post4: {id: 'post4', channel_id: 'channel1'},
            };

            const nextState = reducers.postsInChannel(state, {
                type: PostTypes.POST_REMOVED,
                data: prevPosts.post4,
            }, prevPosts, null);

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                channel1: [
                    {order: ['post2'], recent: false},
                ],
            });
        });
    });

    for (const actionType of [
        ChannelTypes.RECEIVED_CHANNEL_DELETED,
        ChannelTypes.DELETE_CHANNEL_SUCCESS,
        ChannelTypes.LEAVE_CHANNEL,
    ]) {
        describe(`when a channel is deleted (${actionType})`, () => {
            it('should remove any posts in that channel', () => {
                const state = deepFreeze({
                    channel1: [
                        {order: ['post1', 'post2', 'post3'], recent: false},
                        {order: ['post6', 'post7', 'post8'], recent: false},
                    ],
                    channel2: [
                        {order: ['post4', 'post5'], recent: false},
                    ],
                });

                const nextState = reducers.postsInChannel(state, {
                    type: actionType,
                    data: {
                        id: 'channel1',
                        viewArchivedChannels: false,
                    },
                });

                expect(nextState).not.toBe(state);
                expect(nextState.channel2).toBe(state.channel2);
                expect(nextState).toEqual({
                    channel2: [
                        {order: ['post4', 'post5'], recent: false},
                    ],
                });
            });

            it('should do nothing if no posts in that channel are loaded', () => {
                const state = deepFreeze({
                    channel1: [
                        {order: ['post1', 'post2', 'post3'], recent: false},
                    ],
                    channel2: [
                        {order: ['post4', 'post5'], recent: false},
                    ],
                });

                const nextState = reducers.postsInChannel(state, {
                    type: actionType,
                    data: {
                        id: 'channel3',
                        viewArchivedChannels: false,
                    },
                });

                expect(nextState).toBe(state);
                expect(nextState.channel1).toBe(state.channel1);
                expect(nextState.channel2).toBe(state.channel2);
                expect(nextState).toEqual({
                    channel1: [
                        {order: ['post1', 'post2', 'post3'], recent: false},
                    ],
                    channel2: [
                        {order: ['post4', 'post5'], recent: false},
                    ],
                });
            });

            it('should not remove any posts with viewArchivedChannels enabled', () => {
                const state = deepFreeze({
                    channel1: [
                        {order: ['post1', 'post2', 'post3'], recent: false},
                        {order: ['post6', 'post7', 'post8'], recent: false},
                    ],
                    channel2: [
                        {order: ['post4', 'post5'], recent: false},
                    ],
                });

                const nextState = reducers.postsInChannel(state, {
                    type: actionType,
                    data: {
                        id: 'channel1',
                        viewArchivedChannels: true,
                    },
                });

                expect(nextState).toBe(state);
                expect(nextState.channel1).toBe(state.channel1);
                expect(nextState.channel2).toBe(state.channel2);
                expect(nextState).toEqual({
                    channel1: [
                        {order: ['post1', 'post2', 'post3'], recent: false},
                        {order: ['post6', 'post7', 'post8'], recent: false},
                    ],
                    channel2: [
                        {order: ['post4', 'post5'], recent: false},
                    ],
                });
            });
        });
    }
});

describe('mergePostBlocks', () => {
    it('should do nothing with no blocks', () => {
        const blocks = [];
        const posts = {};

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).toBe(blocks);
    });

    it('should do nothing with only one block', () => {
        const blocks = [
            {order: ['a'], recent: false},
        ];
        const posts = {
            a: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).toBe(blocks);
    });

    it('should do nothing with two separate blocks', () => {
        const blocks = [
            {order: ['a'], recent: false},
            {order: ['b'], recent: false},
        ];
        const posts = {
            a: {create_at: 1000},
            b: {create_at: 1001},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).toBe(blocks);
    });

    it('should merge two blocks containing exactly the same posts', () => {
        const blocks = [
            {order: ['a'], recent: false},
            {order: ['a'], recent: false},
        ];
        const posts = {
            a: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).not.toBe(blocks);
        expect(nextBlocks).toEqual([
            {order: ['a'], recent: false},
        ]);
    });

    it('should merge two blocks containing overlapping posts', () => {
        const blocks = [
            {order: ['a', 'b', 'c'], recent: false},
            {order: ['b', 'c', 'd'], recent: false},
        ];
        const posts = {
            a: {create_at: 1003},
            b: {create_at: 1002},
            c: {create_at: 1001},
            d: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).not.toBe(blocks);
        expect(nextBlocks).toEqual([
            {order: ['a', 'b', 'c', 'd'], recent: false},
        ]);
    });

    it('should merge more than two blocks containing overlapping posts', () => {
        const blocks = [
            {order: ['d', 'e'], recent: false},
            {order: ['a', 'b'], recent: false},
            {order: ['c', 'd'], recent: false},
            {order: ['b', 'c'], recent: false},
        ];
        const posts = {
            a: {create_at: 1004},
            b: {create_at: 1003},
            c: {create_at: 1002},
            d: {create_at: 1001},
            e: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).not.toBe(blocks);
        expect(nextBlocks).toEqual([
            {order: ['a', 'b', 'c', 'd', 'e'], recent: false},
        ]);
    });

    it('should not affect blocks that are not merged', () => {
        const blocks = [
            {order: ['a', 'b'], recent: false},
            {order: ['b', 'c'], recent: false},
            {order: ['d', 'e'], recent: false},
        ];
        const posts = {
            a: {create_at: 1004},
            b: {create_at: 1003},
            c: {create_at: 1002},
            d: {create_at: 1001},
            e: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).not.toBe(blocks);
        expect(nextBlocks[1]).toBe(blocks[2]);
        expect(nextBlocks).toEqual([
            {order: ['a', 'b', 'c'], recent: false},
            {order: ['d', 'e'], recent: false},
        ]);
    });

    it('should keep merged blocks marked as recent', () => {
        const blocks = [
            {order: ['a', 'b'], recent: true},
            {order: ['b', 'c'], recent: false},
        ];
        const posts = {
            a: {create_at: 1002},
            b: {create_at: 1001},
            c: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).not.toBe(blocks);
        expect(nextBlocks).toEqual([
            {order: ['a', 'b', 'c'], recent: true},
        ]);
    });

    it('should keep merged blocks marked as oldest', () => {
        const blocks = [
            {order: ['a', 'b'], oldest: true},
            {order: ['b', 'c'], oldest: false},
        ];
        const posts = {
            a: {create_at: 1002},
            b: {create_at: 1001},
            c: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).not.toBe(blocks);
        expect(nextBlocks).toEqual([
            {order: ['a', 'b', 'c'], oldest: true},
        ]);
    });

    it('should remove empty blocks', () => {
        const blocks = [
            {order: ['a', 'b'], recent: true},
            {order: [], recent: false},
        ];
        const posts = {
            a: {create_at: 1002},
            b: {create_at: 1001},
            c: {create_at: 1000},
        };

        const nextBlocks = reducers.mergePostBlocks(blocks, posts);

        expect(nextBlocks).not.toBe(blocks);
        expect(nextBlocks[0]).toBe(blocks[0]);
        expect(nextBlocks).toEqual([
            {order: ['a', 'b'], recent: true},
        ]);
    });
});

describe('mergePostOrder', () => {
    const tests = [
        {
            name: 'empty arrays',
            left: [],
            right: [],
            expected: [],
        },
        {
            name: 'empty left array',
            left: [],
            right: ['c', 'd'],
            expected: ['c', 'd'],
        },
        {
            name: 'empty right array',
            left: ['a', 'b'],
            right: [],
            expected: ['a', 'b'],
        },
        {
            name: 'distinct arrays',
            left: ['a', 'b'],
            right: ['c', 'd'],
            expected: ['a', 'b', 'c', 'd'],
        },
        {
            name: 'overlapping arrays',
            left: ['a', 'b', 'c', 'd'],
            right: ['c', 'd', 'e', 'f'],
            expected: ['a', 'b', 'c', 'd', 'e', 'f'],
        },
        {
            name: 'left array is start of right array',
            left: ['a', 'b'],
            right: ['a', 'b', 'c', 'd'],
            expected: ['a', 'b', 'c', 'd'],
        },
        {
            name: 'right array is end of left array',
            left: ['a', 'b', 'c', 'd'],
            right: ['c', 'd'],
            expected: ['a', 'b', 'c', 'd'],
        },
        {
            name: 'left array contains right array',
            left: ['a', 'b', 'c', 'd'],
            right: ['b', 'c'],
            expected: ['a', 'b', 'c', 'd'],
        },
        {
            name: 'items in second array missing from first',
            left: ['a', 'c'],
            right: ['b', 'd', 'e', 'f'],
            expected: ['a', 'b', 'c', 'd', 'e', 'f'],
        },
    ];

    const posts = {
        a: {create_at: 10000},
        b: {create_at: 9000},
        c: {create_at: 8000},
        d: {create_at: 7000},
        e: {create_at: 6000},
        f: {create_at: 5000},
    };

    for (const test of tests) {
        it(test.name, () => {
            const left = [...test.left];
            const right = [...test.right];

            const actual = reducers.mergePostOrder(left, right, posts);

            expect(actual).toEqual(test.expected);

            // Arguments shouldn't be mutated
            expect(left).toEqual(test.left);
            expect(right).toEqual(test.right);
        });
    }
});

describe('postsInThread', () => {
    for (const actionType of [
        PostTypes.RECEIVED_POST,
        PostTypes.RECEIVED_NEW_POST,
    ]) {
        describe(`receiving a single post (${actionType})`, () => {
            it('should replace a previously pending comment', () => {
                const state = deepFreeze({
                    root1: ['comment1', 'pending', 'comment2'],
                });

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {id: 'comment3', root_id: 'root1', pending_post_id: 'pending'},
                });

                expect(nextState).not.toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2', 'comment3'],
                });
            });

            it('should do nothing for a pending comment that was already removed', () => {
                const state = deepFreeze({
                    root1: ['comment1', 'comment2'],
                });

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {id: 'comment2', root_id: 'root1', pending_post_id: 'pending'},
                });

                expect(nextState).toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2'],
                });
            });

            it('should store a comment that was not previously pending', () => {
                const state = deepFreeze({
                    root1: ['comment1', 'comment2'],
                });

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {id: 'comment3', root_id: 'root1'},
                });

                expect(nextState).not.toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2', 'comment3'],
                });
            });

            it('should store a comment without other comments loaded for the thread', () => {
                const state = deepFreeze({});

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {id: 'comment1', root_id: 'root1'},
                });

                expect(nextState).not.toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1'],
                });
            });

            it('should do nothing for a non-comment post', () => {
                const state = deepFreeze({
                    root1: ['comment1'],
                });

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {id: 'root2'},
                });

                expect(nextState).toBe(state);
                expect(nextState.root1).toBe(state.root1);
                expect(nextState).toEqual({
                    root1: ['comment1'],
                });
            });

            it('should do nothing for a duplicate post', () => {
                const state = deepFreeze({
                    root1: ['comment1', 'comment2'],
                });

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {id: 'comment1'},
                });

                expect(nextState).toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2'],
                });
            });
        });
    }

    for (const actionType of [
        PostTypes.RECEIVED_POSTS_AFTER,
        PostTypes.RECEIVED_POSTS_BEFORE,
        PostTypes.RECEIVED_POSTS_IN_CHANNEL,
        PostTypes.RECEIVED_POSTS_SINCE,
    ]) {
        describe(`receiving posts in the channel (${actionType})`, () => {
            it('should save comments without in the correct threads without sorting', () => {
                const state = deepFreeze({
                    root1: ['comment1'],
                });

                const posts = {
                    comment2: {id: 'comment2', root_id: 'root1'},
                    comment3: {id: 'comment3', root_id: 'root2'},
                    comment4: {id: 'comment4', root_id: 'root1'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        order: [],
                        posts,
                    },
                });

                expect(nextState).not.toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2', 'comment4'],
                    root2: ['comment3'],
                });
            });

            it('should not save not-comment posts', () => {
                const state = deepFreeze({
                    root1: ['comment1'],
                });

                const posts = {
                    comment2: {id: 'comment2', root_id: 'root1'},
                    root2: {id: 'root2'},
                    comment3: {id: 'comment3', root_id: 'root2'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        order: [],
                        posts,
                    },
                });

                expect(nextState).not.toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2'],
                    root2: ['comment3'],
                });
            });

            it('should not save duplicate posts', () => {
                const state = deepFreeze({
                    root1: ['comment1'],
                });

                const posts = {
                    comment1: {id: 'comment2', root_id: 'root1'},
                    comment2: {id: 'comment2', root_id: 'root1'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        order: [],
                        posts,
                    },
                });

                expect(nextState).not.toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2'],
                });
            });

            it('should do nothing when receiving no posts', () => {
                const state = deepFreeze({
                    root1: ['comment1'],
                });

                const posts = {};

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        order: [],
                        posts,
                    },
                });

                expect(nextState).toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1'],
                });
            });

            it('should do nothing when receiving no comments', () => {
                const state = deepFreeze({
                    root1: ['comment1'],
                });

                const posts = {
                    root2: {id: 'root2'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        order: [],
                        posts,
                    },
                });

                expect(nextState).toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1'],
                });
            });
        });
    }

    describe('receiving posts in a thread', () => {
        it('should save comments without sorting', () => {
            const state = deepFreeze({
                root1: ['comment1'],
            });

            const posts = {
                comment2: {id: 'comment2', root_id: 'root1'},
                comment3: {id: 'comment3', root_id: 'root1'},
            };

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.RECEIVED_POSTS_IN_THREAD,
                data: {
                    order: [],
                    posts,
                },
                rootId: 'root1',
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                root1: ['comment1', 'comment2', 'comment3'],
            });
        });

        it('should not save the root post', () => {
            const state = deepFreeze({
                root1: ['comment1'],
            });

            const posts = {
                root2: {id: 'root2'},
                comment2: {id: 'comment2', root_id: 'root2'},
                comment3: {id: 'comment3', root_id: 'root2'},
            };

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.RECEIVED_POSTS_IN_THREAD,
                data: {
                    order: [],
                    posts,
                },
                rootId: 'root2',
            });

            expect(nextState).not.toBe(state);
            expect(nextState.root1).toBe(state.root1);
            expect(nextState).toEqual({
                root1: ['comment1'],
                root2: ['comment2', 'comment3'],
            });
        });

        it('should not save duplicate posts', () => {
            const state = deepFreeze({
                root1: ['comment1'],
            });

            const posts = {
                comment1: {id: 'comment1', root_id: 'root1'},
                comment2: {id: 'comment2', root_id: 'root1'},
            };

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.RECEIVED_POSTS_IN_THREAD,
                data: {
                    order: [],
                    posts,
                },
                rootId: 'root1',
            });

            expect(nextState).not.toBe(state);
            expect(nextState).toEqual({
                root1: ['comment1', 'comment2'],
            });
        });

        it('should do nothing when receiving no posts', () => {
            const state = deepFreeze({
                root1: ['comment1'],
            });

            const posts = {};

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.RECEIVED_POSTS_IN_THREAD,
                data: {
                    order: [],
                    posts,
                },
                rootId: 'root2',
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                root1: ['comment1'],
            });
        });
    });

    describe('deleting a post', () => {
        it('should remove the thread when deleting the root post', () => {
            const state = deepFreeze({
                root1: ['comment1', 'comment2'],
                root2: ['comment3'],
            });

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.POST_DELETED,
                data: {id: 'root1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState.root2).toBe(state.root2);
            expect(nextState).toEqual({
                root2: ['comment3'],
            });
        });

        it('should do nothing when deleting a comment', () => {
            const state = deepFreeze({
                root1: ['comment1', 'comment2'],
            });

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.POST_DELETED,
                data: {id: 'comment1'},
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                root1: ['comment1', 'comment2'],
            });
        });

        it('should do nothing if deleting a post without comments', () => {
            const state = deepFreeze({
                root1: ['comment1', 'comment2'],
            });

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.POST_DELETED,
                data: {id: 'root2'},
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                root1: ['comment1', 'comment2'],
            });
        });
    });

    describe('removing a post', () => {
        it('should remove the thread when removing the root post', () => {
            const state = deepFreeze({
                root1: ['comment1', 'comment2'],
                root2: ['comment3'],
            });

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.POST_REMOVED,
                data: {id: 'root1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState.root2).toBe(state.root2);
            expect(nextState).toEqual({
                root2: ['comment3'],
            });
        });

        it('should remove an entry from the thread when removing a comment', () => {
            const state = deepFreeze({
                root1: ['comment1', 'comment2'],
                root2: ['comment3'],
            });

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.POST_REMOVED,
                data: {id: 'comment1', root_id: 'root1'},
            });

            expect(nextState).not.toBe(state);
            expect(nextState.root2).toBe(state.root2);
            expect(nextState).toEqual({
                root1: ['comment2'],
                root2: ['comment3'],
            });
        });

        it('should do nothing if removing a thread that has not been loaded', () => {
            const state = deepFreeze({
                root1: ['comment1', 'comment2'],
            });

            const nextState = reducers.postsInThread(state, {
                type: PostTypes.POST_REMOVED,
                data: {id: 'root2'},
            });

            expect(nextState).toBe(state);
            expect(nextState).toEqual({
                root1: ['comment1', 'comment2'],
            });
        });
    });

    for (const actionType of [
        ChannelTypes.RECEIVED_CHANNEL_DELETED,
        ChannelTypes.DELETE_CHANNEL_SUCCESS,
        ChannelTypes.LEAVE_CHANNEL,
    ]) {
        describe(`when a channel is deleted (${actionType})`, () => {
            it('should remove any threads in that channel', () => {
                const state = deepFreeze({
                    root1: ['comment1', 'comment2'],
                    root2: ['comment3'],
                    root3: ['comment4'],
                });

                const prevPosts = {
                    root1: {id: 'root1', channel_id: 'channel1'},
                    comment1: {id: 'comment1', channel_id: 'channel1', root_id: 'root1'},
                    comment2: {id: 'comment2', channel_id: 'channel1', root_id: 'root1'},
                    root2: {id: 'root2', channel_id: 'channel2'},
                    comment3: {id: 'comment3', channel_id: 'channel2', root_id: 'root2'},
                    root3: {id: 'root3', channel_id: 'channel1'},
                    comment4: {id: 'comment3', channel_id: 'channel1', root_id: 'root3'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        id: 'channel1',
                        viewArchivedChannels: false,
                    },
                }, prevPosts);

                expect(nextState).not.toBe(state);
                expect(nextState.root2).toBe(state.root2);
                expect(nextState).toEqual({
                    root2: ['comment3'],
                });
            });

            it('should do nothing if no threads in that channel are loaded', () => {
                const state = deepFreeze({
                    root1: ['comment1', 'comment2'],
                });

                const prevPosts = {
                    root1: {id: 'root1', channel_id: 'channel1'},
                    comment1: {id: 'comment1', channel_id: 'channel1', root_id: 'root1'},
                    comment2: {id: 'comment2', channel_id: 'channel1', root_id: 'root1'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        id: 'channel2',
                        viewArchivedChannels: false,
                    },
                }, prevPosts);

                expect(nextState).toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2'],
                });
            });

            it('should not remove any posts with viewArchivedChannels enabled', () => {
                const state = deepFreeze({
                    root1: ['comment1', 'comment2'],
                    root2: ['comment3'],
                });

                const prevPosts = {
                    root1: {id: 'root1', channel_id: 'channel1'},
                    comment1: {id: 'comment1', channel_id: 'channel1', root_id: 'root1'},
                    comment2: {id: 'comment2', channel_id: 'channel1', root_id: 'root1'},
                    root2: {id: 'root2', channel_id: 'channel2'},
                    comment3: {id: 'comment3', channel_id: 'channel2', root_id: 'root2'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        id: 'channel1',
                        viewArchivedChannels: true,
                    },
                }, prevPosts);

                expect(nextState).toBe(state);
                expect(nextState).toEqual({
                    root1: ['comment1', 'comment2'],
                    root2: ['comment3'],
                });
            });

            it('should not error if a post is missing from prevPosts', () => {
                const state = deepFreeze({
                    root1: ['comment1'],
                });

                const prevPosts = {
                    comment1: {id: 'comment1', channel_id: 'channel1', root_id: 'root1'},
                };

                const nextState = reducers.postsInThread(state, {
                    type: actionType,
                    data: {
                        id: 'channel1',
                        viewArchivedChannels: false,
                    },
                }, prevPosts);

                expect(nextState).toBe(state);
            });
        });
    }
});

describe('removeUnneededMetadata', () => {
    it('without metadata', () => {
        const post = deepFreeze({
            id: 'post',
        });

        const nextPost = reducers.removeUnneededMetadata(post);

        assert.equal(nextPost, post);
    });

    it('with empty metadata', () => {
        const post = deepFreeze({
            id: 'post',
            metadata: {},
        });

        const nextPost = reducers.removeUnneededMetadata(post);

        assert.equal(nextPost, post);
    });

    it('should remove emojis', () => {
        const post = deepFreeze({
            id: 'post',
            metadata: {
                emojis: [{name: 'emoji'}],
            },
        });

        const nextPost = reducers.removeUnneededMetadata(post);

        assert.notEqual(nextPost, post);
        assert.deepEqual(nextPost, {
            id: 'post',
            metadata: {},
        });
    });

    it('should remove files', () => {
        const post = deepFreeze({
            id: 'post',
            metadata: {
                files: [{id: 'file', post_id: 'post'}],
            },
        });

        const nextPost = reducers.removeUnneededMetadata(post);

        assert.notEqual(nextPost, post);
        assert.deepEqual(nextPost, {
            id: 'post',
            metadata: {},
        });
    });

    it('should remove reactions', () => {
        const post = deepFreeze({
            id: 'post',
            metadata: {
                reactions: [
                    {user_id: 'abcd', emoji_name: '+1'},
                    {user_id: 'efgh', emoji_name: '+1'},
                    {user_id: 'abcd', emoji_name: '-1'},
                ],
            },
        });

        const nextPost = reducers.removeUnneededMetadata(post);

        assert.notEqual(nextPost, post);
        assert.deepEqual(nextPost, {
            id: 'post',
            metadata: {},
        });
    });

    it('should remove OpenGraph data', () => {
        const post = deepFreeze({
            id: 'post',
            metadata: {
                embeds: [{
                    type: 'opengraph',
                    url: 'https://example.com',
                    data: {
                        url: 'https://example.com',
                        images: [{
                            url: 'https://example.com/logo.png',
                            width: 100,
                            height: 100,
                        }],
                    },
                }],
            },
        });

        const nextPost = reducers.removeUnneededMetadata(post);

        assert.notEqual(nextPost, post);
        assert.deepEqual(nextPost, {
            id: 'post',
            metadata: {
                embeds: [{
                    type: 'opengraph',
                    url: 'https://example.com',
                }],
            },
        });
    });

    it('should not affect non-OpenGraph embeds', () => {
        const post = deepFreeze({
            id: 'post',
            metadata: {
                embeds: [
                    {type: 'image', url: 'https://example.com/image'},
                    {type: 'message_attachment'},
                ],
            },
            props: {
                attachments: [
                    {text: 'This is an attachment'},
                ],
            },
        });

        const nextPost = reducers.removeUnneededMetadata(post);

        assert.equal(nextPost, post);
    });
});

describe('reactions', () => {
    for (const actionType of [
        PostTypes.RECEIVED_NEW_POST,
        PostTypes.RECEIVED_POST,
    ]) {
        describe(`single post received (${actionType})`, () => {
            it('no post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                    },
                };

                const nextState = reducers.reactions(state, action);

                assert.equal(nextState, state);
            });

            it('no reactions in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {reactions: []},
                    },
                };

                const nextState = reducers.reactions(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post: {},
                });
            });

            it('should not clobber reactions when metadata empty', () => {
                const state = deepFreeze({post: {name: 'smiley', post_id: 'post'}});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {},
                    },
                };

                const nextState = reducers.reactions(state, action);

                assert.deepEqual(nextState, {
                    post: {name: 'smiley', post_id: 'post'},
                });
            });

            it('should save reactions', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {
                            reactions: [
                                {user_id: 'abcd', emoji_name: '+1'},
                                {user_id: 'efgh', emoji_name: '+1'},
                                {user_id: 'abcd', emoji_name: '-1'},
                            ],
                        },
                    },
                };

                const nextState = reducers.reactions(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post: {
                        'abcd-+1': {user_id: 'abcd', emoji_name: '+1'},
                        'efgh-+1': {user_id: 'efgh', emoji_name: '+1'},
                        'abcd--1': {user_id: 'abcd', emoji_name: '-1'},
                    },
                });
            });

            it('should not save reaction for a deleted post', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        delete_at: '1571366424287',
                    },
                };

                const nextState = reducers.reactions(state, action);

                assert.equal(nextState, state);
            });
        });
    }

    describe('receiving multiple posts', () => {
        it('no post metadata', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post: {
                            id: 'post',
                        },
                    },
                },
            };

            const nextState = reducers.reactions(state, action);

            assert.equal(nextState, state);
        });

        it('no reactions in post metadata', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post: {
                            id: 'post',
                            metadata: {reactions: []},
                        },
                    },
                },
            };

            const nextState = reducers.reactions(state, action);

            assert.notEqual(nextState, state);
            assert.deepEqual(nextState, {
                post: {},
            });
        });

        it('should save reactions', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post: {
                            id: 'post',
                            metadata: {
                                reactions: [
                                    {user_id: 'abcd', emoji_name: '+1'},
                                    {user_id: 'efgh', emoji_name: '+1'},
                                    {user_id: 'abcd', emoji_name: '-1'},
                                ],
                            },
                        },
                    },
                },
            };

            const nextState = reducers.reactions(state, action);

            assert.notEqual(nextState, state);
            assert.deepEqual(nextState, {
                post: {
                    'abcd-+1': {user_id: 'abcd', emoji_name: '+1'},
                    'efgh-+1': {user_id: 'efgh', emoji_name: '+1'},
                    'abcd--1': {user_id: 'abcd', emoji_name: '-1'},
                },
            });
        });

        it('should save reactions for multiple posts', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post1: {
                            id: 'post1',
                            metadata: {
                                reactions: [
                                    {user_id: 'abcd', emoji_name: '+1'},
                                ],
                            },
                        },
                        post2: {
                            id: 'post2',
                            metadata: {
                                reactions: [
                                    {user_id: 'abcd', emoji_name: '-1'},
                                ],
                            },
                        },
                    },
                },
            };

            const nextState = reducers.reactions(state, action);

            assert.notEqual(nextState, state);
            assert.deepEqual(nextState, {
                post1: {
                    'abcd-+1': {user_id: 'abcd', emoji_name: '+1'},
                },
                post2: {
                    'abcd--1': {user_id: 'abcd', emoji_name: '-1'},
                },
            });
        });

        it('should save reactions for multiple posts except deleted posts', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post1: {
                            id: 'post1',
                            metadata: {
                                reactions: [
                                    {user_id: 'abcd', emoji_name: '+1'},
                                ],
                            },
                        },
                        post2: {
                            id: 'post2',
                            delete_at: '1571366424287',
                            metadata: {
                                reactions: [
                                    {user_id: 'abcd', emoji_name: '-1'},
                                ],
                            },
                        },
                    },
                },
            };

            const nextState = reducers.reactions(state, action);

            assert.notEqual(nextState, state);
            assert.deepEqual(nextState, {
                post1: {
                    'abcd-+1': {user_id: 'abcd', emoji_name: '+1'},
                },
            });
        });
    });
});

describe('opengraph', () => {
    for (const actionType of [
        PostTypes.RECEIVED_NEW_POST,
        PostTypes.RECEIVED_POST,
    ]) {
        describe(`single post received (${actionType})`, () => {
            it('no post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                    },
                };

                const nextState = reducers.openGraph(state, action);

                assert.equal(nextState, state);
            });

            it('no embeds in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {},
                    },
                };

                const nextState = reducers.openGraph(state, action);

                assert.equal(nextState, state);
            });

            it('other types of embeds in post metadata', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {
                            embeds: [{
                                type: 'image',
                                url: 'https://example.com/image.png',
                            }, {
                                type: 'message_attachment',
                            }],
                        },
                    },
                };

                const nextState = reducers.openGraph(state, action);

                assert.equal(nextState, state);
            });

            it('should save opengraph data', () => {
                const state = deepFreeze({});
                const action = {
                    type: actionType,
                    data: {
                        id: 'post',
                        metadata: {
                            embeds: [{
                                type: 'opengraph',
                                url: 'https://example.com',
                                data: {
                                    title: 'Example',
                                    description: 'Example description',
                                },
                            }],
                        },
                    },
                };

                const nextState = reducers.openGraph(state, action);

                assert.notEqual(nextState, state);
                assert.deepEqual(nextState, {
                    post: {'https://example.com': action.data.metadata.embeds[0].data},
                });
            });
        });
    }

    describe('receiving multiple posts', () => {
        it('no post metadata', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post: {
                            id: 'post',
                        },
                    },
                },
            };

            const nextState = reducers.openGraph(state, action);

            assert.equal(nextState, state);
        });

        it('no embeds in post metadata', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post: {
                            id: 'post',
                            metadata: {},
                        },
                    },
                },
            };

            const nextState = reducers.openGraph(state, action);

            assert.equal(nextState, state);
        });

        it('other types of embeds in post metadata', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post: {
                            id: 'post',
                            metadata: {
                                embeds: [{
                                    type: 'image',
                                    url: 'https://example.com/image.png',
                                }, {
                                    type: 'message_attachment',
                                }],
                            },
                        },
                    },
                },
            };

            const nextState = reducers.openGraph(state, action);

            assert.equal(nextState, state);
        });

        it('should save opengraph data', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post1: {
                            id: 'post1',
                            metadata: {
                                embeds: [{
                                    type: 'opengraph',
                                    url: 'https://example.com',
                                    data: {
                                        title: 'Example',
                                        description: 'Example description',
                                    },
                                }],
                            },
                        },
                    },
                },
            };

            const nextState = reducers.openGraph(state, action);

            assert.notEqual(nextState, state);
            assert.deepEqual(nextState, {
                post1: {'https://example.com': action.data.posts.post1.metadata.embeds[0].data},
            });
        });

        it('should save reactions for multiple posts', () => {
            const state = deepFreeze({});
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        post1: {
                            id: 'post1',
                            metadata: {
                                embeds: [{
                                    type: 'opengraph',
                                    url: 'https://example.com',
                                    data: {
                                        title: 'Example',
                                        description: 'Example description',
                                    },
                                }],
                            },
                        },
                        post2: {
                            id: 'post2',
                            metadata: {
                                embeds: [{
                                    type: 'opengraph',
                                    url: 'https://google.ca',
                                    data: {
                                        title: 'Google',
                                        description: 'Something about search',
                                    },
                                }],
                            },
                        },
                    },
                },
            };

            const nextState = reducers.openGraph(state, action);

            assert.notEqual(nextState, state);
            assert.deepEqual(nextState, {
                post1: {'https://example.com': action.data.posts.post1.metadata.embeds[0].data},
                post2: {'https://google.ca': action.data.posts.post2.metadata.embeds[0].data},
            });
        });
    });
});

describe('expandedURLs', () => {
    it('should store the URLs on REDIRECT_LOCATION_SUCCESS', () => {
        const state = deepFreeze({});
        const action = {
            type: GeneralTypes.REDIRECT_LOCATION_SUCCESS,
            data: {
                url: 'a',
                location: 'b',
            },
        };

        const nextState = reducers.expandedURLs(state, action);
        assert.notEqual(state, nextState);
        assert.deepEqual(nextState, {
            a: 'b',
        });
    });

    it('should store the non-expanded URL on REDIRECT_LOCATION_FAILURE', () => {
        const state = deepFreeze({});
        const action = {
            type: GeneralTypes.REDIRECT_LOCATION_FAILURE,
            data: {
                url: 'b',
            },
        };

        const nextState = reducers.expandedURLs(state, action);
        assert.notEqual(state, nextState);
        assert.deepEqual(nextState, {
            b: 'b',
        });
    });
});

describe('removeNonRecentEmptyPostBlocks', () => {
    it('should filter empty blocks', () => {
        const blocks = [{
            order: [],
            recent: false,
        }, {
            order: ['1', '2'],
            recent: false,
        }];

        const filteredBlocks = reducers.removeNonRecentEmptyPostBlocks(blocks);
        assert.deepEqual(filteredBlocks, [{
            order: ['1', '2'],
            recent: false,
        }]);
    });

    it('should not filter empty recent block', () => {
        const blocks = [{
            order: [],
            recent: true,
        }, {
            order: ['1', '2'],
            recent: false,
        }, {
            order: [],
            recent: false,
        }];

        const filteredBlocks = reducers.removeNonRecentEmptyPostBlocks(blocks);
        assert.deepEqual(filteredBlocks, [{
            order: [],
            recent: true,
        }, {
            order: ['1', '2'],
            recent: false,
        }]);
    });
});
