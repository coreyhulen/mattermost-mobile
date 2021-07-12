// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {General} from '@mm-redux/constants';
import {getCurrentChannel, getMyCurrentChannelMembership, getCurrentChannelStats} from '@mm-redux/selectors/entities/channels';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserId, getUser} from '@mm-redux/selectors/entities/users';
import {getUserIdFromChannelName, isChannelMuted} from '@mm-redux/utils/channel_utils';
import {isCustomStatusEnabled} from '@selectors/custom_status';
import {isGuest} from '@utils/users';

import ChannelTitle from './channel_title';

function mapStateToProps(state) {
    const currentChannel = getCurrentChannel(state);
    const currentUserId = getCurrentUserId(state);
    const myChannelMember = getMyCurrentChannelMembership(state);
    const stats = getCurrentChannelStats(state) || {member_count: 0, guest_count: 0};

    let isTeammateGuest = false;
    let isSelfDMChannel = false;
    let teammateId;
    if (currentChannel && currentChannel.type === General.DM_CHANNEL) {
        teammateId = getUserIdFromChannelName(currentUserId, currentChannel.name);
        const teammate = getUser(state, teammateId);
        isTeammateGuest = isGuest(teammate);
        isSelfDMChannel = currentUserId === currentChannel.teammate_id;
    }

    return {
        channelType: currentChannel?.type,
        currentChannelName: currentChannel ? currentChannel.display_name : '',
        displayName: state.views.channel.displayName,
        hasGuests: stats.guest_count > 0,
        isArchived: currentChannel ? currentChannel.delete_at !== 0 : false,
        isChannelMuted: isChannelMuted(myChannelMember),
        isChannelShared: currentChannel?.shared,
        isGuest: isTeammateGuest,
        isSelfDMChannel,
        theme: getTheme(state),
        teammateId,
        customStatusEnabled: isCustomStatusEnabled(state),
    };
}

export default connect(mapStateToProps)(ChannelTitle);
