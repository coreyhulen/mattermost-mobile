// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General} from '@mm-redux/constants';
import {getChannelByName, getChannelsInCurrentTeam, getMyChannelMemberships} from '@mm-redux/selectors/entities/channels';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTeamByName} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId, getUser} from '@mm-redux/selectors/entities/users';
import {isArchivedChannel} from '@mm-redux/utils/channel_utils';

const getOtherUserIdForDm = createSelector(
    (state, channel) => channel,
    getCurrentUserId,
    (channel, currentUserId) => {
        if (!channel) {
            return '';
        }

        return channel.name.split('__').find((m) => m !== currentUserId) || currentUserId;
    },
);

export const getChannelMembersForDm = createSelector(
    (state, channel) => getUser(state, getOtherUserIdForDm(state, channel)),
    (otherUser) => {
        if (!otherUser) {
            return [];
        }

        return [otherUser];
    },
);

export const getChannelNameForSearchAutocomplete = createSelector(
    (state, channelId) => state.entities.channels.channels[channelId],
    (channel) => {
        if (channel && channel.display_name) {
            return channel.display_name;
        }
        return '';
    },
);

const getTeam = (state, channelName, teamName) => getTeamByName(state, teamName);
const getChannel = (state, channelName) => getChannelByName(state, channelName);

export const getChannelReachable = createSelector(
    getTeam,
    getChannel,
    getConfig,
    (team, channel, config) => {
        if (!(team && channel)) {
            return false;
        }
        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';
        if (isArchivedChannel(channel) && !viewArchivedChannels) {
            return false;
        }
        return true;
    },
);

export const joinablePublicChannels = createSelector(
    getChannelsInCurrentTeam,
    getMyChannelMemberships,
    (channels, myMembers) => {
        return channels.filter((c) => {
            return (!myMembers[c.id] && c.type === General.OPEN_CHANNEL && c.delete_at === 0);
        });
    },
);

export const joinableSharedChannels = createSelector(
    getChannelsInCurrentTeam,
    getMyChannelMemberships,
    (channels, myMembers) => {
        return channels.filter((c) => {
            return (!myMembers[c.id] && c.type === General.OPEN_CHANNEL && c.shared === true && c.delete_at === 0);
        });
    },
);

export const teamArchivedChannels = createSelector(
    getChannelsInCurrentTeam,
    (channels) => {
        return channels.filter((c) => c.delete_at !== 0);
    },
);
