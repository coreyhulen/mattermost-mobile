// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {WebsocketEvents} from '@constants';
import typingReducer from '@mm-redux/reducers/entities/typing';
import TestHelper from '@test/test_helper';

describe('Reducers.Typing', () => {
    it('initial state', async () => {
        let state = {};

        state = typingReducer(
            state,
            {},
        );
        assert.deepEqual(
            state,
            {},
            'initial state',
        );
    });

    it('WebsocketEvents.TYPING', async () => {
        let state = {};

        const id1 = TestHelper.generateId();
        const userId1 = TestHelper.generateId();
        const now1 = 1234;

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.TYPING,
                data: {
                    id: id1,
                    userId: userId1,
                    now: now1,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id1]: {
                    [userId1]: now1,
                },
            },
            'first user typing',
        );

        const id2 = TestHelper.generateId();
        const now2 = 1235;

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.TYPING,
                data: {
                    id: id2,
                    userId: userId1,
                    now: now2,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id1]: {
                    [userId1]: now1,
                },
                [id2]: {
                    [userId1]: now2,
                },
            },
            'user typing in second channel',
        );

        const userId2 = TestHelper.generateId();
        const now3 = 1237;

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.TYPING,
                data: {
                    id: id1,
                    userId: userId2,
                    now: now3,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id1]: {
                    [userId1]: now1,
                    [userId2]: now3,
                },
                [id2]: {
                    [userId1]: now2,
                },
            },
            'second user typing in channel',
        );

        const now4 = 1238;

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.TYPING,
                data: {
                    id: id2,
                    userId: userId2,
                    now: now4,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id1]: {
                    [userId1]: now1,
                    [userId2]: now3,
                },
                [id2]: {
                    [userId1]: now2,
                    [userId2]: now4,
                },
            },
            'second user typing in second channel',
        );
    });

    it('WebsocketEvents.STOP_TYPING', async () => {
        const id1 = TestHelper.generateId();
        const id2 = TestHelper.generateId();

        const userId1 = TestHelper.generateId();
        const userId2 = TestHelper.generateId();

        const now1 = 1234;
        const now2 = 1235;
        const now3 = 1236;
        const now4 = 1237;

        let state = {
            [id1]: {
                [userId1]: now1,
                [userId2]: now3,
            },
            [id2]: {
                [userId1]: now2,
                [userId2]: now4,
            },
        };

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.STOP_TYPING,
                data: {
                    id: id1,
                    userId: userId1,
                    now: now1,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id1]: {
                    [userId2]: now3,
                },
                [id2]: {
                    [userId1]: now2,
                    [userId2]: now4,
                },
            },
            'deleting first user from first channel',
        );

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.STOP_TYPING,
                data: {
                    id: id2,
                    userId: userId1,
                    now: now2,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id1]: {
                    [userId2]: now3,
                },
                [id2]: {
                    [userId2]: now4,
                },
            },
            'deleting first user from second channel',
        );

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.STOP_TYPING,
                data: {
                    id: id1,
                    userId: userId2,
                    now: now3,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id2]: {
                    [userId2]: now4,
                },
            },
            'deleting second user from first channel',
        );

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.STOP_TYPING,
                data: {
                    id: id2,
                    userId: userId2,
                    now: now4,
                },
            },
        );
        assert.deepEqual(
            state,
            {},
            'deleting second user from second channel',
        );

        state = {
            [id1]: {
                [userId1]: now2,
            },
        };
        state = typingReducer(
            state,
            {
                type: WebsocketEvents.STOP_TYPING,
                data: {
                    id: id1,
                    userId: userId1,
                    now: now1,
                },
            },
        );
        assert.deepEqual(
            state,
            {
                [id1]: {
                    [userId1]: now2,
                },
            },
            'shouldn\'t delete when the timestamp is older',
        );

        state = typingReducer(
            state,
            {
                type: WebsocketEvents.STOP_TYPING,
                data: {
                    id: id1,
                    userId: userId1,
                    now: now3,
                },
            },
        );
        assert.deepEqual(
            state,
            {},
            'should delete when the timestamp is newer',
        );
    });
});
