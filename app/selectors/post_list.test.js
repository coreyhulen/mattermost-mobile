// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {makePreparePostIdsForSearchPosts} from '@selectors/post_list';

describe('makePreparePostIdsForSearchPosts', () => {
    it('should return an empty array if there are no posts specified', () => {
        const preparePostIdsForSearchPosts = makePreparePostIdsForSearchPosts();

        const state = {
            entities: {
                posts: {
                    posts: {
                        1001: {id: '1001', create_at: 0, type: ''},
                        1002: {id: '1002', create_at: 1, type: ''},
                    },
                },
                users: {
                    currentUserId: '1234',
                    profiles: {
                        1234: {id: '1234', username: 'user'},
                    },
                },
            },
        };

        const postIds = [];
        const actual = preparePostIdsForSearchPosts(state, postIds);
        assert.deepEqual(actual, []);
    });

    it('should return an empty array if there are no matching posts', () => {
        const preparePostIdsForSearchPosts = makePreparePostIdsForSearchPosts();

        const state = {
            entities: {
                posts: {
                    posts: {},
                },
                users: {
                    currentUserId: '1234',
                    profiles: {
                        1234: {id: '1234', username: 'user'},
                    },
                },
            },
        };

        const postIds = ['1002', '1001'];
        const actual = preparePostIdsForSearchPosts(state, postIds);
        assert.deepEqual(actual, []);
    });

    it('should return results when there are posts', () => {
        const preparePostIdsForSearchPosts = makePreparePostIdsForSearchPosts();

        const state = {
            entities: {
                posts: {
                    posts: {
                        1001: {id: '1001', create_at: 0, type: ''},
                        1002: {id: '1002', create_at: 1000, type: ''},

                        // Same timestamp as 1002
                        1003: {id: '1003', create_at: 1000, type: ''},
                    },
                },
                users: {
                    currentUserId: '1234',
                    profiles: {
                        1234: {id: '1234', username: 'user'},
                    },
                },
            },
        };

        const postIds = ['1003', '1002', '1001'];
        const actual = preparePostIdsForSearchPosts(state, postIds);
        assert.deepEqual(actual, [
            'date-1000-index-0',
            '1003',
            'date-1000-index-1',
            '1002',
            'date-0-index-2',
            '1001',
        ]);
    });
});
