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
import {ChannelTypes, RoleTypes} from '@mm-redux/action_types';
import * as ChannelActions from '@mm-redux/actions/channels';
import * as TeamActions from '@mm-redux/actions/teams';
import {General} from '@mm-redux/constants';
import globalInitialState from '@store/initial_state';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

global.WebSocket = MockWebSocket;

describe('Websocket Chanel Events', () => {
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

    it('Websocket Handle Channel Member Updated', async () => {
        const channelMember = TestHelper.basicChannelMember;
        const mockStore = configureMockStore([thunk]);
        const st = mockStore(globalInitialState);
        await st.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));
        channelMember.roles = 'channel_user channel_admin';
        const rolesToLoad = channelMember.roles.split(' ');

        nock(Client4.getRolesRoute()).
            post('/names', JSON.stringify(rolesToLoad)).
            reply(200, rolesToLoad);

        mockServer.emit('message', JSON.stringify({
            event: WebsocketEvents.CHANNEL_MEMBER_UPDATED,
            data: {
                channelMember: JSON.stringify(channelMember),
            },
        }));

        await TestHelper.wait(300);
        const storeActions = st.getActions();
        const batch = storeActions.find((a) => a.type === 'BATCH_WS_CHANNEL_MEMBER_UPDATE');
        expect(batch).not.toBeNull();
        const memberAction = batch.payload.find((a) => a.type === ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER);
        expect(memberAction).not.toBeNull();
        const rolesActions = batch.payload.find((a) => a.type === RoleTypes.RECEIVED_ROLES);
        expect(rolesActions).not.toBeNull();
        expect(rolesActions.data).toEqual(rolesToLoad);
    });

    it('Websocket Handle Channel Created', async () => {
        const channelId = TestHelper.basicChannel.id;
        const channel = {id: channelId, display_name: 'test', name: TestHelper.basicChannel.name};
        await store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));
        store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: channel});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_CREATED, data: {channel_id: channelId, team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: 't36kso9nwtdhbm8dbkd6g4eeby', channel_id: '', team_id: ''}, seq: 57}));

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels} = entities.channels;

        assert.ok(channels[channel.id]);
    });

    it('Websocket Handle Channel Updated', async () => {
        const channelName = 'Test name';
        const channelId = TestHelper.basicChannel.id;

        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_UPDATED, data: {channel: `{"id":"${channelId}","create_at":1508253647983,"update_at":1508254198797,"delete_at":0,"team_id":"55pfercbm7bsmd11p5cjpgsbwr","type":"O","display_name":"${channelName}","name":"${TestHelper.basicChannel.name}","header":"header","purpose":"","last_post_at":1508253648004,"total_msg_count":0,"extra_update_at":1508253648001,"creator_id":"${TestHelper.basicUser.id}"}`}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 62}));

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels} = entities.channels;

        assert.strictEqual(channels[channelId].display_name, channelName);
    });

    it('Websocket Handle Channel Deleted', async () => {
        const time = Date.now();
        await store.dispatch(TeamActions.selectTeam(TestHelper.basicTeam));
        await store.dispatch(ChannelActions.selectChannel(TestHelper.basicChannel.id));

        store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: {id: TestHelper.generateId(), name: General.DEFAULT_CHANNEL, team_id: TestHelper.basicTeam.id, display_name: General.DEFAULT_CHANNEL}});
        store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: TestHelper.basicChannel});

        nock(Client4.getUserRoute('me')).
            get(`/teams/${TestHelper.basicTeam.id}/channels/members`).
            reply(201, [{user_id: TestHelper.basicUser.id, channel_id: TestHelper.basicChannel.id}]);

        mockServer.emit('message', JSON.stringify({
            event: WebsocketEvents.CHANNEL_DELETED,
            data: {
                channel_id: TestHelper.basicChannel.id,
                delete_at: time,
            },
            broadcast: {
                omit_users: null,
                user_id: '',
                channel_id: '',
                team_id: TestHelper.basicTeam.id,
            },
            seq: 68,
        }));

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels, currentChannelId} = entities.channels;

        assert.ok(channels[currentChannelId].name === General.DEFAULT_CHANNEL);
    });

    it('Websocket Handle Channel Unarchive', async () => {
        await store.dispatch(TeamActions.selectTeam(TestHelper.basicTeam));
        await store.dispatch(ChannelActions.selectChannel(TestHelper.basicChannel.id));

        store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: {id: TestHelper.generateId(), name: General.DEFAULT_CHANNEL, team_id: TestHelper.basicTeam.id, display_name: General.DEFAULT_CHANNEL}});
        store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: TestHelper.basicChannel});

        nock(Client4.getUserRoute('me')).
            get(`/teams/${TestHelper.basicTeam.id}/channels/members`).
            reply(201, [{user_id: TestHelper.basicUser.id, channel_id: TestHelper.basicChannel.id}]);

        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_UNARCHIVE, data: {channel_id: TestHelper.basicChannel.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: TestHelper.basicTeam.id}, seq: 68}));

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels, currentChannelId} = entities.channels;

        assert.ok(channels[currentChannelId].delete_at === 0);
    });

    it('Websocket Handle Direct Channel', async () => {
        const channel = {id: TestHelper.generateId(), name: TestHelper.basicUser.id + '__' + TestHelper.generateId(), type: 'D'};

        nock(Client4.getChannelsRoute()).
            get(`/${channel.id}/members/me`).
            reply(201, {user_id: TestHelper.basicUser.id, channel_id: channel.id});

        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.DIRECT_ADDED, data: {teammate_id: 'btaxe5msnpnqurayosn5p8twuw'}, broadcast: {omit_users: null, user_id: '', channel_id: channel.id, team_id: ''}, seq: 2}));
        store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: channel});

        await TestHelper.wait(300);

        const {channels} = store.getState().entities.channels;
        assert.ok(Object.keys(channels).length);
    });
});
