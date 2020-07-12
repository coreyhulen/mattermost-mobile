// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import MoreMessagesButton from './more_messages_button';

function mapStateToProps(state, ownProps) {
    const {channelId} = ownProps;
    const unreadCount = state.views.channel.unreadMessageCount[channelId] || 0;
    const loadingPosts = Boolean(state.views.channel.loadingPosts[channelId]);
    const manuallyUnread = Boolean(state.entities.channels.manuallyUnread[channelId]);

    return {
        unreadCount,
        loadingPosts,
        manuallyUnread,
    };
}

export default connect(mapStateToProps)(MoreMessagesButton);
