// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ChannelCategoryTypes, TeamTypes, UserTypes, ChannelTypes} from '@mm-redux/action_types';

import {GenericAction} from '@mm-redux/types/actions';
import {ChannelCategory} from '@mm-redux/types/channel_categories';
import {Team} from '@mm-redux/types/teams';
import {$ID, IDMappedObjects, RelationOneToOne} from '@mm-redux/types/utilities';
import {removeItem} from '@mm-redux/utils/channel_utils';

export function byId(state: IDMappedObjects<ChannelCategory> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelCategoryTypes.RECEIVED_CATEGORIES: {
        const categories: ChannelCategory[] = action.data;

        return categories.reduce((nextState, category) => {
            return {
                ...nextState,
                [category.id]: {
                    ...nextState[category.id],
                    ...category,
                },
            };
        }, state);
    }
    case ChannelCategoryTypes.RECEIVED_CATEGORY: {
        const category: ChannelCategory = action.data;

        return {
            ...state,
            [category.id]: {
                ...state[category.id],
                ...category,
            },
        };
    }

    case ChannelCategoryTypes.CATEGORY_DELETED: {
        const categoryId: $ID<ChannelCategory> = action.data;

        const nextState = {...state};

        Reflect.deleteProperty(nextState, categoryId);

        return nextState;
    }

    case ChannelTypes.LEAVE_CHANNEL: {
        const channelId: string = action.data.id;

        const nextState = {...state};
        let changed = false;

        for (const category of Object.values(state)) {
            const index = category.channel_ids.indexOf(channelId);

            if (index === -1) {
                continue;
            }

            const nextChannelIds = [...category.channel_ids];
            nextChannelIds.splice(index, 1);

            nextState[category.id] = {
                ...category,
                channel_ids: nextChannelIds,
            };

            changed = true;
        }

        return changed ? nextState : state;
    }
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

        return changed ? nextState : state;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export function orderByTeam(state: RelationOneToOne<Team, Array<$ID<ChannelCategory>>> = {}, action: GenericAction) {
    switch (action.type) {
    case ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER: {
        const teamId: string = action.data.teamId;
        const order: string[] = action.data.order;

        return {
            ...state,
            [teamId]: order,
        };
    }

    case ChannelCategoryTypes.CATEGORY_DELETED: {
        const categoryId: $ID<ChannelCategory> = action.data;

        const nextState = {...state};

        for (const teamId of Object.keys(nextState)) {
            // removeItem only modifies the array if it contains the category ID, so other teams' state won't be modified
            nextState[teamId] = removeItem(state[teamId], categoryId);
        }

        return nextState;
    }

    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        if (!state[team.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, team.id);

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export default combineReducers({
    byId,
    orderByTeam,
});
