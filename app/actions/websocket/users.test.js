// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Server, WebSocket as MockWebSocket} from 'mock-socket';
import {batchActions} from 'redux-batched-actions';

import * as Actions from '@actions/websocket';
import {Client4} from '@client/rest';
import {WebsocketEvents} from '@constants';
import {TeamTypes, UserTypes} from '@mm-redux/action_types';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

global.WebSocket = MockWebSocket;

describe('Websocket User Events', () => {
    let store;
    let mockServer;
    beforeAll(async () => {
        store = await configureStore();
        await TestHelper.initBasic(Client4);

        const connUrl = (Client4.getUrl() + '/api/v4/websocket').replace(/^http:/, 'ws:');
        mockServer = new Server(connUrl);
        store.dispatch(batchActions([
            {type: UserTypes.RECEIVED_ME, data: TestHelper.basicUser},
            {type: TeamTypes.RECEIVED_TEAM, data: TestHelper.basicTeam},
            {type: TeamTypes.RECEIVED_MY_TEAM_MEMBER, data: TestHelper.basicTeamMember},
        ]));
        return store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));
    });

    afterAll(async () => {
        Actions.close()();
        mockServer.stop();
        await TestHelper.tearDown();
    });

    it('Websocket Handle User Added', async () => {
        const user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
        store.dispatch({type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_ADDED, data: {team_id: TestHelper.basicTeam.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));

        const entities = store.getState().entities;
        const profilesInChannel = entities.users.profilesInChannel;
        assert.ok(profilesInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Removed', async () => {
        const user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
        store.dispatch({type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_REMOVED, data: {remover_id: TestHelper.basicUser.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));

        const state = store.getState();
        const entities = state.entities;
        const profilesNotInChannel = entities.users.profilesNotInChannel;

        assert.ok(profilesNotInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Removed when Current is Guest', async () => {
        const basicGuestUser = TestHelper.fakeUserWithId();
        basicGuestUser.roles = 'system_guest';

        const user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};

        // add user first
        store.dispatch({type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_ADDED, data: {team_id: TestHelper.basicTeam.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));

        assert.ok(store.getState().entities.users.profilesInChannel[TestHelper.basicChannel.id].has(user.id));

        // remove user
        store.dispatch({type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_REMOVED, data: {remover_id: basicGuestUser.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));

        assert.ok(!store.getState().entities.users.profilesInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Updated', async () => {
        const user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_UPDATED, data: {user: {id: user.id, create_at: 1495570297229, update_at: 1508253268652, delete_at: 0, username: 'tim', auth_data: '', auth_service: '', email: 'tim@bladekick.com', nickname: '', first_name: 'tester4', last_name: '', position: '', roles: 'system_user', locale: 'en'}}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 53}));

        store.subscribe(() => {
            const state = store.getState();
            const entities = state.entities;
            const profiles = entities.users.profiles;

            assert.strictEqual(profiles[user.id].first_name, 'tester4');
        });
    });
});
