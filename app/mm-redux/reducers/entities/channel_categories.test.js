// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TeamTypes} from '@mm-redux/action_types';

import {CategoryTypes} from '../../constants/channel_categories';

import * as Reducers from './channel_categories';

describe('byId', () => {
    test('default categories should be added when a member is received', () => {
        const initialState = {};

        const state = Reducers.byId(
            initialState,
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
                data: {
                    team_id: 'team1',
                },
            },
        );

        expect(state['team1-favorites']).toBeDefined();
        expect(state['team1-public']).toBeDefined();
        expect(state['team1-private']).toBeDefined();
        expect(state['team1-direct_messages']).toBeDefined();
    });

    test('default categories should be added when multiple members are received', () => {
        const initialState = {};

        const state = Reducers.byId(
            initialState,
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                data: [
                    {team_id: 'team1'},
                    {team_id: 'team2'},
                ],
            },
        );

        expect(state['team1-favorites']).toBeDefined();
        expect(state['team1-public']).toBeDefined();
        expect(state['team1-private']).toBeDefined();
        expect(state['team1-direct_messages']).toBeDefined();
        expect(state['team2-favorites']).toBeDefined();
        expect(state['team2-public']).toBeDefined();
        expect(state['team2-private']).toBeDefined();
        expect(state['team2-direct_messages']).toBeDefined();
    });

    test('should remove corresponding categories when leaving a team', () => {
        const initialState = {
            category1: {id: 'category1', team_id: 'team1', type: CategoryTypes.CUSTOM},
            category2: {id: 'category2', team_id: 'team1', type: CategoryTypes.CUSTOM},
            dmCategory1: {id: 'dmCategory1', team_id: 'team1', type: CategoryTypes.DIRECT_MESSAGES},
            category3: {id: 'category3', team_id: 'team2', type: CategoryTypes.CUSTOM},
            category4: {id: 'category4', team_id: 'team2', type: CategoryTypes.CUSTOM},
            dmCategory2: {id: 'dmCategory1', team_id: 'team2', type: CategoryTypes.DIRECT_MESSAGES},
        };

        const state = Reducers.byId(
            initialState,
            {
                type: TeamTypes.LEAVE_TEAM,
                data: {
                    id: 'team1',
                },
            },
        );

        expect(state).toEqual({
            category3: state.category3,
            category4: state.category4,
            dmCategory2: state.dmCategory2,
        });
    });
});

describe('orderByTeam', () => {
    test('default category order should be added when a member is received', () => {
        const initialState = {};

        const state = Reducers.orderByTeam(
            initialState,
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
                data: {
                    team_id: 'team1',
                },
            },
        );

        expect(state).toEqual({
            team1: [
                'team1-favorites',
                'team1-public',
                'team1-private',
                'team1-direct_messages',
            ],
        });
    });

    test('default category order should be added when multiple members are received', () => {
        const initialState = {};

        const state = Reducers.orderByTeam(
            initialState,
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                data: [
                    {team_id: 'team1'},
                    {team_id: 'team2'},
                ],
            },
        );

        expect(state).toEqual({
            team1: [
                'team1-favorites',
                'team1-public',
                'team1-private',
                'team1-direct_messages',
            ],
            team2: [
                'team2-favorites',
                'team2-public',
                'team2-private',
                'team2-direct_messages',
            ],
        });
    });

    test('should remove correspoding order when leaving a team', () => {
        const initialState = {
            team1: ['category1', 'category2', 'dmCategory1'],
            team2: ['category3', 'category4', 'dmCategory2'],
        };

        const state = Reducers.orderByTeam(
            initialState,
            {
                type: TeamTypes.LEAVE_TEAM,
                data: {
                    id: 'team1',
                },
            },
        );

        expect(state).toEqual({
            team2: initialState.team2,
        });
    });
});
