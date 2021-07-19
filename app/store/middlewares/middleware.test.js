// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable max-nested-callbacks */

import DeviceInfo from 'react-native-device-info';

import assert from 'assert';
import {REHYDRATE} from 'redux-persist';
import merge from 'deepmerge';

import {ViewTypes} from '@constants';
import initialState from '@store/initial_state';
import {
    cleanUpPostsInChannel,
    cleanUpState,
    cleanUpThreadsInTeam,
    getAllFromPostsInChannel,
} from './helpers';
import messageRetention from './message_retention';

describe('messageRetention', () => {
    describe('should chain the same incoming action type', () => {
        const actions = [
            {
                type: 'persist/REHYDRATE',
                payload: {
                    views: {
                        team: {
                        },
                    },
                },
            },
            {
                type: ViewTypes.DATA_CLEANUP,
                payload: {
                    entities: {
                        channels: {
                        },
                        posts: {
                        },
                        general: {
                            config: {},
                        },
                        preferences: {
                            myPreferences: {},
                        },
                    },
                    views: {
                        team: {
                        },
                    },
                },
            },
            {
                type: 'other',
            },
        ];

        actions.forEach((action) => {
            it(`for action type ${action.type}`, () => {
                const store = {};
                const next = (a) => a;

                const nextAction = messageRetention(store)(next)(action);
                assert.equal(action.type, nextAction.type);
            });
        });
    });

    describe('should add build, version, and previousVersion to payload.app on persist/REHYDRATE', () => {
        const next = (a) => a;
        const store = {};
        const build = 'build';
        const version = 'version';
        const previousBuild = 'previous-build';
        const previousVersion = 'previous-version';
        DeviceInfo.getBuildNumber = jest.fn().mockReturnValue('build');
        DeviceInfo.getVersion = jest.fn().mockReturnValue('version');
        const rehydrateAction = {
            type: REHYDRATE,
            payload: {
                app: {
                    build: previousBuild,
                    version: previousVersion,
                },
            },
        };
        const expectedPayloadApp = {
            build,
            version,
            previousVersion,
        };
        const entities = {
            channels: {},
            general: {
                config: {},
            },
            posts: {},
            preferences: {
                myPreferences: {},
            },
        };
        const views = {
            team: {
                lastChannelForTeam: {},
            },
        };

        test('when entities is missing', () => {
            const action = {...rehydrateAction};

            const nextAction = messageRetention(store)(next)(action);
            expect(nextAction.payload.app).toStrictEqual(expectedPayloadApp);
        });

        test('when views is missing', () => {
            const action = {
                ...rehydrateAction,
                payload: {
                    ...rehydrateAction.payload,
                    entities,
                },
            };

            const nextAction = messageRetention(store)(next)(action);
            expect(nextAction.payload.app).toStrictEqual(expectedPayloadApp);
        });

        test('when previousVersion !== version', () => {
            const action = {
                ...rehydrateAction,
                payload: {
                    ...rehydrateAction.payload,
                    entities,
                    views,
                },
            };
            expect(action.payload.app.version).not.toEqual(DeviceInfo.getVersion());

            const nextAction = messageRetention(store)(next)(action);
            expect(nextAction.payload.app).toStrictEqual(expectedPayloadApp);
        });

        test('when previousBuild !== build', () => {
            const action = {
                ...rehydrateAction,
                payload: {
                    ...rehydrateAction.payload,
                    app: {
                        ...rehydrateAction.payload.app,
                        version: DeviceInfo.getVersion(),
                    },
                    entities,
                    views,
                },
            };
            expect(action.payload.app.version).toEqual(DeviceInfo.getVersion());
            expect(action.payload.app.build).not.toEqual(DeviceInfo.getBuildNumber());

            const nextAction = messageRetention(store)(next)(action);
            expect(nextAction.payload.app).toStrictEqual({
                ...expectedPayloadApp,
                previousVersion: DeviceInfo.getVersion(),
            });
        });

        test('when cleanUpState', () => {
            const action = {
                ...rehydrateAction,
                payload: {
                    ...rehydrateAction.payload,
                    app: {
                        ...rehydrateAction.payload.app,
                        version: DeviceInfo.getVersion(),
                        build: DeviceInfo.getBuildNumber(),
                    },
                    entities,
                    views,
                },
            };
            expect(action.payload.app.version).toEqual(DeviceInfo.getVersion());
            expect(action.payload.app.build).toEqual(DeviceInfo.getBuildNumber());

            const nextAction = messageRetention(store)(next)(action);
            expect(nextAction.payload.app).toStrictEqual({
                ...expectedPayloadApp,
                previousVersion: DeviceInfo.getVersion(),
            });
        });
    });
});

