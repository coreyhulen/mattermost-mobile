// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {General} from '@mm-redux/constants';
import {
    getMatchTermForAtMention,
    filterMembersNotInChannel,
    filterMembersInChannel,
    filterDirectAndGroupMessages,
} from '@selectors/autocomplete';

/* eslint-disable max-nested-callbacks */

describe('Selectors.Autocomplete', () => {
    describe('getMatchTermForAtMention', () => {
        describe('match non-search at mentions', () => {
            const testCases = [
                ['@', ''],
                ['@a', 'a'],
                ['@match', 'match'],
                ['@Username', 'username'],
                ['@USERNAME', 'username'],
                ['not a match', null],
                ['@with space', 'with space'],
            ];

            testCases.forEach((testCase) => {
                it(testCase[0], () => {
                    const value = testCase[0];
                    const isSearch = false;
                    const expected = testCase[1];
                    const actual = getMatchTermForAtMention(value, isSearch);

                    assert.equal(expected, actual);
                });
            });
        });

        describe('match search at mentions', () => {
            const testCases = [
                ['from:', ''],
                ['from:a', 'a'],
                ['from:match', 'match'],
                ['from:not a match', null],
                ['from:Username', 'username'],
                ['from:USERNAME', 'username'],
                ['from: space', 'space'],
            ];

            testCases.forEach((testCase) => {
                it(testCase[0], () => {
                    const value = testCase[0];
                    const isSearch = true;
                    const expected = testCase[1];
                    const actual = getMatchTermForAtMention(value, isSearch);

                    assert.equal(expected, actual);
                });
            });
        });
    });

    it('Should return profiles not in channel', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'current-channel-id',
                },
                users: {
                    currentUserId: 'current-user-id',
                    profiles: {
                        'current-user-id': {id: 'current-user-id', username: 'current', first_name: 'Current', last_name: 'User', email: 'current@user.com', nickname: 'nickname1', delete_at: 0},
                        'test-user-id': {id: 'test-user-id', username: 'test', first_name: 'Test', last_name: 'User', email: 'test@example.com', nickname: 'nickname2', delete_at: 0},
                        'another-user-id': {id: 'another-user-id', username: 'another', first_name: 'Another', last_name: 'One', email: 'another@example.com', nickname: 'nickname3', delete_at: 0},
                        'deleted-user-id': {id: 'deleted-user-id', username: 'deleted', first_name: 'Remvoed', last_name: 'Friend', email: 'deleted@example.com', nickname: 'nickname4', delete_at: 123},
                    },
                    profilesNotInChannel: {
                        'current-channel-id': new Set(['current-user-id', 'test-user-id', 'another-user-id', 'deleted-user-id']),
                    },
                },
            },
        };

        let profiles = filterMembersNotInChannel(state, '');
        expect(profiles.length).toBe(3);

        // filter to get the current user, should return single result
        profiles = filterMembersNotInChannel(state, 'current');
        expect(profiles.length).toBe(1);

        profiles = filterMembersNotInChannel(state, 'tes');
        expect(profiles.length).toBe(1);

        profiles = filterMembersNotInChannel(state, 'one');
        expect(profiles.length).toBe(1);

        profiles = filterMembersNotInChannel(state, 'example');
        expect(profiles.length).toBe(2);

        profiles = filterMembersNotInChannel(state, 'test u');
        expect(profiles.length).toBe(1);
    });

    it('Should return profiles in channel', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'current-channel-id',
                },
                users: {
                    currentUserId: 'current-user-id',
                    profiles: {
                        'current-user-id': {id: 'current-user-id', username: 'current', first_name: 'Current', last_name: 'User', email: 'current@user.com', nickname: 'nickname1', delete_at: 0},
                        'test-user-id': {id: 'test-user-id', username: 'test', first_name: 'Test', last_name: 'User', email: 'test@example.com', nickname: 'nickname2', delete_at: 0},
                        'another-user-id': {id: 'another-user-id', username: 'another', first_name: 'Another', last_name: 'One', email: 'another@example.com', nickname: 'nickname3', delete_at: 0},
                        'deleted-user-id': {id: 'deleted-user-id', username: 'deleted', first_name: 'Removed', last_name: 'Friend', email: 'deleted@example.com', nickname: 'nickname4', delete_at: 123},
                        'another-channel-user-id': {id: 'another-channel-user-id', username: 'another_channel', first_name: 'Another', last_name: 'Channel', email: 'another_channel@example.com', nickname: 'nickname5', delete_at: 0},
                    },
                    profilesInChannel: {
                        'current-channel-id': new Set(['current-user-id', 'test-user-id', 'another-user-id', 'deleted-user-id']),
                    },
                },
            },
        };

        let profiles = filterMembersInChannel(state, '');
        expect(profiles).toHaveLength(3);

        profiles = filterMembersInChannel(state, 'current');
        expect(profiles).toHaveLength(1);

        profiles = filterMembersInChannel(state, 'tes');
        expect(profiles.length).toBe(1);

        profiles = filterMembersInChannel(state, 'one');
        expect(profiles.length).toBe(1);

        profiles = filterMembersInChannel(state, 'example');
        expect(profiles.length).toBe(2);

        profiles = filterMembersInChannel(state, 'test u');
        expect(profiles.length).toBe(1);
    });

    it('Should return DMs', () => {
        const dm1 = {
            id: 'dm-1-id',
            type: General.DM_CHANNEL,
            name: 'another1',
            display_name: 'another1',
        };
        const dm2 = {
            id: 'dm-2-id',
            type: General.DM_CHANNEL,
            name: 'another2',
            display_name: 'another2',
        };
        const gm1 = {
            id: 'gm-1-id',
            type: General.GM_CHANNEL,
            name: 'anothergroup1',
            display_name: 'anothergroup1',
        };
        const teamId = 'current-team-id';
        const state = {
            entities: {
                general: {
                    config: {},
                },
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    channels: {
                        [dm1.id]: dm1,
                        [dm2.id]: dm2,
                        [gm1.id]: gm1,
                    },
                    myMembers: {
                        [dm1.id]: {},
                        [dm2.id]: {},
                        [gm1.id]: {},
                    },
                    channelsInTeam: {
                        [teamId]: new Set([dm1.id, dm2.id, gm1.id]),
                    },
                },
                teams: {
                    currentTeamId: teamId,
                },
                users: {
                    currentUserId: 'current-user-id',

                    profiles: {
                        'current-user-id': {id: 'current-user-id', username: 'current', first_name: 'Current', last_name: 'User', email: 'current@user.com', nickname: 'nickname', delete_at: 0},
                    },
                },
            },
        };

        let profiles = filterDirectAndGroupMessages(state, '@another1');
        expect(profiles.length).toBe(1);

        profiles = filterDirectAndGroupMessages(state, 'another2');
        expect(profiles.length).toBe(1);

        profiles = filterDirectAndGroupMessages(state, '@anothergroup1');
        expect(profiles.length).toBe(1);

        profiles = filterDirectAndGroupMessages(state, '@another');
        expect(profiles.length).toBe(3);
    });
});
