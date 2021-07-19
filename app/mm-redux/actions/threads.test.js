// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import nock from 'nock';

import {getThread as fetchThread, getThreads as fetchThreads} from '@mm-redux/actions/threads';
import {getThread, getThreadsInCurrentTeam} from '@mm-redux/selectors/entities/threads';
import {Client4} from '@client/rest';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

/**
 * Returns a mock thread with 2 participants and 5 replies.
 */
function mockUserThread() {
    const userId = TestHelper.generateId();
    const otherUserId = TestHelper.generateId();
    const channelId = TestHelper.generateId();
    const postId = TestHelper.generateId();
    const threadId = postId;

    /**
     * @type {import('../types/threads').UserThread}
     */
    const thread = {
        id: threadId,
        reply_count: 5,
        last_reply_at: 1611786714949,
        last_viewed_at: 1611786716048,
        participants: [
            {id: userId},
            {id: otherUserId},
        ],
        post: {
            id: postId,
            create_at: 1610486901110,
            update_at: 1611786714912,
            edit_at: 0,
            delete_at: 0,
            is_pinned: false,
            user_id: userId,
            channel_id: channelId,
            root_id: '',
            parent_id: '',
            original_id: '',
            message: `accusamus incidunt ab quidem fuga. postId: ${postId}`,
            type: '',
            props: {},
            hashtags: '',
            pending_post_id: '',
            reply_count: 0,
            last_reply_at: 0,
            participants: null,
        },
        unread_replies: 0,
        unread_mentions: 0,
    };

    return [thread, {userId, otherUserId, channelId, postId, threadId}];
}

describe('Actions.Threads', () => {
    let store;
    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
    });

    const currentTeamId = TestHelper.generateId();
    const currentUserId = TestHelper.generateId();

    beforeEach(async () => {
        store = await configureStore({
            entities: {
                teams: {
                    currentTeamId,
                },
                users: {
                    currentUserId,
                },
            },
        });
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    test('getThread', async () => {
        const [mockThread, {threadId}] = mockUserThread();

        nock(Client4.getBaseRoute()).
            get((uri) => uri.includes(`/users/${currentUserId}/teams/${currentTeamId}/threads/${threadId}`)).
            reply(200, mockThread);

        const {error, data} = await store.dispatch(fetchThread(currentUserId, currentTeamId, threadId, false));
        const state = store.getState();
        const thread = getThread(state, threadId);
        expect(error).toBeUndefined();
        expect(data).toBeDefined();
        expect(thread).toEqual({...mockThread, is_following: true});
    });

    test('getThreads', async () => {
        const [mockThread0, {threadId: threadId0}] = mockUserThread();
        const [mockThread1, {threadId: threadId1}] = mockUserThread();
        const [mockThread2, {threadId: threadId2}] = mockUserThread();

        const mockResponse = {
            threads: [mockThread0, mockThread1, mockThread2],
            count: 3,
            total_unread_mentions: 0,
            total_unread_threads: 0,
        };

        nock(Client4.getBaseRoute()).
            get((uri) => uri.includes(`/users/${currentUserId}/teams/${currentTeamId}/threads`)).
            reply(200, mockResponse);

        const {error, data} = await store.dispatch(fetchThreads(currentUserId, currentTeamId));
        const state = store.getState();
        const threads = getThreadsInCurrentTeam(state);
        expect(error).toBeUndefined();
        expect(data).toBeDefined();
        expect(threads).toEqual([threadId0, threadId1, threadId2]);
    });
});
