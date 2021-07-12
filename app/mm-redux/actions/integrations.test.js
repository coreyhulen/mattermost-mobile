// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import nock from 'nock';

import {Client4} from '@client/rest';
import * as Actions from '@mm-redux/actions/integrations';
import * as TeamsActions from '@mm-redux/actions/teams';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

describe('Actions.Integrations', () => {
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

    it('getCommands', async () => {
        const noTeamCommands = store.getState().entities.integrations.commands;
        const noSystemCommands = store.getState().entities.integrations.systemCommands;
        assert.equal(Object.keys({...noTeamCommands, ...noSystemCommands}).length, 0);

        nock(Client4.getBaseRoute()).
            post('/teams').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam(),
        )(store.dispatch, store.getState);

        const teamCommand = TestHelper.testCommand(team.id);

        nock(Client4.getBaseRoute()).
            post('/commands').
            reply(201, {...teamCommand, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(
            teamCommand,
        )(store.dispatch, store.getState);

        nock(Client4.getBaseRoute()).
            get('/commands').
            query(true).
            reply(200, [created, {
                trigger: 'system-command',
            }]);

        await Actions.getCommands(
            team.id,
        )(store.dispatch, store.getState);

        const teamCommands = store.getState().entities.integrations.commands;
        const executableCommands = store.getState().entities.integrations.executableCommands;
        assert.ok(Object.keys({...teamCommands, ...executableCommands}).length);
    });

    it('getAutocompleteCommands', async () => {
        const noTeamCommands = store.getState().entities.integrations.commands;
        const noSystemCommands = store.getState().entities.integrations.systemCommands;
        assert.equal(Object.keys({...noTeamCommands, ...noSystemCommands}).length, 0);

        nock(Client4.getBaseRoute()).
            post('/teams').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam(),
        )(store.dispatch, store.getState);

        const teamCommandWithAutocomplete = TestHelper.testCommand(team.id);

        nock(Client4.getBaseRoute()).
            post('/commands').
            reply(201, {...teamCommandWithAutocomplete, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: createdWithAutocomplete} = await Actions.addCommand(
            teamCommandWithAutocomplete,
        )(store.dispatch, store.getState);

        nock(Client4.getBaseRoute()).
            get(`/teams/${team.id}/commands/autocomplete`).
            query(true).
            reply(200, [createdWithAutocomplete, {
                trigger: 'system-command',
            }]);

        await Actions.getAutocompleteCommands(
            team.id,
        )(store.dispatch, store.getState);

        const teamCommands = store.getState().entities.integrations.commands;
        const systemCommands = store.getState().entities.integrations.systemCommands;
        assert.equal(Object.keys({...teamCommands, ...systemCommands}).length, 2);
    });

    it('executeCommand', async () => {
        nock(Client4.getBaseRoute()).
            post('/teams').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam(),
        )(store.dispatch, store.getState);

        const args = {
            channel_id: TestHelper.basicChannel.id,
            team_id: team.id,
        };

        nock(Client4.getBaseRoute()).
            post('/commands/execute').
            reply(200, []);

        await Actions.executeCommand('/echo message 5', args);
    });

    it('addCommand', async () => {
        nock(Client4.getBaseRoute()).
            post('/teams').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam(),
        )(store.dispatch, store.getState);

        const expected = TestHelper.testCommand(team.id);

        nock(Client4.getBaseRoute()).
            post('/commands').
            reply(201, {...expected, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(expected)(store.dispatch, store.getState);

        const {commands} = store.getState().entities.integrations;
        assert.ok(commands[created.id]);
        const actual = commands[created.id];

        assert.ok(actual.token);
        assert.equal(actual.create_at, actual.update_at);
        assert.equal(actual.delete_at, 0);
        assert.ok(actual.creator_id);
        assert.equal(actual.team_id, team.id);
        assert.equal(actual.trigger, expected.trigger);
        assert.equal(actual.method, expected.method);
        assert.equal(actual.username, expected.username);
        assert.equal(actual.icon_url, expected.icon_url);
        assert.equal(actual.auto_complete, expected.auto_complete);
        assert.equal(actual.auto_complete_desc, expected.auto_complete_desc);
        assert.equal(actual.auto_complete_hint, expected.auto_complete_hint);
        assert.equal(actual.display_name, expected.display_name);
        assert.equal(actual.description, expected.description);
        assert.equal(actual.url, expected.url);
    });

    it('submitInteractiveDialog', async () => {
        nock(Client4.getBaseRoute()).
            post('/actions/dialogs/submit').
            reply(200, {errors: {name: 'some error'}});

        const submit = {
            url: 'https://mattermost.com',
            callback_id: '123',
            state: '123',
            channel_id: TestHelper.generateId(),
            team_id: TestHelper.generateId(),
            submission: {name: 'value'},
        };

        const {data} = await store.dispatch(Actions.submitInteractiveDialog(submit));

        assert.ok(data.errors);
        assert.equal(data.errors.name, 'some error');
    });
});
