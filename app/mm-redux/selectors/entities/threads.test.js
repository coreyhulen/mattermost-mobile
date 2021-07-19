// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import TestHelper from 'test/test_helper';
import * as Selectors from '@mm-redux/selectors/entities/threads';

describe('Selectors.Threads.getThreadOrderInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    it('should return threads order in current team based on last reply time', () => {
        const user = TestHelper.fakeUserWithId();

        const profiles = {
            [user.id]: user,
        };

        const testState = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: user.id,
                    profiles,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                threads: {
                    threads: {
                        a: {last_reply_at: 1, is_following: true},
                        b: {last_reply_at: 2, is_following: true},
                    },
                    threadsInTeam: {
                        [team1.id]: ['a', 'b'],
                        [team2.id]: ['c', 'd'],
                    },
                },
            },
        });

        assert.deepStrictEqual(Selectors.getThreadOrderInCurrentTeam(testState), ['b', 'a']);
    });
});

describe('Selectors.Threads.getThreadsInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    it('should return threads in current team', () => {
        const user = TestHelper.fakeUserWithId();

        const profiles = {
            [user.id]: user,
        };

        const testState = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: user.id,
                    profiles,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                threads: {
                    threads: {
                        a: {},
                        b: {},
                    },
                    threadsInTeam: {
                        [team1.id]: ['a', 'b'],
                        [team2.id]: ['c', 'd'],
                    },
                },
            },
        });

        assert.deepStrictEqual(Selectors.getThreadsInCurrentTeam(testState), ['a', 'b']);
    });
});