describe('cleanUpState', () => {
    test('should remove post because of data retention', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                files: {
                    fileIdsByPostId: {},
                },
                general: {
                    config: {},
                    dataRetention: {
                        policies: {
                            global: {
                                message_deletion_enabled: true,
                                message_retention_cutoff: 1000,
                            },
                        },
                    },
                },
                posts: {
                    posts: {
                        post1: {id: 'post1', channel_id: 'channel1', create_at: 1000},
                        post2: {id: 'post2', channel_id: 'channel1', create_at: 999},
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post1', 'post2'], recent: true},
                        ],
                    },
                    postsInThread: {},
                    reactions: {},
                },
                preferences: {
                    myPreferences: {},
                },
                search: {
                    results: ['post1', 'post2'],
                    flagged: ['post1', 'post2', 'post3'],
                },
            },
            views: {
                team: {
                    lastChannelForTeam: {
                        team1: ['channel1'],
                    },
                },
            },
        };

        const result = cleanUpState(state);

        expect(result.entities.posts.posts.post1).toBeDefined();
        expect(result.entities.posts.posts.post2).toBeUndefined();
        expect(result.entities.posts.postsInChannel.channel1).toEqual([{order: ['post1'], recent: true}]);
        expect(result.entities.search.results).toEqual(['post1', 'post2']);
        expect(result.entities.search.flagged).toEqual(['post1', 'post2', 'post3']);
    });

    test('should migrate dataRetentionPolicy key to granular data retention structure', () => {
        const dataRetentionPolicy = {
            file_deletion_enabled: false,
            file_retention_cutoff: 0,
            message_deletion_enabled: false,
            message_retention_cutoff: 0,
        };

        const state = {
            entities: {
                general: {
                    dataRetentionPolicy,
                },
            },
        };

        const result = cleanUpState(state);

        expect(result.entities.general.dataRetentionPolicy).toBeUndefined();
        expect(result.entities.general.dataRetention.policies.global).toEqual(dataRetentionPolicy);
    });

    test('should remove post because of granular data retention', () => {
        const getCreateAtBeforeDays = (days) => {
            const date = new Date();
            date.setDate(date.getDate() - days);
            return date.getTime();
        };
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                    channelsInTeam: {
                        team1: new Set(['team1_channel1', 'team1_channel2']),
                        team2: new Set(['team2_channel1', 'team2_channel2']),
                    },
                },
                files: {
                    fileIdsByPostId: {},
                },
                general: {
                    dataRetention: {
                        policies: {
                            teams: [{
                                post_duration: 5,
                                team_id: 'team1',
                            }, {
                                post_duration: 10,
                                team_id: 'team2',
                            }],
                            channels: [{
                                post_duration: 2,
                                channel_id: 'team1_channel1',
                            }],
                        },
                    },
                },
                posts: {
                    posts: {

                        // Team 1 - Channel 1, Channel Policy - 2 Days
                        post1: {id: 'post1', channel_id: 'team1_channel1', create_at: getCreateAtBeforeDays(1)},
                        post2: {id: 'post2', channel_id: 'team1_channel1', create_at: getCreateAtBeforeDays(3)}, // X

                        // Team 1 - Channel 2, Team Policy - 5 Days
                        post3: {id: 'post3', channel_id: 'team1_channel2', create_at: getCreateAtBeforeDays(3)},
                        post4: {id: 'post4', channel_id: 'team1_channel2', create_at: getCreateAtBeforeDays(6)}, // X

                        // Team 2, Channel 1 & 2, Team Policy - 10 Days
                        post5: {id: 'post5', channel_id: 'team2_channel1', create_at: getCreateAtBeforeDays(9)},
                        post6: {id: 'post6', channel_id: 'team2_channel2', create_at: getCreateAtBeforeDays(11)}, // X
                    },
                    postsInChannel: {
                        team1_channel1: [
                            {order: ['post1', 'post2'], recent: true},
                        ],
                        team1_channel2: [
                            {order: ['post3', 'post4'], recent: true},
                        ],
                        team2_channel1: [
                            {order: ['post5'], recent: true},
                        ],
                        team2_channel2: [
                            {order: ['post6'], recent: true},
                        ],
                    },
                    postsInThread: {},
                    reactions: {},
                },
                search: {
                    results: [],
                    flagged: [],
                },
            },
            views: {
                team: {
                    lastChannelForTeam: {
                        team1: ['team1_channel1', 'team1_channel2'],
                        team2: ['team2_channel1', 'team2_channel2'],
                    },
                },
            },
        };

        const result = cleanUpState(state);

        expect(result.entities.posts.posts.post1).toBeDefined();
        expect(result.entities.posts.posts.post2).toBeUndefined();

        expect(result.entities.posts.posts.post3).toBeDefined();
        expect(result.entities.posts.posts.post4).toBeUndefined();

        expect(result.entities.posts.posts.post5).toBeDefined();
        expect(result.entities.posts.posts.post6).toBeUndefined();
    });

    test('should keep failed pending post', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                files: {
                    fileIdsByPostId: {},
                },
                general: {
                    config: {},
                },
                posts: {
                    pendingPostIds: ['pending'],
                    posts: {
                        pending: {id: 'pending', pending_post_id: 'pending', channel_id: 'channel1', failed: true},
                        post1: {id: 'post1', channel_id: 'channel1'},
                        post2: {id: 'post2', channel_id: 'channel1'},
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['pending', 'post1', 'post2'], recent: true},
                        ],
                    },
                    postsInThread: {},
                    reactions: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
            views: {
                team: {
                    lastChannelForTeam: {
                        team1: ['channel1'],
                    },
                },
            },
        };

        const result = cleanUpState(state);

        expect(result.entities.posts.pendingPostIds).toEqual(['pending']);
        expect(result.entities.posts.posts.pending).toBeDefined();
        expect(result.entities.posts.postsInChannel.channel1).toEqual([{order: ['pending', 'post1', 'post2'], recent: true}]);
    });

    test('should remove non-failed pending post', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                files: {
                    fileIdsByPostId: {},
                },
                general: {
                    config: {},
                },
                posts: {
                    pendingPostIds: ['pending'],
                    posts: {
                        pending: {id: 'pending', pending_post_id: 'pending', channel_id: 'channel1'},
                        post1: {id: 'post1', channel_id: 'channel1'},
                        post2: {id: 'post2', channel_id: 'channel1'},
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['pending', 'post1', 'post2'], recent: true},
                        ],
                    },
                    postsInThread: {},
                    reactions: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
            views: {
                team: {
                    lastChannelForTeam: {
                        team1: ['channel1'],
                    },
                },
            },
        };

        const result = cleanUpState(state);

        expect(result.entities.posts.pendingPostIds).toEqual([]);
        expect(result.entities.posts.posts.pending).toBeUndefined();
        expect(result.entities.posts.postsInChannel.channel1).toEqual([{order: ['post1', 'post2'], recent: true}]);
    });

    test('should remove non-existent pending post', () => {
        const state = {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                files: {
                    fileIdsByPostId: {},
                },
                general: {
                    config: {},
                },
                posts: {
                    pendingPostIds: ['pending'],
                    posts: {
                        post1: {id: 'post1', channel_id: 'channel1'},
                        post2: {id: 'post2', channel_id: 'channel1'},
                    },
                    postsInChannel: {
                        channel1: [
                            {order: ['post1', 'post2'], recent: true},
                        ],
                    },
                    postsInThread: {},
                    reactions: {},
                },
                preferences: {
                    myPreferences: {},
                },
            },
            views: {
                team: {
                    lastChannelForTeam: {
                        team1: ['channel1'],
                    },
                },
            },
        };

        const result = cleanUpState(state);

        expect(result.entities.posts.pendingPostIds).toEqual([]);
        expect(result.entities.posts.postsInChannel.channel1).toEqual([{order: ['post1', 'post2'], recent: true}]);
    });

    test('should always set _persist.rehydrated to true', () => {
        const persistValues = [
            null,
            {},
            {rehydrated: false},
            {rehydrated: true},
        ];

        for (let i = 0; i < persistValues.length; i++) {
            const _persist = persistValues[i]; // eslint-disable-line no-underscore-dangle
            const state = merge(initialState, {
                // eslint-disable-next-line no-underscore-dangle
                _persist,
            });

            const result = cleanUpState(state);
            expect(result._persist.rehydrated).toBe(true); // eslint-disable-line no-underscore-dangle
        }
    });

    test('should set views.root.hydrationComplete to true when previous views.root.hydrationComplete is true', () => {
        const state = merge(initialState, {
            views: {
                root: {
                    hydrationComplete: true,
                },
            },
        });

        const result = cleanUpState(state);
        expect(result.views.root.hydrationComplete).toBe(true);
    });

    test('should set views.root.hydrationComplete to !_persist when previous views.root.hydrationComplete is falsy', () => {
        const persistValues = [true, false];
        const viewsValues = [
            {},
            {root: {}},
            {root: {hydrationComplete: false}},
        ];

        for (let i = 0; i < persistValues.length; i++) {
            const _persist = persistValues[i]; // eslint-disable-line no-underscore-dangle
            for (let j = 0; j < viewsValues.length; j++) {
                const views = viewsValues[j];
                const state = merge(initialState, {
                    _persist,
                    views,
                });

                const result = cleanUpState(state);
                expect(result.views.root.hydrationComplete).toBe(!_persist); // eslint-disable-line no-underscore-dangle
            }
        }
    });
});

