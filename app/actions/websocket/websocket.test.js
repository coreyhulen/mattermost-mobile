// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-import-assign */

import assert from 'assert';

import {Server, WebSocket as MockWebSocket} from 'mock-socket';
import nock from 'nock';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as Actions from '@actions/websocket';
import {Client4} from '@client/rest';
import {WebsocketEvents} from '@constants';
import {UserTypes} from '@mm-redux/action_types';
import {notVisibleUsersActions} from '@mm-redux/actions/helpers';
import {General, Posts, RequestStatus} from '@mm-redux/constants';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

global.WebSocket = MockWebSocket;

const mockConfigRequest = (config = {}) => {
    nock(Client4.getBaseRoute()).
        get('/config/client?format=old').
        reply(200, config);
};

const mockChanelsRequest = (teamId, channels = []) => {
    nock(Client4.getUserRoute('me')).
        get(`/teams/${teamId}/channels?include_deleted=true&last_delete_at=0`).
        reply(200, channels);
};

const mockGetKnownUsersRequest = (userIds = []) => {
    nock(Client4.getBaseRoute()).
        get('/users/known').
        reply(200, userIds);
};

const mockRolesRequest = (rolesToLoad = []) => {
    nock(Client4.getRolesRoute()).
        post('/names', JSON.stringify(rolesToLoad)).
        reply(200, rolesToLoad);
};

const mockTeamMemberRequest = (tm = []) => {
    nock(Client4.getUserRoute('me')).
        get('/teams/members').
        reply(200, tm);
};

describe('Actions.Websocket', () => {
    let store;
    let mockServer;
    beforeAll(async () => {
        store = await configureStore();
        await TestHelper.initBasic(Client4);

        const connUrl = (Client4.getUrl() + '/api/v4/websocket').replace(/^http:/, 'ws:');
        mockServer = new Server(connUrl);
        return store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));
    });

    afterAll(async () => {
        Actions.close()();
        mockServer.stop();
        await TestHelper.tearDown();
    });

    it('WebSocket Connect', () => {
        const ws = store.getState().requests.general.websocket;
        assert.ok(ws.status === RequestStatus.SUCCESS);
    });
});

