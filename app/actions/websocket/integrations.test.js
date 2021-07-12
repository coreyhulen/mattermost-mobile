// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Server, WebSocket as MockWebSocket} from 'mock-socket';

import * as Actions from '@actions/websocket';
import {Client4} from '@client/rest';
import {WebsocketEvents} from '@constants';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

global.WebSocket = MockWebSocket;

describe('Websocket Integration Events', () => {
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

    it('handle open dialog', async () => {
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.OPEN_DIALOG, data: {dialog: JSON.stringify({url: 'someurl', trigger_id: 'sometriggerid', dialog: {}})}}));

        await TestHelper.wait(200);

        const state = store.getState();

        const dialog = state.entities.integrations.dialog;
        assert.ok(dialog);
        assert.ok(dialog.url === 'someurl');
        assert.ok(dialog.trigger_id === 'sometriggerid');
        assert.ok(dialog.dialog);
    });
});