describe('cleanUpPostsInChannel', () => {
    test('should only keep posts for recently viewed channels', () => {
        const postsInChannel = {
            channel1: [
                {order: ['a', 'b'], recent: true},
            ],
            channel2: [
                {order: ['c', 'd'], recent: true},
            ],
        };
        const lastChannelForTeam = {
            team1: ['channel1'],
        };

        const nextPostsInChannel = cleanUpPostsInChannel(postsInChannel, lastChannelForTeam);

        expect(nextPostsInChannel).toEqual({
            channel1: [
                {order: ['a', 'b'], recent: true},
            ],
        });
    });

    test('should keep posts for recently viewed channels across multiple teams', () => {
        const postsInChannel = {
            channel1: [
                {order: ['a', 'b'], recent: true},
            ],
            channel2: [
                {order: ['c', 'd'], recent: true},
            ],
        };
        const lastChannelForTeam = {
            team1: ['channel1'],
            team2: ['channel2'],
        };

        const nextPostsInChannel = cleanUpPostsInChannel(postsInChannel, lastChannelForTeam);

        expect(nextPostsInChannel).toEqual({
            channel1: [
                {order: ['a', 'b'], recent: true},
            ],
            channel2: [
                {order: ['c', 'd'], recent: true},
            ],
        });
    });

    test('should only keep the last X posts in each channel', () => {
        const postsInChannel = {
            channel1: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
            ],
            channel2: [
                {order: ['e', 'f', 'g', 'h'], recent: true},
            ],
        };
        const lastChannelForTeam = {
            team1: ['channel1', 'channel2'],
        };

        const nextPostsInChannel = cleanUpPostsInChannel(postsInChannel, lastChannelForTeam, '', 2);

        expect(nextPostsInChannel).toEqual({
            channel1: [
                {order: ['a', 'b'], recent: true},
            ],
            channel2: [
                {order: ['e', 'f'], recent: true},
            ],
        });
    });

    test('should only keep the most recent posts in a channel', () => {
        const postsInChannel = {
            channel1: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
                {order: ['e', 'f', 'g', 'h']},
            ],
        };
        const lastChannelForTeam = {
            team1: ['channel1'],
        };

        const nextPostsInChannel = cleanUpPostsInChannel(postsInChannel, lastChannelForTeam, '');

        expect(nextPostsInChannel).toEqual({
            channel1: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
            ],
        });
    });

    test('should keep all posts in the current channel, if specified', () => {
        const postsInChannel = {
            channel1: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
            ],
            channel2: [
                {order: ['e', 'f', 'g', 'h'], recent: true},
            ],
        };
        const lastChannelForTeam = {
            team1: ['channel1', 'channel2'],
        };

        const nextPostsInChannel = cleanUpPostsInChannel(postsInChannel, lastChannelForTeam, 'channel2', 2);

        expect(nextPostsInChannel).toEqual({
            channel1: [
                {order: ['a', 'b'], recent: true},
            ],
            channel2: [
                {order: ['e', 'f', 'g', 'h'], recent: true},
            ],
        });
    });

    test('should not error when a DM/GM channel appears on multiple teams', () => {
        const postsInChannel = {
            dmChannel: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
            ],
        };
        const lastChannelForTeam = {
            team1: ['dmChannel'],
            team2: ['dmChannel'],
        };

        const nextPostsInChannel = cleanUpPostsInChannel(postsInChannel, lastChannelForTeam);

        expect(nextPostsInChannel).toEqual({
            dmChannel: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
            ],
        });
    });

    test('should not error when a recent channel is missing', () => {
        const postsInChannel = {
            channel1: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
            ],
        };
        const lastChannelForTeam = {
            team1: ['channel1', 'channel2'],
        };

        const nextPostsInChannel = cleanUpPostsInChannel(postsInChannel, lastChannelForTeam);

        expect(nextPostsInChannel).toEqual({
            channel1: [
                {order: ['a', 'b', 'c', 'd'], recent: true},
            ],
        });
    });
});

