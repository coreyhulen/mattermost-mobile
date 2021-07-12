// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Server, WebSocket as MockWebSocket} from 'mock-socket';
import nock from 'nock';
import {batchActions} from 'redux-batched-actions';

import * as Actions from '@actions/websocket';
import {Client4} from '@client/rest';
import {WebsocketEvents} from '@constants';
import {TeamTypes, UserTypes} from '@mm-redux/action_types';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

global.WebSocket = MockWebSocket;

describe('Websocket Team Events', () => {
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
            {type: TeamTypes.RECEIVED_MY_TEAM_UNREADS, data: [TestHelper.basicTeamMember]},
        ]));
        return store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));
    });

    afterAll(async () => {
        Actions.close()();
        mockServer.stop();
        await TestHelper.tearDown();
    });

    // If we move this test lower it will fail cause of a permissions issue
    it('Websocket handle team updated', async () => {
        const team = {id: '55pfercbm7bsmd11p5cjpgsbwr'};
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.UPDATE_TEAM, data: {team: `{"id":"55pfercbm7bsmd11p5cjpgsbwr","create_at":1495553950859,"update_at":1508250370054,"delete_at":0,"display_name":"${TestHelper.basicTeam.display_name}","name":"${TestHelper.basicTeam.name}","description":"description","email":"","type":"O","company_name":"","allowed_domains":"","invite_id":"m93f54fu5bfntewp8ctwonw19w","allow_open_invite":true}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 26}));

        await TestHelper.wait(300);

        const entities = store.getState().entities;
        const {teams} = entities.teams;
        const updated = teams[team.id];
        assert.ok(updated);
        assert.strictEqual(updated.allow_open_invite, true);
    });

    it('Websocket handle team patched', async () => {
        const team = {id: '55pfercbm7bsmd11p5cjpgsbwr'};
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.UPDATE_TEAM, data: {team: `{"id":"55pfercbm7bsmd11p5cjpgsbwr","create_at":1495553950859,"update_at":1508250370054,"delete_at":0,"display_name":"${TestHelper.basicTeam.display_name}","name":"${TestHelper.basicTeam.name}","description":"description","email":"","type":"O","company_name":"","allowed_domains":"","invite_id":"m93f54fu5bfntewp8ctwonw19w","allow_open_invite":true}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 26}));

        await TestHelper.wait(300);

        const entities = store.getState().entities;
        const {teams} = entities.teams;
        const updated = teams[team.id];
        assert.ok(updated);
        assert.strictEqual(updated.allow_open_invite, true);
    });

    it('Websocket handle user added to team', async () => {
        const team = TestHelper.basicTeam;

        nock(Client4.getBaseRoute()).
            get(`/teams/${team.id}`).
            reply(200, team);

        nock(Client4.getBaseRoute()).
            get('/users/me/teams/unread').
            reply(200, [{team_id: team.id, msg_count: 0, mention_count: 0}]);

        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.ADDED_TO_TEAM, data: {team_id: team.id, user_id: TestHelper.basicUser.id}, broadcast: {omit_users: null, user_id: TestHelper.basicUser.id, channel_id: '', team_id: ''}, seq: 2}));

        await TestHelper.wait(300);

        const {teams, myMembers} = store.getState().entities.teams;
        assert.ok(teams[team.id]);
        assert.ok(myMembers[team.id]);

        const member = myMembers[team.id];
        assert.ok(member.hasOwnProperty('mention_count'));
    });

    it('WebSocket Leave Team', async () => {
        const team = TestHelper.basicTeam;
        store.dispatch(batchActions([
            {type: UserTypes.RECEIVED_ME, data: TestHelper.basicUser},
            {type: TeamTypes.RECEIVED_TEAM, data: TestHelper.basicTeam},
            {type: TeamTypes.RECEIVED_MY_TEAM_MEMBER, data: TestHelper.basicTeamMember},
        ]));
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.LEAVE_TEAM, data: {team_id: team.id, user_id: TestHelper.basicUser.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: team.id}, seq: 35}));

        const {myMembers} = store.getState().entities.teams;
        assert.ifError(myMembers[team.id]);
    });
});
