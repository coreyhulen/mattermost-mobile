// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {handleSelectChannel, toggleDMChannel, toggleGMChannel} from '@actions/views/channel';
import {createDirectChannel, createGroupChannel} from '@mm-redux/actions/channels';
import {getProfilesByIds, getStatusesByIds} from '@mm-redux/actions/users';
import {getDirectChannelName} from '@mm-redux/utils/channel_utils';

export function makeDirectChannel(otherUserId, switchToChannel = true) {
    return async (dispatch, getState) => {
        const state = getState();
        const {currentUserId} = state.entities.users;
        const channelName = getDirectChannelName(currentUserId, otherUserId);
        const {channels, myMembers} = state.entities.channels;

        dispatch(getProfilesByIds([otherUserId]));
        dispatch(getStatusesByIds([otherUserId]));

        let result;
        let channel = Object.values(channels).find((c) => c.name === channelName);
        if (channel && myMembers[channel.id]) {
            result = {data: channel};

            dispatch(toggleDMChannel(otherUserId, 'true', channel.id));
        } else {
            result = await dispatch(createDirectChannel(currentUserId, otherUserId));
            channel = result.data;
        }

        if (channel && switchToChannel) {
            dispatch(handleSelectChannel(channel.id));
        }

        return result;
    };
}

export function makeGroupChannel(otherUserIds) {
    return async (dispatch, getState) => {
        const state = getState();
        const {currentUserId} = state.entities.users;

        dispatch(getProfilesByIds(otherUserIds));
        dispatch(getStatusesByIds(otherUserIds));

        const result = await createGroupChannel([currentUserId, ...otherUserIds])(dispatch, getState);
        const channel = result.data;

        if (channel) {
            dispatch(toggleGMChannel(channel.id, 'true'));
            dispatch(handleSelectChannel(channel.id));
        }

        return result;
    };
}
