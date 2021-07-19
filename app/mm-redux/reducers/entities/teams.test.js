// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {TeamTypes} from '@mm-redux/action_types';
import teamsReducer from '@mm-redux/reducers/entities/teams';

describe('Reducers.teams.myMembers', () => {
    it('initial state', async () => {
        let state = {};

        state = teamsReducer(state, {});
        assert.deepEqual(state.myMembers, {}, 'initial state');
    });

    it('RECEIVED_MY_TEAM_MEMBER', async () => {
        const myMember1 = {user_id: 'user_id_1', team_id: 'team_id_1', delete_at: 0, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};
        const myMember2 = {user_id: 'user_id_2', team_id: 'team_id_2', delete_at: 0, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};
        const myMember3 = {user_id: 'user_id_3', team_id: 'team_id_3', delete_at: 1, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};

        let state = {myMembers: {team_id_1: myMember1}};
        const testAction = {
            type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
            data: myMember2,
            result: {team_id_1: myMember1, team_id_2: myMember2},
        };

        state = teamsReducer(state, testAction);
        assert.deepEqual(state.myMembers, testAction.result);

        testAction.data = myMember3;
        state = teamsReducer(state, {});
        assert.deepEqual(state.myMembers, testAction.result);
    });

    it('RECEIVED_MY_TEAM_MEMBERS', async () => {
        let state = {};
        const myMember1 = {user_id: 'user_id_1', team_id: 'team_id_1', delete_at: 0, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};
        const myMember2 = {user_id: 'user_id_2', team_id: 'team_id_2', delete_at: 0, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};
        const myMember3 = {user_id: 'user_id_3', team_id: 'team_id_3', delete_at: 1, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};
        const testAction = {
            type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
            data: [myMember1, myMember2, myMember3],
            result: {team_id_1: myMember1, team_id_2: myMember2},
        };

        state = teamsReducer(state, testAction);
        assert.deepEqual(state.myMembers, testAction.result);

        state = teamsReducer(state, {});
        assert.deepEqual(state.myMembers, testAction.result);
    });

    it('RECEIVED_TEAMS_LIST', async () => {
        const team1 = {name: 'team-1', id: 'team_id_1', delete_at: 0};
        const team2 = {name: 'team-2', id: 'team_id_2', delete_at: 0};
        const team3 = {name: 'team-3', id: 'team_id_3', delete_at: 0};

        let state = {
            myMembers: {
                team_id_1: {...team1, msg_count: 0, mention_count: 0},
                team_id_2: {...team2, msg_count: 0, mention_count: 0},
            },
        };

        const testAction = {
            type: TeamTypes.RECEIVED_TEAMS_LIST,
            data: [team3],
            result: {
                team_id_1: {...team1, msg_count: 0, mention_count: 0},
                team_id_2: {...team2, msg_count: 0, mention_count: 0},
            },
        };

        // do not add a team when it's not on the teams.myMembers list
        state = teamsReducer(state, testAction);
        assert.deepEqual(state.myMembers, testAction.result);

        // remove deleted team to teams.myMembers list
        team2.delete_at = 1;
        testAction.data = [team2];
        state = teamsReducer(state, testAction);
        assert.deepEqual(state.myMembers, {team_id_1: {...team1, msg_count: 0, mention_count: 0}});
    });

    it('RECEIVED_TEAMS', async () => {
        const myMember1 = {user_id: 'user_id_1', team_id: 'team_id_1', delete_at: 0, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};
        const myMember2 = {user_id: 'user_id_2', team_id: 'team_id_2', delete_at: 0, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};
        const myMember3 = {user_id: 'user_id_3', team_id: 'team_id_3', delete_at: 0, mention_count: 0, mention_count_root: 0, msg_count: 0, msg_count_root: 0};

        let state = {myMembers: {team_id_1: myMember1, team_id_2: myMember2}};

        const testAction = {
            type: TeamTypes.RECEIVED_TEAMS,
            data: {team_id_3: myMember3},
            result: {team_id_1: myMember1, team_id_2: myMember2},
        };

        // do not add a team when it's not on the teams.myMembers list
        state = teamsReducer(state, testAction);
        assert.deepEqual(state.myMembers, testAction.result);

        // remove deleted team to teams.myMembers list
        myMember2.delete_at = 1;
        testAction.data = {team_id_2: myMember2};
        state = teamsReducer(state, testAction);
        assert.deepEqual(state.myMembers, {team_id_1: myMember1});
    });
});
