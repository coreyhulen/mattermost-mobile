// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {General} from '@mm-redux/constants';
import {sortTeamsByUserPreference} from '@mm-redux/utils/team_utils';

describe('TeamUtils', () => {
    describe('sortTeamsByUserPreference', () => {
        const teamA = {id: 'team_id_a', name: 'team-a', display_name: 'Team A'};
        const teamB = {id: 'team_id_b', name: 'team-b', display_name: 'Team A'};
        const teamC = {id: 'team_id_c', name: 'team-c', display_name: 'Team C'};
        const teamD = {id: 'team_id_d', name: 'team-d', display_name: 'Team D'};
        const teamE = {id: 'team_id_e', name: 'team-e', display_name: 'Team E'};

        it('should correctly sort teams by display name', () => {
            const testCases = [
                {teams: [], result: []},
                {teams: [teamA], result: [teamA]},
                {teams: [teamB, teamA], result: [teamA, teamB]},
                {teams: [teamA, teamB, teamC, teamD, teamE], result: [teamA, teamB, teamC, teamD, teamE]},
                {teams: [teamE, teamD, teamC, teamB, teamA], result: [teamA, teamB, teamC, teamD, teamE]},
                {teams: [teamA, teamC, teamE, teamD, teamB], result: [teamA, teamB, teamC, teamD, teamE]},
            ];

            testCases.forEach((testCase) => {
                assert.deepStrictEqual(sortTeamsByUserPreference(testCase.teams, General.DEFAULT_LOCALE), testCase.result);
            });
        });

        it('should correctly sort teams by teamsOrder when provided', () => {
            const teamsOrder = 'team_id_b,team_id_a,team_id_c';

            const testCases = [
                {teams: [teamA], result: [teamA]},
                {teams: [teamB, teamA], result: [teamB, teamA]},
                {teams: [teamA, teamB, teamC], result: [teamB, teamA, teamC]},
                {teams: [teamC, teamB, teamA], result: [teamB, teamA, teamC]},
                {teams: [teamA, teamC, teamB], result: [teamB, teamA, teamC]},
            ];

            testCases.forEach((testCase) => {
                assert.deepStrictEqual(sortTeamsByUserPreference(testCase.teams, General.DEFAULT_LOCALE, teamsOrder), testCase.result);
            });
        });

        it('should correctly sort teams not in teamsOrder by display name', () => {
            const teamsOrder = 'team_id_b,team_id_a,team_id_c';

            const testCases = [
                {teams: [teamA, teamD], result: [teamA, teamD]},
                {teams: [teamC, teamD, teamA], result: [teamA, teamC, teamD]},
                {teams: [teamA, teamB, teamC, teamD, teamE], result: [teamB, teamA, teamC, teamD, teamE]},
                {teams: [teamE, teamD, teamC, teamB, teamA], result: [teamB, teamA, teamC, teamD, teamE]},
            ];

            testCases.forEach((testCase) => {
                assert.deepStrictEqual(sortTeamsByUserPreference(testCase.teams, General.DEFAULT_LOCALE, teamsOrder), testCase.result);
            });
        });
    });
});
