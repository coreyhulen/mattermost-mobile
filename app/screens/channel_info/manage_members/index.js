// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {General} from '@mm-redux/constants';
import {canManageChannelMembers, getCurrentChannel, getCurrentChannelStats} from '@mm-redux/selectors/entities/channels';

import ManageMembers from './manage_members';

function mapStateToProps(state) {
    const currentChannel = getCurrentChannel(state);
    const currentChannelStats = getCurrentChannelStats(state);
    const membersCount = currentChannelStats?.member_count || 0;
    let canManageUsers = currentChannel?.id ? canManageChannelMembers(state) : false;
    if (currentChannel.group_constrained) {
        canManageUsers = false;
    }

    return {
        canManageUsers,
        isDirectMessage: currentChannel.type === General.DM_CHANNEL,
        membersCount,
    };
}

export default connect(mapStateToProps)(ManageMembers);
