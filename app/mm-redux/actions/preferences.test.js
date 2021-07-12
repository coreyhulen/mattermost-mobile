// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import nock from 'nock';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

import {Client4} from '@client/rest';
import * as Actions from '@mm-redux/actions/preferences';
import {login} from '@mm-redux/actions/users';

import {Preferences} from '../constants';

const OK_RESPONSE = {status: 'OK'};

describe('Actions.Preferences', () => {
    let store;
    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        const initialState = {
            entities: {
                users: {
                    currentUserId: TestHelper.basicUser.id,
                },
            },
        };
        store = await configureStore(initialState);
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('getMyPreferences', async () => {
        const user = TestHelper.basicUser;
        const existingPreferences = [
            {
                user_id: user.id,
                category: 'test',
                name: 'test1',
                value: 'test',
            },
            {
                user_id: user.id,
                category: 'test',
                name: 'test2',
                value: 'test',
            },
        ];

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Client4.savePreferences(user.id, existingPreferences);

        nock(Client4.getUsersRoute()).
            get('/me/preferences').
            reply(200, existingPreferences);
        await Actions.getMyPreferences()(store.dispatch, store.getState);

        const state = store.getState();
        const {myPreferences} = state.entities.preferences;

        assert.ok(myPreferences['test--test1'], 'first preference doesn\'t exist');
        assert.deepEqual(existingPreferences[0], myPreferences['test--test1']);
        assert.ok(myPreferences['test--test2'], 'second preference doesn\'t exist');
        assert.deepEqual(existingPreferences[1], myPreferences['test--test2']);
    });

    it('savePrefrences', async () => {
        const user = TestHelper.basicUser;
        const existingPreferences = [
            {
                user_id: user.id,
                category: 'test',
                name: 'test1',
                value: 'test',
            },
        ];

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Client4.savePreferences(user.id, existingPreferences);

        nock(Client4.getUsersRoute()).
            get('/me/preferences').
            reply(200, existingPreferences);
        await Actions.getMyPreferences()(store.dispatch, store.getState);

        const preferences = [
            {
                user_id: user.id,
                category: 'test',
                name: 'test2',
                value: 'test',
            },
            {
                user_id: user.id,
                category: 'test',
                name: 'test3',
                value: 'test',
            },
        ];

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Actions.savePreferences(user.id, preferences)(store.dispatch, store.getState);

        const state = store.getState();
        const {myPreferences} = state.entities.preferences;

        assert.ok(myPreferences['test--test1'], 'first preference doesn\'t exist');
        assert.deepEqual(existingPreferences[0], myPreferences['test--test1']);
        assert.ok(myPreferences['test--test2'], 'second preference doesn\'t exist');
        assert.deepEqual(preferences[0], myPreferences['test--test2']);
        assert.ok(myPreferences['test--test3'], 'third preference doesn\'t exist');
        assert.deepEqual(preferences[1], myPreferences['test--test3']);
    });

    it('deletePreferences', async () => {
        const user = TestHelper.basicUser;
        const existingPreferences = [
            {
                user_id: user.id,
                category: 'test',
                name: 'test1',
                value: 'test',
            },
            {
                user_id: user.id,
                category: 'test',
                name: 'test2',
                value: 'test',
            },
            {
                user_id: user.id,
                category: 'test',
                name: 'test3',
                value: 'test',
            },
        ];

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Client4.savePreferences(user.id, existingPreferences);

        nock(Client4.getUsersRoute()).
            get('/me/preferences').
            reply(200, existingPreferences);
        await Actions.getMyPreferences()(store.dispatch, store.getState);

        nock(Client4.getUsersRoute()).
            post(`/${TestHelper.basicUser.id}/preferences/delete`).
            reply(200, OK_RESPONSE);
        await Actions.deletePreferences(user.id, [
            existingPreferences[0],
            existingPreferences[2],
        ])(store.dispatch, store.getState);

        const state = store.getState();
        const {myPreferences} = state.entities.preferences;

        assert.ok(!myPreferences['test--test1'], 'deleted preference still exists');
        assert.ok(myPreferences['test--test2'], 'second preference doesn\'t exist');
        assert.deepEqual(existingPreferences[1], myPreferences['test--test2']);
        assert.ok(!myPreferences['test--test3'], 'third preference doesn\'t exist');
    });

    it('makeDirectChannelVisibleIfNecessary', async () => {
        const user = TestHelper.basicUser;

        nock(Client4.getBaseRoute()).
            post('/users').
            reply(201, TestHelper.fakeUserWithId());
        const user2 = await TestHelper.createClient().createUser(TestHelper.fakeUser());

        TestHelper.mockLogin();
        await login(user.email, 'password1')(store.dispatch, store.getState);

        // Test that a new preference is created if none exists
        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Actions.makeDirectChannelVisibleIfNecessary(user2.id)(store.dispatch, store.getState);

        let state = store.getState();
        let myPreferences = state.entities.preferences.myPreferences;
        let preference = myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${user2.id}`];
        assert.ok(preference, 'preference for showing direct channel doesn\'t exist');
        assert.equal(preference.value, 'true', 'preference for showing direct channel is not true');

        // Test that nothing changes if the preference already exists and is true
        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Actions.makeDirectChannelVisibleIfNecessary(user2.id)(store.dispatch, store.getState);

        const state2 = store.getState();
        assert.equal(state, state2, 'store should not change since direct channel is already visible');

        // Test that the preference is updated if it already exists and is false
        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        Actions.savePreferences(user.id, [{
            ...preference,
            value: 'false',
        }])(store.dispatch, store.getState);

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Actions.makeDirectChannelVisibleIfNecessary(user2.id)(store.dispatch, store.getState);

        state = store.getState();
        myPreferences = state.entities.preferences.myPreferences;
        preference = myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${user2.id}`];
        assert.ok(preference, 'preference for showing direct channel doesn\'t exist');
        assert.equal(preference.value, 'true', 'preference for showing direct channel is not true');
    });

    it('saveTheme', async () => {
        const user = TestHelper.basicUser;
        const team = TestHelper.basicTeam;
        const existingPreferences = [
            {
                user_id: user.id,
                category: 'theme',
                name: team.id,
                value: JSON.stringify({
                    type: 'Mattermost',
                }),
            },
        ];

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Client4.savePreferences(user.id, existingPreferences);

        nock(Client4.getUsersRoute()).
            get('/me/preferences').
            reply(200, existingPreferences);
        await store.dispatch(Actions.getMyPreferences());

        const newTheme = {
            type: 'Mattermost Dark',
        };
        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        await store.dispatch(Actions.saveTheme(team.id, newTheme));

        const state = store.getState();
        const {myPreferences} = state.entities.preferences;

        assert.ok(myPreferences[`theme--${team.id}`], 'theme preference doesn\'t exist');
        assert.deepEqual(myPreferences[`theme--${team.id}`].value, JSON.stringify(newTheme));
    });

    it('deleteTeamSpecificThemes', async () => {
        const user = TestHelper.basicUser;
        TestHelper.mockLogin();
        await login(user.email, user.password)(store.dispatch, store.getState);

        const theme = {
            type: 'Mattermost Dark',
        };
        const existingPreferences = [
            {
                user_id: user.id,
                category: 'theme',
                name: '',
                value: JSON.stringify(theme),
            },
            {
                user_id: user.id,
                category: 'theme',
                name: TestHelper.generateId(),
                value: JSON.stringify({
                    type: 'Mattermost',
                }),
            },
            {
                user_id: user.id,
                category: 'theme',
                name: TestHelper.generateId(),
                value: JSON.stringify({
                    type: 'Mattermost',
                }),
            },
        ];

        nock(Client4.getUsersRoute()).
            put(`/${user.id}/preferences`).
            reply(200, OK_RESPONSE);
        await Client4.savePreferences(user.id, existingPreferences);

        nock(Client4.getUsersRoute()).
            get('/me/preferences').
            reply(200, existingPreferences);
        await Actions.getMyPreferences()(store.dispatch, store.getState);

        nock(Client4.getUsersRoute()).
            post(`/${user.id}/preferences/delete`).
            reply(200, OK_RESPONSE);
        await Actions.deleteTeamSpecificThemes()(store.dispatch, store.getState);

        const state = store.getState();
        const {myPreferences} = state.entities.preferences;

        assert.equal(Object.entries(myPreferences).length, 1);
        assert.ok(myPreferences['theme--'], 'theme preference doesn\'t exist');
        assert.equal(myPreferences['theme--'].value, JSON.stringify(theme));
    });
});
