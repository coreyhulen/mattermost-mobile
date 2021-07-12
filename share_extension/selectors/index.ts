// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General} from '@mm-redux/constants';
import {getAllChannels, getMyChannelMemberships} from '@mm-redux/selectors/entities/channels';
import {getTeammateNameDisplaySetting, getVisibleTeammate, getVisibleGroupIds} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUser, getUsers, getUserIdsInChannels} from '@mm-redux/selectors/entities/users';
import {Channel} from '@mm-redux/types/channels';
import {GlobalState} from '@mm-redux/types/store';
import {completeDirectChannelDisplayName, getDirectChannelName, sortChannelsByDisplayName} from '@mm-redux/utils/channel_utils';

export const getExtensionSortedPublicChannels = createSelector(
    getCurrentUser,
    getAllChannels,
    getMyChannelMemberships,
    (state: GlobalState, teamId: string) => teamId,
    (user, channels, memberships, teamId) => {
        if (!user) {
            return [];
        }

        const locale = user.locale || General.DEFAULT_LOCALE;
        const publicChannels = Object.values(channels).filter((c) => c.team_id === teamId && !c.delete_at && c.type === General.OPEN_CHANNEL && memberships[c.id]);
        return publicChannels.sort(sortChannelsByDisplayName.bind(null, locale));
    },
);

export const getExtensionSortedPrivateChannels = createSelector(
    getCurrentUser,
    getAllChannels,
    getMyChannelMemberships,
    (state: GlobalState, teamId: string) => teamId,
    (user, channels, memberships, teamId) => {
        if (!user) {
            return [];
        }

        const locale = user.locale || General.DEFAULT_LOCALE;
        const privateChannels = Object.values(channels).filter((c) => c.team_id === teamId && !c.delete_at && c.type === General.PRIVATE_CHANNEL && memberships[c.id]);
        return privateChannels.sort(sortChannelsByDisplayName.bind(null, locale));
    },
);

export const getExtensionSortedDirectChannels = createSelector(
    getCurrentUser,
    getUsers,
    getUserIdsInChannels,
    getAllChannels,
    getVisibleTeammate,
    getVisibleGroupIds,
    getTeammateNameDisplaySetting,
    (user, profiles, profilesInChannel, allChannels, teammates, groupIds, settings) => {
        if (!user) {
            return [];
        }

        const locale = user.locale || General.DEFAULT_LOCALE;
        const channels = Object.values(allChannels).filter((c) => !c.team_id);
        const gms = groupIds.map((id) => {
            const channel = allChannels[id];
            const userIdsInChannel = new Set(profilesInChannel[channel.id]);
            return completeDirectChannelDisplayName(user.id, profiles, userIdsInChannel, settings || '', channel);
        });

        const dms = teammates.reduce((acc, otherUserId) => {
            const channelName = getDirectChannelName(user.id, otherUserId);
            const channel = channels.find((c) => c.name === channelName); //eslint-disable-line max-nested-callbacks
            const otherUser = profiles[otherUserId];
            if (channel && otherUser?.delete_at === 0) {
                const userIdsInChannel = new Set(profilesInChannel[channel.id]);
                acc.push(completeDirectChannelDisplayName(user.id, profiles, userIdsInChannel, settings || '', channel));
            }

            return acc;
        }, [] as Channel[]);

        return dms.concat(gms).sort(sortChannelsByDisplayName.bind(null, locale));
    },
);