describe.only('cleanUpThreadsInTeam', () => {
    const threadsInTeam = {
        team1: ['thread1', 'thread2', 'thread3'],
        team2: ['thread3', 'thread4', 'thread5'],
        team3: ['thread1', 'thread2', 'thread3', 'thread4'],
    };
    const threads = {
        thread1: {id: 'thread1', last_reply_at: 100},
        thread2: {id: 'thread2', last_reply_at: 99},
        thread3: {id: 'thread3', last_reply_at: 98},
        thread4: {id: 'thread4', last_reply_at: 97},
        thread5: {id: 'thread5', last_reply_at: 96},
        thread6: {id: 'thread6', last_reply_at: 95},
    };

    const {threads: nextThreads, threadsInTeam: nextThreadsInTeam} = cleanUpThreadsInTeam(threads, threadsInTeam, 'team3', 2);

    test('should only keep limited threads per team', () => {
        expect(nextThreadsInTeam.team1).toEqual(['thread1', 'thread2']);
        expect(nextThreadsInTeam.team2).toEqual(['thread3', 'thread4']);
        expect(nextThreads.thread1).toBeTruthy();
        expect(nextThreads.thread5).toBeFalsy();
    });

    test('should not remove the thread if included in one team and not included in another', () => {
        expect(nextThreadsInTeam.team1.indexOf('thread3')).toBe(-1);
        expect(nextThreadsInTeam.team2.indexOf('thread3')).toBeGreaterThan(-1);
        expect(nextThreads.thread3).toBeTruthy();
    });

    test('Should exclude passed teamId', () => {
        expect(nextThreadsInTeam.team3).toEqual(threadsInTeam.team3);
    });
});

describe('getAllFromPostsInChannel', () => {
    test('should return every post ID', () => {
        const postsInChannel = {
            channel1: [
                {order: ['a', 'b']},
                {order: ['c', 'd']},
            ],
            channel2: [
                {order: ['e', 'f']},
            ],
            channel3: [
                {order: ['g', 'h']},
            ],
        };

        const postIds = getAllFromPostsInChannel(postsInChannel);

        expect(postIds).toMatchObject(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    });
});
