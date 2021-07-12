// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ViewTypes} from '@constants';
import {ChannelTypes, TeamTypes} from '@mm-redux/action_types';

function lastTeamId(state = '', action) {
    switch (action.type) {
    case TeamTypes.SELECT_TEAM:
        return action.data;
    default:
        return state;
    }
}

function setLastChannelForTeam(state, teamId, channel) {
    if (!channel?.id) {
        return state;
    }

    const team = state[channel.team_id || teamId];
    const channelIds = [];

    if (team) {
        channelIds.push(...team);
        const index = channelIds.indexOf(channel.id);
        if (index === -1) {
            channelIds.unshift(channel.id);
            channelIds.slice(0, 5);
        } else {
            channelIds.splice(index, 1);
            channelIds.unshift(channel.id);
        }
    } else {
        channelIds.push(channel.id);
    }

    return {
        ...state,
        [teamId]: channelIds,
    };
}

function lastChannelForTeam(state = {}, action) {
    switch (action.type) {
    case ChannelTypes.SELECT_CHANNEL: {
        return setLastChannelForTeam(state, action.extra?.teamId, action.extra?.channel);
    }

    case ViewTypes.REMOVE_LAST_CHANNEL_FOR_TEAM: {
        const {data} = action;
        const team = state[data.teamId];

        if (!data.channelId) {
            return state;
        }

        if (team) {
            const channelIds = [...team];
            const index = channelIds.indexOf(data.channelId);
            if (index !== -1) {
                channelIds.splice(index, 1);
            }

            return {
                ...state,
                [data.teamId]: channelIds,
            };
        }

        return state;
    }
    default:
        return state;
    }
}

export default combineReducers({
    lastTeamId,
    lastChannelForTeam,
});
