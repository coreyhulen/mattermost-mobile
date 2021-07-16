// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {General, Preferences} from '../../constants';
import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import {sortByUsername} from '@mm-redux/utils/user_utils';
import TestHelper from 'test/test_helper';
import * as Selectors from '@mm-redux/selectors/entities/users';

describe('Selectors.Users', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const user1 = TestHelper.fakeUserWithId();
    user1.notify_props = {mention_keys: 'testkey1,testkey2'};
    user1.roles = 'system_admin system_user';
    const user2 = TestHelper.fakeUserWithId();
    user2.delete_at = 1;
    const user3 = TestHelper.fakeUserWithId();
    const user4 = TestHelper.fakeUserWithId();
    const user5 = TestHelper.fakeUserWithId();
    const user6 = TestHelper.fakeUserWithId();
    user6.roles = 'system_admin system_user';
    const user7 = TestHelper.fakeUserWithId();
    user7.delete_at = 1;
    user7.roles = 'system_admin system_user';
    const profiles = {};
    profiles[user1.id] = user1;
    profiles[user2.id] = user2;
    profiles[user3.id] = user3;
    profiles[user4.id] = user4;
    profiles[user5.id] = user5;
    profiles[user6.id] = user6;
    profiles[user7.id] = user7;

    const profilesInTeam = {};
    profilesInTeam[team1.id] = new Set([user1.id, user2.id, user7.id]);

    const profilesNotInTeam = {};
    profilesNotInTeam[team1.id] = new Set([user3.id, user4.id]);

    const profilesWithoutTeam = new Set([user5.id, user6.id]);

    const profilesInChannel = {};
    profilesInChannel[channel1.id] = new Set([user1.id]);
    profilesInChannel[channel2.id] = new Set([user1.id, user2.id]);

    const profilesNotInChannel = {};
    profilesNotInChannel[channel1.id] = new Set([user2.id, user3.id]);
    profilesNotInChannel[channel2.id] = new Set([user4.id, user5.id]);

    const userSessions = [{
        create_at: 1,
        expires_at: 2,
        props: {},
        user_id: user1.id,
        roles: '',
    }];

    const myPreferences = {};
    myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${user2.id}`] = {category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: user2.id, value: 'true'};
    myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${user3.id}`] = {category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: user3.id, value: 'false'};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInTeam,
                profilesNotInTeam,
                profilesWithoutTeam,
                profilesInChannel,
                profilesNotInChannel,
                mySessions: userSessions,
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                currentChannelId: channel1.id,
            },
            preferences: {
                myPreferences,
            },
        },
    });

    it('getUserIdsInChannels', () => {
        assert.deepEqual(Selectors.getUserIdsInChannels(testState), profilesInChannel);
    });

    it('getUserIdsNotInChannels', () => {
        assert.deepEqual(Selectors.getUserIdsNotInChannels(testState), profilesNotInChannel);
    });

    it('getUserIdsInTeams', () => {
        assert.deepEqual(Selectors.getUserIdsInTeams(testState), profilesInTeam);
    });

    it('getUserIdsNotInTeams', () => {
        assert.deepEqual(Selectors.getUserIdsNotInTeams(testState), profilesNotInTeam);
    });

    it('getUserIdsWithoutTeam', () => {
        assert.deepEqual(Selectors.getUserIdsWithoutTeam(testState), profilesWithoutTeam);
    });

    it('getUserSessions', () => {
        assert.deepEqual(Selectors.getUserSessions(testState), userSessions);
    });

    it('getUser', () => {
        assert.deepEqual(Selectors.getUser(testState, user1.id), user1);
    });

    it('getUsers', () => {
        assert.deepEqual(Selectors.getUsers(testState), profiles);
    });

    describe('getCurrentUserMentionKeys', () => {
        it('at mention', () => {
            const userId = '1234';
            const notifyProps = {};
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: '@user'}]);
        });

        it('channel', () => {
            const userId = '1234';
            const notifyProps = {
                channel: 'true',
            };
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: '@channel'}, {key: '@all'}, {key: '@here'}, {key: '@user'}]);
        });

        it('first name', () => {
            const userId = '1234';
            const notifyProps = {
                first_name: 'true',
            };
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: 'First', caseSensitive: true}, {key: '@user'}]);
        });

        it('custom keys', () => {
            const userId = '1234';
            const notifyProps = {
                mention_keys: 'test,foo,@user,user',
            };
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: 'test'}, {key: 'foo'}, {key: '@user'}, {key: 'user'}]);
        });
    });

    describe('getProfiles', () => {
        it('getProfiles without filter', () => {
            const users = [user1, user2, user3, user4, user5, user6, user7].sort(sortByUsername);
            assert.deepEqual(Selectors.getProfiles(testState), users);
        });

        it('getProfiles with role filter', () => {
            const users = [user1, user6, user7].sort(sortByUsername);
            assert.deepEqual(Selectors.getProfiles(testState, {role: 'system_admin'}), users);
        });
        it('getProfiles with inactive', () => {
            const users = [user2, user7].sort(sortByUsername);
            assert.deepEqual(Selectors.getProfiles(testState, {inactive: true}), users);
        });
        it('getProfiles with multiple filters', () => {
            const users = [user7];
            assert.deepEqual(Selectors.getProfiles(testState, {role: 'system_admin', inactive: true}), users);
        });
    });

    it('getProfilesInCurrentTeam', () => {
        const users = [user1, user2, user7].sort(sortByUsername);
        assert.deepEqual(Selectors.getProfilesInCurrentTeam(testState), users);
    });
    describe('getProfilesInTeam', () => {
        it('getProfilesInTeam without filter', () => {
            const users = [user1, user2, user7].sort(sortByUsername);
            assert.deepEqual(Selectors.getProfilesInTeam(testState, team1.id), users);
            assert.deepEqual(Selectors.getProfilesInTeam(testState, 'junk'), []);
        });
        it('getProfilesInTeam with role filter', () => {
            const users = [user1, user7].sort(sortByUsername);
            assert.deepEqual(Selectors.getProfilesInTeam(testState, team1.id, {role: 'system_admin'}), users);
            assert.deepEqual(Selectors.getProfilesInTeam(testState, 'junk', {role: 'system_admin'}), []);
        });
        it('getProfilesInTeam with inactive filter', () => {
            const users = [user2, user7].sort(sortByUsername);
            assert.deepEqual(Selectors.getProfilesInTeam(testState, team1.id, {inactive: true}), users);
            assert.deepEqual(Selectors.getProfilesInTeam(testState, 'junk', {inactive: true}), []);
        });
        it('getProfilesInTeam with multiple filters', () => {
            const users = [user7];
            assert.deepEqual(Selectors.getProfilesInTeam(testState, team1.id, {role: 'system_admin', inactive: true}), users);
        });
    });

    it('getProfilesNotInCurrentTeam', () => {
        const users = [user3, user4].sort(sortByUsername);
        assert.deepEqual(Selectors.getProfilesNotInCurrentTeam(testState), users);
    });

    describe('getProfilesWithoutTeam', () => {
        it('getProfilesWithoutTeam', () => {
            const users = [user5, user6].sort(sortByUsername);
            assert.deepEqual(Selectors.getProfilesWithoutTeam(testState), users);
        });
        it('getProfilesWithoutTeam with filter', () => {
            assert.deepEqual(Selectors.getProfilesWithoutTeam(testState, {role: 'system_admin'}), [user6]);
        });
    });

    describe('searchProfiles', () => {
        it('searchProfiles without filter', () => {
            assert.deepEqual(Selectors.searchProfiles(testState, user1.username), [user1]);
            assert.deepEqual(Selectors.searchProfiles(testState, user2.first_name + ' ' + user2.last_name), [user2]);
            assert.deepEqual(Selectors.searchProfiles(testState, user1.username, true), []);
        });

        it('searchProfiles with filters', () => {
            assert.deepEqual(Selectors.searchProfiles(testState, user1.username, false, {role: 'system_admin'}), [user1]);
            assert.deepEqual(Selectors.searchProfiles(testState, user3.username, false, {role: 'system_admin'}), []);
            assert.deepEqual(Selectors.searchProfiles(testState, user3.username, false, {inactive: true}), []);
            assert.deepEqual(Selectors.searchProfiles(testState, user2.username, false, {inactive: true}), [user2]);
        });
    });

    it('searchProfilesInCurrentChannel', () => {
        assert.deepEqual(Selectors.searchProfilesInCurrentChannel(testState, user1.username), [user1]);
        assert.deepEqual(Selectors.searchProfilesInCurrentChannel(testState, user1.username, true), []);
    });

    it('searchProfilesNotInCurrentChannel', () => {
        assert.deepEqual(Selectors.searchProfilesNotInCurrentChannel(testState, user2.username), [user2]);
        assert.deepEqual(Selectors.searchProfilesNotInCurrentChannel(testState, user2.username, true), [user2]);
    });

    it('searchProfilesInCurrentTeam', () => {
        assert.deepEqual(Selectors.searchProfilesInCurrentTeam(testState, user1.username), [user1]);
        assert.deepEqual(Selectors.searchProfilesInCurrentTeam(testState, user1.username, true), []);
    });

    describe('searchProfilesInTeam', () => {
        it('searchProfilesInTeam without filter', () => {
            assert.deepEqual(Selectors.searchProfilesInTeam(testState, team1.id, user1.username), [user1]);
            assert.deepEqual(Selectors.searchProfilesInTeam(testState, team1.id, user1.username, true), []);
        });
        it('searchProfilesInTeam with filter', () => {
            assert.deepEqual(Selectors.searchProfilesInTeam(testState, team1.id, user1.username, false, {role: 'system_admin'}), [user1]);
            assert.deepEqual(Selectors.searchProfilesInTeam(testState, team1.id, user1.username, false, {inactive: true}), []);
        });
        it('getProfiles with multiple filters', () => {
            const users = [user7];
            assert.deepEqual(Selectors.searchProfilesInTeam(testState, team1.id, user7.username, false, {role: 'system_admin', inactive: true}), users);
        });
    });

    it('searchProfilesNotInCurrentTeam', () => {
        assert.deepEqual(Selectors.searchProfilesNotInCurrentTeam(testState, user3.username), [user3]);
        assert.deepEqual(Selectors.searchProfilesNotInCurrentTeam(testState, user3.username, true), [user3]);
    });

    describe('searchProfilesWithoutTeam', () => {
        it('searchProfilesWithoutTeam without filter', () => {
            assert.deepEqual(Selectors.searchProfilesWithoutTeam(testState, user5.username), [user5]);
            assert.deepEqual(Selectors.searchProfilesWithoutTeam(testState, user5.username, true), [user5]);
        });
        it('searchProfilesWithoutTeam with filter', () => {
            assert.deepEqual(Selectors.searchProfilesWithoutTeam(testState, user6.username, false, {role: 'system_admin'}), [user6]);
            assert.deepEqual(Selectors.searchProfilesWithoutTeam(testState, user5.username, false, {inactive: true}), []);
        });
    });
    it('isCurrentUserSystemAdmin', () => {
        assert.deepEqual(Selectors.isCurrentUserSystemAdmin(testState), true);
    });

    it('getUserByUsername', () => {
        assert.deepEqual(Selectors.getUserByUsername(testState, user1.username), user1);
    });

    it('getUsersInVisibleDMs', () => {
        assert.deepEqual(Selectors.getUsersInVisibleDMs(testState), [user2]);
    });

    it('getUserByEmail', () => {
        assert.deepEqual(Selectors.getUserByEmail(testState, user1.email), user1);
        assert.deepEqual(Selectors.getUserByEmail(testState, user2.email), user2);
    });

    it('makeGetProfilesInChannel', () => {
        const getProfilesInChannel = Selectors.makeGetProfilesInChannel();
        assert.deepEqual(getProfilesInChannel(testState, channel1.id), [user1]);

        const users = [user1, user2].sort(sortByUsername);
        assert.deepEqual(getProfilesInChannel(testState, channel2.id), users);
        assert.deepEqual(getProfilesInChannel(testState, channel2.id, true), [user1]);

        assert.deepEqual(getProfilesInChannel(testState, 'nonexistentid'), []);
        assert.deepEqual(getProfilesInChannel(testState, 'nonexistentid'), []);
    });

    it('makeGetProfilesInChannel, unknown user id in channel', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profilesInChannel: {
                        ...testState.entities.users.profilesInChannel,
                        [channel1.id]: new Set([...testState.entities.users.profilesInChannel[channel1.id], 'unknown']),
                    },
                },
            },
        };

        const getProfilesInChannel = Selectors.makeGetProfilesInChannel();
        assert.deepEqual(getProfilesInChannel(state, channel1.id), [user1]);
        assert.deepEqual(getProfilesInChannel(state, channel1.id, true), [user1]);
    });

    it('makeGetProfilesNotInChannel', () => {
        const getProfilesNotInChannel = Selectors.makeGetProfilesNotInChannel();

        assert.deepEqual(getProfilesNotInChannel(testState, channel1.id, true), [user3].sort(sortByUsername));
        assert.deepEqual(getProfilesNotInChannel(testState, channel1.id), [user2, user3].sort(sortByUsername));

        assert.deepEqual(getProfilesNotInChannel(testState, channel2.id, true), [user4, user5].sort(sortByUsername));
        assert.deepEqual(getProfilesNotInChannel(testState, channel2.id), [user4, user5].sort(sortByUsername));

        assert.deepEqual(getProfilesNotInChannel(testState, 'nonexistentid'), []);
        assert.deepEqual(getProfilesNotInChannel(testState, 'nonexistentid'), []);
    });

    it('makeGetProfilesByIdsAndUsernames', () => {
        const getProfilesByIdsAndUsernames = Selectors.makeGetProfilesByIdsAndUsernames();

        const testCases = [
            {input: {allUserIds: [], allUsernames: []}, output: []},
            {input: {allUserIds: ['nonexistentid'], allUsernames: ['nonexistentid']}, output: []},
            {input: {allUserIds: [user1.id], allUsernames: []}, output: [user1]},
            {input: {allUserIds: [user1.id]}, output: [user1]},
            {input: {allUserIds: [user1.id, 'nonexistentid']}, output: [user1]},
            {input: {allUserIds: [user1.id, user2.id]}, output: [user1, user2]},
            {input: {allUserIds: ['nonexistentid', user1.id, user2.id]}, output: [user1, user2]},
            {input: {allUserIds: [], allUsernames: [user1.username]}, output: [user1]},
            {input: {allUsernames: [user1.username]}, output: [user1]},
            {input: {allUsernames: [user1.username, 'nonexistentid']}, output: [user1]},
            {input: {allUsernames: [user1.username, user2.username]}, output: [user1, user2]},
            {input: {allUsernames: [user1.username, 'nonexistentid', user2.username]}, output: [user1, user2]},
            {input: {allUserIds: [user1.id], allUsernames: [user2.username]}, output: [user1, user2]},
            {input: {allUserIds: [user1.id, user2.id], allUsernames: [user3.username, user4.username]}, output: [user1, user2, user3, user4]},
            {input: {allUserIds: [user1.username, user2.username], allUsernames: [user3.id, user4.id]}, output: []},
        ];

        testCases.forEach((testCase) => {
            assert.deepEqual(getProfilesByIdsAndUsernames(testState, testCase.input.allUserIds, testCase.input.allUsernames), testCase.output);
        });
    });

    it('makeGetProfilesByIds', () => {
        const getProfilesByIds = Selectors.makeGetProfilesByIds();

        const testCases = [
            {input: [], output: []},
            {input: ['nonexistentid'], output: []},
            {input: [user1.id], output: [user1]},
            {input: [user1.id, 'nonexistentid'], output: [user1]},
            {input: [user1.id, user2.id], output: [user1, user2]},
            {input: ['nonexistentid', user1.id, user2.id], output: [user1, user2]},
        ];

        testCases.forEach((testCase) => {
            assert.deepStrictEqual(getProfilesByIds(testState, testCase.input), testCase.output);
        });
    });

    describe('makeGetDisplayName', () => {
        const testUser1 = {
            ...user1,
            id: 'test_user_id',
            username: 'username',
            first_name: 'First',
            last_name: 'Last',
        };
        const newProfiles = {
            ...profiles,
            [testUser1.id]: testUser1,
        };
        it('Should show full name since preferences is being used and LockTeammateNameDisplay is false', () => {
            const newTestState = {
                entities: {
                    users: {profiles: newProfiles},
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: {
                                value: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME,
                            },
                        },
                    },
                    general: {
                        config: {
                            TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_USERNAME,
                            LockTeammateNameDisplay: 'false',
                        },
                        license: {
                            LockTeammateNameDisplay: 'true',
                        },
                    },
                },
            };
            assert.deepEqual(Selectors.makeGetDisplayName()(newTestState, testUser1.id), 'First Last');
        });
        it('Should show show username since LockTeammateNameDisplay is true', () => {
            const newTestState = {
                entities: {
                    users: {profiles: newProfiles},
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: {
                                value: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME,
                            },
                        },
                    },
                    general: {
                        config: {
                            TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_USERNAME,
                            LockTeammateNameDisplay: 'true',
                        },
                        license: {
                            LockTeammateNameDisplay: 'true',
                        },
                    },
                },
            };
            assert.deepEqual(Selectors.makeGetDisplayName()(newTestState, testUser1.id), 'username');
        });
        it('Should show full name since license is false', () => {
            const newTestState = {
                entities: {
                    users: {profiles: newProfiles},
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: {
                                value: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME,
                            },
                        },
                    },
                    general: {
                        config: {
                            TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_USERNAME,
                            LockTeammateNameDisplay: 'true',
                        },
                        license: {
                            LockTeammateNameDisplay: 'false',
                        },
                    },
                },
            };
            assert.deepEqual(Selectors.makeGetDisplayName()(newTestState, testUser1.id), 'First Last');
        });
        it('Should show full name since license is not available', () => {
            const newTestState = {
                entities: {
                    users: {profiles: newProfiles},
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: {
                                value: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME,
                            },
                        },
                    },
                    general: {
                        config: {
                            TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_USERNAME,
                            LockTeammateNameDisplay: 'true',
                        },
                    },
                },
            };
            assert.deepEqual(Selectors.makeGetDisplayName()(newTestState, testUser1.id), 'First Last');
        });
        it('Should show Full name since license is not available and lock teammate name display is false', () => {
            const newTestState = {
                entities: {
                    users: {profiles: newProfiles},
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: {
                                value: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME,
                            },
                        },
                    },
                    general: {
                        config: {
                            TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_USERNAME,
                            LockTeammateNameDisplay: 'false',
                        },
                    },
                },
            };
            assert.deepEqual(Selectors.makeGetDisplayName()(newTestState, testUser1.id), 'First Last');
        });
        it('Should show username since no settings are available (falls back to default)', () => {
            const newTestState = {
                entities: {
                    users: {profiles: newProfiles},
                    preferences: {
                        myPreferences: {
                            [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: {
                            },
                        },
                    },
                    general: {
                        config: {
                        },
                    },
                },
            };
            assert.deepEqual(Selectors.makeGetDisplayName()(newTestState, testUser1.id), 'username');
        });
    });

    it('shouldShowTermsOfService', () => {
        const userId = 1234;

        // Test latest terms not accepted
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last'},
                    },
                },
            },
        }), true);

        // Test Feature disabled
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'false',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last'},
                    },
                },
            },
        }), false);

        // Test unlicensed
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'false',
                    },
                },
                users: {
                    currentUserId: userId,
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last'},
                    },
                },
            },
        }), false);

        // Test terms already accepted
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', terms_of_service_id: '1', terms_of_service_create_at: new Date().getTime()},
                    },
                },
            },
        }), false);

        // Test not logged in
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    profiles: {},
                },
            },
        }), false);
    });
});

