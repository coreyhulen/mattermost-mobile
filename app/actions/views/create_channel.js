// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createChannel} from '@mm-redux/actions/channels';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {cleanUpUrlable} from '@mm-redux/utils/channel_utils';
import {generateId} from '@mm-redux/utils/helpers';

import {handleSelectChannel, setChannelDisplayName} from './channel';

export function generateChannelNameFromDisplayName(displayName) {
    let name = cleanUpUrlable(displayName);

    if (name === '') {
        name = generateId();
    }

    return name;
}

export function handleCreateChannel(displayName, purpose, header, type) {
    return async (dispatch, getState) => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const teamId = getCurrentTeamId(state);
        const channel = {
            team_id: teamId,
            name: generateChannelNameFromDisplayName(displayName),
            display_name: displayName,
            purpose,
            header,
            type,
        };

        const {data} = await dispatch(createChannel(channel, currentUserId));
        if (data && data.id) {
            dispatch(setChannelDisplayName(displayName));
            dispatch(handleSelectChannel(data.id));
        }
    };
}
