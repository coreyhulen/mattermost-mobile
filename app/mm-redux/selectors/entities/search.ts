// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as reselect from 'reselect';

import {getMyGroupMentionKeys, getMyGroupMentionKeysForChannel} from '@mm-redux/selectors/entities/groups';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserMentionKeys} from '@mm-redux/selectors/entities/users';
import {Channel} from '@mm-redux/types/channels';
import {GlobalState} from '@mm-redux/types/store';

import {UserMentionKey} from './users';

export const getCurrentSearchForCurrentTeam = reselect.createSelector(
    (state: GlobalState) => state.entities.search.current,
    getCurrentTeamId,
    (current, teamId) => {
        return current[teamId];
    },
);

export const getAllUserMentionKeys: (state: GlobalState) => UserMentionKey[] = reselect.createSelector(
    getCurrentUserMentionKeys,
    (state: GlobalState) => getMyGroupMentionKeys(state),
    (userMentionKeys, groupMentionKeys) => {
        return userMentionKeys.concat(groupMentionKeys);
    },
);

export function makeGetMentionKeysForPost(): (state: GlobalState, channel: Channel, disableGroupHighlight: boolean, mentionHighlightDisabled: boolean) => UserMentionKey[] {
    return reselect.createSelector(
        getCurrentUserMentionKeys,
        (state: GlobalState, channel: Channel) => (channel?.id ? getMyGroupMentionKeysForChannel(state, channel?.team_id, channel?.id) : getMyGroupMentionKeys(state)),
        (state: GlobalState, channel: Channel, disableGroupHighlight: boolean) => disableGroupHighlight,
        (state: GlobalState, channel: Channel, disableGroupHighlight: boolean, mentionHighlightDisabled: boolean) => mentionHighlightDisabled,
        (mentionKeysWithoutGroups, groupMentionKeys, disableGroupHighlight = false, mentionHighlightDisabled = false) => {
            let mentionKeys = mentionKeysWithoutGroups;
            if (!disableGroupHighlight) {
                mentionKeys = mentionKeys.concat(groupMentionKeys);
            }

            if (mentionHighlightDisabled) {
                const CHANNEL_MENTIONS = ['@all', '@channel', '@here'];
                mentionKeys = mentionKeys.filter((value) => !CHANNEL_MENTIONS.includes(value.key));
            }

            return mentionKeys;
        },
    );
}
