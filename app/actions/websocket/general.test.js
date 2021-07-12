// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-import-assign */

import assert from 'assert';

import {Server, WebSocket as MockWebSocket} from 'mock-socket';

import * as Actions from '@actions/websocket';
import {Client4} from '@client/rest';
import {WebsocketEvents} from '@constants';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

global.WebSocket = MockWebSocket;

describe('Websocket General Events', () => {
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

    it('handle license changed', async () => {
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.LICENSE_CHANGED, data: {license: {IsLicensed: 'true'}}}));

        await TestHelper.wait(200);

        const state = store.getState();

        const license = state.entities.general.license;
        assert.ok(license);
        assert.ok(license.IsLicensed);
    });

    it('handle config changed', async () => {
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CONFIG_CHANGED, data: {config: {EnableCustomEmoji: 'true', EnableLinkPreviews: 'false'}}}));

        await TestHelper.wait(200);

        const state = store.getState();

        const config = state.entities.general.config;
        assert.ok(config);
        assert.ok(config.EnableCustomEmoji === 'true');
        assert.ok(config.EnableLinkPreviews === 'false');
    });
});
