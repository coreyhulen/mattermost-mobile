// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {throttle} from '@utils/general';

import mattermostBucket from 'app/mattermost_bucket';

const SAVE_STATE_ACTIONS = [
    'CONNECTION_CHANGED',
    'DATA_CLEANUP',
    'LOGIN',
    'BATCH_LOAD_ME',
    'Offline/STATUS_CHANGED',
    'persist/REHYDRATE',
    'RECEIVED_APP_STATE',
    'WEBSOCKET_CLOSED',
    'WEBSOCKET_SUCCESS',
];

// This middleware stores key parts of state entities into a file (in the App Group container) on certain actions.
// iOS only. Allows the share extension to work, without having access available to the redux store object.
// Remove this middleware if/when state is moved to a persisted solution.
export default function saveShareExtensionState(store) {
    return (next) => (action) => {
        if (SAVE_STATE_ACTIONS.includes(action.type)) {
            throttle(saveStateToFile(store));
        }
        return next(action);
    };
}

async function saveStateToFile(store) {
    const state = store.getState();

    if (state.entities) {
        const channelsInTeam = {...state.entities.channels.channelsInTeam};
        Object.keys(channelsInTeam).forEach((teamId) => {
            channelsInTeam[teamId] = Array.from(channelsInTeam[teamId]);
        });

        const profilesInChannel = {...state.entities.users.profilesInChannel};
        Object.keys(profilesInChannel).forEach((channelId) => {
            profilesInChannel[channelId] = Array.from(profilesInChannel[channelId]);
        });

        let url;
        if (state.entities.users.currentUserId) {
            url = state.entities.general.credentials.url || state.views.selectServer.serverUrl;
        }

        const entities = {
            ...state.entities,
            general: {
                ...state.entities.general,
                credentials: {
                    url,
                },
            },
            channels: {
                ...state.entities.channels,
                channelsInTeam,
            },
            users: {
                ...state.entities.users,
                profilesInChannel,
                profilesNotInTeam: [],
                profilesWithoutTeam: [],
                profilesNotInChannel: [],
            },
        };

        mattermostBucket.writeToFile('entities', JSON.stringify(entities));
    }
}
