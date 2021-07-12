// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import TestHelper from '@test/test_helper';

import {getAllCommands, getAutocompleteCommandsList, getOutgoingHooksInCurrentTeam} from './integrations';

describe('Selectors.Integrations', () => {
    TestHelper.initBasic();

    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const hook1 = TestHelper.fakeOutgoingHookWithId(team1.id);
    const hook2 = TestHelper.fakeOutgoingHookWithId(team1.id);
    const hook3 = TestHelper.fakeOutgoingHookWithId(team2.id);

    const hooks = {[hook1.id]: hook1, [hook2.id]: hook2, [hook3.id]: hook3};

    const command1 = {id: TestHelper.generateId(), ...TestHelper.testCommand(team1.id), auto_complete: false};
    const command2 = {id: TestHelper.generateId(), ...TestHelper.testCommand(team2.id)};
    const command3 = TestHelper.testCommand(team1.id);
    const command4 = TestHelper.testCommand(team2.id);

    const commands = {[command1.id]: command1, [command2.id]: command2};
    const systemCommands = {[command3.trigger]: command3, [command4.trigger]: command4};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            integrations: {
                outgoingHooks: hooks,
                commands,
                systemCommands,
            },
        },
    });

    it('should return outgoing hooks in current team', () => {
        const hooksInCurrentTeam1 = [hook1, hook2];
        assert.deepEqual(getOutgoingHooksInCurrentTeam(testState), hooksInCurrentTeam1);
    });

    it('should get all commands', () => {
        const commandsInState = {...commands, ...systemCommands};
        assert.deepEqual(getAllCommands(testState), commandsInState);
    });

    it('should get all autocomplete commands by teamId', () => {
        const autocompleteCommandsForTeam = [command3];
        assert.deepEqual(getAutocompleteCommandsList(testState), autocompleteCommandsForTeam);
    });
});
