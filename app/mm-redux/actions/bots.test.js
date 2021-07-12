// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import nock from 'nock';

import {Client4} from '@client/rest';
import * as BotActions from '@mm-redux/actions/bots';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

describe('Actions.Bots', () => {
    let store;
    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('loadBots', async () => {
        const bots = [TestHelper.fakeBot(), TestHelper.fakeBot()];
        nock(Client4.getBaseRoute()).
            get('/bots').
            query(true).
            reply(201, bots);

        await store.dispatch(BotActions.loadBots());

        const state = store.getState();
        const botsResult = state.entities.bots.accounts;
        assert.equal(bots.length, Object.values(botsResult).length);
    });

    it('loadBot', async () => {
        const bot = TestHelper.fakeBot();
        nock(Client4.getBaseRoute()).
            get(`/bots/${bot.user_id}`).
            query(true).
            reply(201, bot);

        await store.dispatch(BotActions.loadBot(bot.user_id));

        const state = store.getState();
        const botsResult = state.entities.bots.accounts[bot.user_id];
        assert.equal(bot.username, botsResult.username);
    });
});
