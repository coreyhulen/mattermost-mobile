// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {canManageChannelMembers, getCurrentChannel} from '@mm-redux/selectors/entities/channels';

import AddMembers from './add_members';

function mapStateToProps(state) {
    const currentChannel = getCurrentChannel(state);
    let canManageUsers = currentChannel?.id ? canManageChannelMembers(state) : false;
    if (currentChannel.group_constrained) {
        canManageUsers = false;
    }

    return {
        canManageUsers,
        groupConstrained: currentChannel.group_constrained,
    };
}

export default connect(mapStateToProps)(AddMembers);