describe('Actions.Websocket doReconnect', () => {
    const mockStore = configureMockStore([thunk]);
    const me = TestHelper.fakeUserWithId();
    const team = TestHelper.fakeTeamWithId();
    const teamMember = TestHelper.fakeTeamMember(me.id, team.id);
    const channel1 = TestHelper.fakeChannelWithId(team.id);
    const channel2 = TestHelper.fakeChannelWithId(team.id);
    const cMember1 = TestHelper.fakeChannelMember(me.id, channel1.id);
    const cMember2 = TestHelper.fakeChannelMember(me.id, channel2.id);

    const currentTeamId = team.id;
    const currentUserId = me.id;
    const currentChannelId = channel1.id;

    const initialState = {
        entities: {
            general: {
                config: {},
            },
            teams: {
                currentTeamId,
                myMembers: {
                    [currentTeamId]: teamMember,
                },
                teams: {
                    [currentTeamId]: team,
                },
            },
            channels: {
                currentChannelId,
                channels: {
                    currentChannelId: channel1,
                },
            },
            users: {
                currentUserId,
                profiles: {
                    [me.id]: me,
                },
            },
            preferences: {
                myPreferences: {},
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
        },
        websocket: {
            connected: false,
            lastConnectAt: 0,
            lastDisconnectAt: 0,
        },
    };

    beforeAll(async () => {
        return TestHelper.initBasic(Client4);
    });

    beforeEach(() => {
        nock(Client4.getBaseRoute()).
            get('/users/me').
            reply(200, me);

        nock(Client4.getUserRoute('me')).
            get('/teams').
            reply(200, [team]);

        nock(Client4.getUserRoute('me')).
            get('/teams/unread').
            reply(200, [{id: team.id, msg_count: 0, mention_count: 0}]);

        nock(Client4.getBaseRoute()).
            get('/users/me/preferences').
            reply(200, []);

        nock(Client4.getUserRoute('me')).
            get(`/teams/${team.id}/channels/members`).
            reply(200, [cMember1, cMember2]);

        nock(Client4.getChannelRoute(channel1.id)).
            get(`/posts?page=0&per_page=${Posts.POST_CHUNK_SIZE}`).
            reply(200, {
                posts: {
                    post1: {id: 'post1', create_at: 0, message: 'hey'},
                },
                order: ['post1'],
            });
    });

    afterAll(async () => {
        Actions.close()();
        await TestHelper.tearDown();
    });

    it('handle doReconnect', async () => {
        const state = {...initialState};
        const testStore = await mockStore(state);
        const timestamp = 1000;
        const expectedActions = [
            'BATCH_WS_SUCCESS',
        ];
        const expectedMissingActions = [
            'BATCH_WS_RECONNECT',
        ];

        mockConfigRequest();
        mockTeamMemberRequest([teamMember]);
        mockChanelsRequest(team.id, [channel1, channel2]);

        let rolesToLoad = Array.from(new Set(me.roles.split(' ').
            concat(teamMember.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        rolesToLoad = Array.from(new Set(cMember1.roles.split(' ').
            concat(cMember2.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        await testStore.dispatch(Actions.doReconnect(timestamp));
        await TestHelper.wait(300);
        const actionTypes = testStore.getActions().map((a) => a.type);
        expect(actionTypes).toEqual(expectedActions);
        expect(actionTypes).not.toEqual(expect.arrayContaining(expectedMissingActions));
    });

    it('handle doReconnect after the current channel was archived or the user left it', async () => {
        const state = {
            ...initialState,
            entities: {
                ...initialState.entities,
                channels: {
                    ...initialState.entities.channels,
                    currentChannelId: 'channel-3',
                },
            },
        };
        const testStore = await mockStore(state);
        const timestamp = 1000;
        const expectedActions = [
            'BATCH_WS_SUCCESS',
            'BATCH_WS_RECONNECT',
        ];
        const expectedMissingActions = [
            'BATCH_GET_POSTS_SINCE',
        ];

        mockConfigRequest();
        mockTeamMemberRequest([teamMember]);
        mockChanelsRequest(team.id, [channel1, channel2]);

        let rolesToLoad = Array.from(new Set(me.roles.split(' ').
            concat(teamMember.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        rolesToLoad = Array.from(new Set(cMember1.roles.split(' ').
            concat(cMember2.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        await testStore.dispatch(Actions.doReconnect(timestamp));
        await TestHelper.wait(300);

        const actions = testStore.getActions().map((a) => a.type);

        expect(actions).toEqual(expect.arrayContaining(expectedActions));
        expect(actions).not.toEqual(expect.arrayContaining(expectedMissingActions));
    });

    it('handle doReconnect after the current channel was archived and setting is on', async () => {
        const archived = {
            ...channel1,
            delete_at: 123,
        };
        const state = {
            ...initialState,
            channels: {
                currentChannelId,
                channels: {
                    currentChannelId: archived,
                },
            },
        };
        const testStore = await mockStore(state);
        const timestamp = 1000;
        const expectedActions = [
            'BATCH_WS_SUCCESS',
        ];
        const expectedMissingActions = [
            'BATCH_WS_RECONNECT',
        ];

        mockConfigRequest({ExperimentalViewArchivedChannels: 'true'});
        mockTeamMemberRequest([teamMember]);
        mockChanelsRequest(team.id, [archived, channel2]);

        let rolesToLoad = Array.from(new Set(me.roles.split(' ').
            concat(teamMember.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        rolesToLoad = Array.from(new Set(cMember1.roles.split(' ').
            concat(cMember2.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        await testStore.dispatch(Actions.doReconnect(timestamp));
        await TestHelper.wait(300);

        const actions = testStore.getActions().map((a) => a.type);
        expect(actions).toEqual(expect.arrayContaining(expectedActions));
        expect(actions).not.toEqual(expect.arrayContaining(expectedMissingActions));
    });

    it('handle doReconnect after the current channel was archived and setting is off', async () => {
        const archived = {
            ...channel1,
            delete_at: 123,
        };

        const state = {
            ...initialState,
            channels: {
                currentChannelId,
                channels: {
                    currentChannelId: archived,
                },
            },
        };
        const testStore = await mockStore(state);
        const timestamp = 1000;
        const expectedActions = [
            'BATCH_WS_SUCCESS',
            'BATCH_WS_RECONNECT',
        ];
        const expectedMissingActions = [
            'BATCH_GET_POSTS_SINCE',
        ];

        mockConfigRequest({ExperimentalViewArchivedChannels: 'false'});
        mockTeamMemberRequest([teamMember]);
        mockChanelsRequest(team.id, [archived, channel2]);

        let rolesToLoad = Array.from(new Set(me.roles.split(' ').
            concat(teamMember.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        rolesToLoad = Array.from(new Set(cMember1.roles.split(' ').
            concat(cMember2.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        await testStore.dispatch(Actions.doReconnect(timestamp));
        await TestHelper.wait(300);

        const actions = testStore.getActions().map((a) => a.type);
        expect(actions).toEqual(expectedActions);
        expect(actions).not.toEqual(expect.arrayContaining(expectedMissingActions));
    });

    it('handle doReconnect after user left current team', async () => {
        const state = {...initialState};
        state.entities.teams.myMembers = {};
        const testStore = await mockStore(state);
        const timestamp = 1000;
        const expectedActions = [
            'BATCH_WS_SUCCESS',
            'BATCH_WS_LEAVE_TEAM',
            'BATCH_WS_RECONNECT',
        ];
        const expectedMissingActions = [
            'BATCH_GET_POSTS_SINCE',
        ];

        mockConfigRequest();
        mockTeamMemberRequest([]);
        mockChanelsRequest(team.id, [channel1, channel2]);

        let rolesToLoad = me.roles.split(' ');
        mockRolesRequest(rolesToLoad);

        rolesToLoad = Array.from(new Set(cMember1.roles.split(' ').
            concat(cMember2.roles.split(' '))));
        mockRolesRequest(rolesToLoad);

        await testStore.dispatch(Actions.doReconnect(timestamp));
        await TestHelper.wait(300);
        const actions = testStore.getActions().map((a) => a.type);
        expect(actions).toEqual(expectedActions);
        expect(actions).not.toEqual(expect.arrayContaining(expectedMissingActions));
    });
});

describe('Actions.Websocket notVisibleUsersActions', () => {
    configureMockStore([thunk]);

    const me = TestHelper.fakeUserWithId();
    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();
    const user4 = TestHelper.fakeUserWithId();
    const user5 = TestHelper.fakeUserWithId();

    it('should do nothing if the known users and the profiles list are the same', async () => {
        const profiles = {
            [me.id]: me,
            [user.id]: user,
            [user2.id]: user2,
            [user3.id]: user3,
        };
        Client4.serverVersion = '5.23.0';

        const state = {
            entities: {
                users: {
                    currentUserId: me.id,
                    profiles,
                },
            },
        };

        mockGetKnownUsersRequest([user.id, user2.id, user3.id]);

        const actions = await notVisibleUsersActions(state);
        expect(actions.length).toEqual(0);
    });

    it('should do nothing if there are known users in my memberships but not in the profiles list', async () => {
        const profiles = {
            [me.id]: me,
            [user3.id]: user3,
        };
        Client4.serverVersion = '5.23.0';

        const state = {
            entities: {
                users: {
                    currentUserId: me.id,
                    profiles,
                },
            },
        };

        mockGetKnownUsersRequest([user.id, user2.id, user3.id]);

        const actions = await notVisibleUsersActions(state);
        expect(actions.length).toEqual(0);
    });

    it('should remove the users if there are unknown users in the profiles list', async () => {
        const profiles = {
            [me.id]: me,
            [user.id]: user,
            [user2.id]: user2,
            [user3.id]: user3,
            [user4.id]: user4,
            [user5.id]: user5,
        };
        Client4.serverVersion = '5.23.0';

        const state = {
            entities: {
                users: {
                    currentUserId: me.id,
                    profiles,
                },
            },
        };

        mockGetKnownUsersRequest([user.id, user3.id]);

        const expectedAction = [
            {type: UserTypes.PROFILE_NO_LONGER_VISIBLE, data: {user_id: user2.id}},
            {type: UserTypes.PROFILE_NO_LONGER_VISIBLE, data: {user_id: user4.id}},
            {type: UserTypes.PROFILE_NO_LONGER_VISIBLE, data: {user_id: user5.id}},
        ];
        const actions = await notVisibleUsersActions(state);
        expect(actions.length).toEqual(3);
        expect(actions).toEqual(expectedAction);
    });

    it('should do nothing if the server version is less than 5.23', async () => {
        const profiles = {
            [me.id]: me,
            [user.id]: user,
            [user2.id]: user2,
            [user3.id]: user3,
            [user4.id]: user4,
            [user5.id]: user5,
        };
        Client4.serverVersion = '5.22.0';

        const state = {
            entities: {
                users: {
                    currentUserId: me.id,
                    profiles,
                },
            },
        };

        mockGetKnownUsersRequest([user.id, user3.id]);

        const actions = await notVisibleUsersActions(state);
        expect(actions.length).toEqual(0);
    });
});

describe('Actions.Websocket handleUserTypingEvent', () => {
    const mockStore = configureMockStore([thunk]);

    const currentUserId = 'user-id';
    const otherUserId = 'other-user-id';
    const currentChannelId = 'channel-id';
    const otherChannelId = 'other-channel-id';

    const initialState = {
        entities: {
            general: {
                config: {},
            },
            channels: {
                currentChannelId,
                channels: {
                    currentChannelId: {
                        id: currentChannelId,
                        name: 'channel',
                    },
                },
            },
            users: {
                currentUserId,
                profiles: {
                    [currentUserId]: {},
                    [otherUserId]: {},
                },
                statuses: {
                    [currentUserId]: General.ONLINE,
                    [otherUserId]: General.OFFLINE,
                },
            },
            preferences: {
                myPreferences: {},
            },
        },
    };

    it('dispatches actions for current channel if other user is typing', async () => {
        const state = {...initialState};
        const testStore = await mockStore(state);
        const msg = {broadcast: {channel_id: currentChannelId}, data: {parent_id: 'parent-id', user_id: otherUserId}};

        nock(Client4.getUsersRoute()).
            post('/status/ids', JSON.stringify([otherUserId])).
            reply(200, ['away']);

        const expectedActionsTypes = [
            WebsocketEvents.TYPING,
            UserTypes.RECEIVED_STATUSES,
        ];

        await testStore.dispatch(Actions.handleUserTypingEvent(msg));
        await TestHelper.wait(300);
        const actionTypes = testStore.getActions().map((action) => action.type);
        expect(actionTypes).toEqual(expectedActionsTypes);
    });

    it('does not dispatch actions for non current channel', async () => {
        const state = {...initialState};
        const testStore = await mockStore(state);
        const msg = {broadcast: {channel_id: otherChannelId}, data: {parent_id: 'parent-id', user_id: otherUserId}};

        const expectedActionsTypes = [];

        await testStore.dispatch(Actions.handleUserTypingEvent(msg));
        const actionTypes = testStore.getActions().map((action) => action.type);
        expect(actionTypes).toEqual(expectedActionsTypes);
    });
});
