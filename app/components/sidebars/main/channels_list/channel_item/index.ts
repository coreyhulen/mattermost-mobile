// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {General} from '@mm-redux/constants';
import {
    getCurrentChannelId,
    getMyChannelMember,
    isManuallyUnread,
    makeGetChannel,
    shouldHideDefaultChannel,
} from '@mm-redux/selectors/entities/channels';
import {getTheme, getTeammateNameDisplaySetting} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserId, getUser} from '@mm-redux/selectors/entities/users';
import {getUserIdFromChannelName, isChannelMuted} from '@mm-redux/utils/channel_utils';
import {displayUsername} from '@mm-redux/utils/user_utils';
import {isCustomStatusEnabled} from '@selectors/custom_status';
import {getDraftForChannel} from '@selectors/views';
import {isGuest as isGuestUser} from '@utils/users';

import ChannelItem from './channel_item';

function makeMapStateToProps() {
    const getChannel = makeGetChannel();

    return (state, ownProps) => {
        const channel = ownProps.channel || getChannel(state, {id: ownProps.channelId}) || {};
        const member = getMyChannelMember(state, channel.id);
        const currentUserId = getCurrentUserId(state);
        const channelDraft = getDraftForChannel(state, channel.id);

        let displayName = channel.display_name;
        let isGuest = false;
        let isArchived = channel.delete_at > 0;
        let teammateId;

        if (channel.type === General.DM_CHANNEL) {
            teammateId = getUserIdFromChannelName(currentUserId, channel.name);
            const teammate = getUser(state, teammateId);

            if (teammate) {
                const teammateNameDisplay = getTeammateNameDisplaySetting(state);
                displayName = displayUsername(teammate, teammateNameDisplay, false);
                isArchived = teammate.delete_at > 0;
                isGuest = isGuestUser(teammate) || false;
            }
        }

        const currentChannelId = getCurrentChannelId(state);
        const isActive = ownProps.channelId === currentChannelId;

        let shouldHideChannel = false;
        if (
            channel.name === General.DEFAULT_CHANNEL &&
            !isActive &&
            !ownProps.isFavorite &&
            !ownProps.isSearchResult &&
            shouldHideDefaultChannel(state, channel)
        ) {
            shouldHideChannel = true;
        }

        let unreadMsgs = 0;
        if (member && channel) {
            unreadMsgs = Math.max(channel.total_msg_count - member.msg_count, 0);
        }

        let showUnreadForMsgs = true;
        if (member && member.notify_props) {
            showUnreadForMsgs = member.notify_props.mark_unread !== General.MENTION;
        }
        return {
            channel,
            currentChannelId,
            currentUserId,
            displayName,
            hasDraft: Boolean(channelDraft.draft.trim() || channelDraft?.files?.length),
            isArchived,
            isChannelMuted: isChannelMuted(member),
            isGuest,
            isManualUnread: isManuallyUnread(state, ownProps.channelId),
            mentions: member ? member.mention_count : 0,
            shouldHideChannel,
            showUnreadForMsgs,
            teammateId,
            theme: getTheme(state),
            unreadMsgs,
            customStatusEnabled: isCustomStatusEnabled(state),
        };
    };
}

export default connect(makeMapStateToProps)(ChannelItem);
