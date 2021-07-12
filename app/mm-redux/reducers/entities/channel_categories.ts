// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {TeamTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {ChannelCategory} from '@mm-redux/types/channel_categories';
import {Team, TeamMembership} from '@mm-redux/types/teams';
import {$ID, IDMappedObjects, RelationOneToOne} from '@mm-redux/types/utilities';

import {CategoryTypes} from '../../constants/channel_categories';

export function byId(state: IDMappedObjects<ChannelCategory> = {}, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_MY_TEAM_MEMBER: {
        // This will be removed once categories are sent by the server
        const member: TeamMembership = action.data;

        // Note that this adds new categories before state to prevent overwriting existing categories
        return {
            ...makeDefaultCategories(member.team_id),
            ...state,
        };
    }
    case TeamTypes.RECEIVED_MY_TEAM_MEMBERS: {
        // This will be removed once categories are sent by the server
        const members: TeamMembership[] = action.data;

        return members.reduce((nextState, member) => {
            // Note that this adds new categories before state to prevent overwriting existing categories
            return {
                ...makeDefaultCategories(member.team_id),
                ...nextState,
            };
        }, state);
    }

    // This will be added in phase 2 of Channel Sidebar Organization once the server provides the categories
    // case ChannelCategoryTypes.RECEIVED_CATEGORIES: {
    //     const categories: ChannelCategory[] = action.data;

    //     return categories.reduce((nextState, category) => {
    //         return {
    //             ...nextState,
    //             [category.id]: category,
    //         };
    //     }, state);
    // }
    // case ChannelCategoryTypes.RECEIVED_CATEGORY: {
    //     const category: ChannelCategory = action.data;

    //     return {
    //         ...state,
    //         [category.id]: category,
    //     };
    // }

    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        const nextState = {...state};
        let changed = false;

        for (const category of Object.values(state)) {
            if (category.team_id !== team.id) {
                continue;
            }

            Reflect.deleteProperty(nextState, category.id);
            changed = true;
        }

        if (!changed) {
            return state;
        }

        return nextState;
    }

    default:
        return state;
    }
}

export function orderByTeam(state: RelationOneToOne<Team, $ID<ChannelCategory>[]> = {}, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_MY_TEAM_MEMBER: {
        // This will be removed once categories are sent by the server
        const member: TeamMembership = action.data;

        if (state[member.team_id]) {
            return state;
        }

        return {
            ...state,
            [member.team_id]: makeDefaultCategoryIds(member.team_id),
        };
    }
    case TeamTypes.RECEIVED_MY_TEAM_MEMBERS: {
        // This will be removed once categories are sent by the server
        const members: TeamMembership[] = action.data;

        return members.reduce((nextState, member) => {
            if (state[member.team_id]) {
                return nextState;
            }

            return {
                ...nextState,
                [member.team_id]: makeDefaultCategoryIds(member.team_id),
            };
        }, state);
    }

    // This will be added in phase 2 of Channel Sidebar Organization once the server provides the categories
    // case ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER: {
    //     const teamId: string = action.data.teamId;
    //     const categoryIds: string[] = action.data.categoryIds;

    //     return {
    //         ...state,
    //         [teamId]: categoryIds,
    //     };
    // }

    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        if (!state[team.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, team.id);

        return nextState;
    }

    default:
        return state;
    }
}

function makeDefaultCategoryIds(teamId: string): $ID<ChannelCategory>[] {
    return Object.keys(makeDefaultCategories(teamId));
}

function makeDefaultCategories(teamId: string): IDMappedObjects<ChannelCategory> {
    return {
        [`${teamId}-favorites`]: {
            id: `${teamId}-favorites`,
            team_id: teamId,
            type: CategoryTypes.FAVORITES,
            display_name: 'Favorites',
        },
        [`${teamId}-public`]: {
            id: `${teamId}-public`,
            team_id: teamId,
            type: CategoryTypes.PUBLIC,
            display_name: 'Public',
        },
        [`${teamId}-private`]: {
            id: `${teamId}-private`,
            team_id: teamId,
            type: CategoryTypes.PRIVATE,
            display_name: 'Private',
        },
        [`${teamId}-direct_messages`]: {
            id: `${teamId}-direct_messages`,
            team_id: teamId,
            type: CategoryTypes.DIRECT_MESSAGES,
            display_name: 'Direct Messages',
        },
    };
}

export default combineReducers({
    byId,
    orderByTeam,
});
