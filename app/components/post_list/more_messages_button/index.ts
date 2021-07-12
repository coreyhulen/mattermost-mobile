// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {resetUnreadMessageCount} from '@actions/views/channel';

import MoreMessagesButton from './more_messages_button';

import type {GlobalState} from '@mm-redux/types/store';

type MoreMessagesButtonOwnProps = {
    channelId?: string;
}

function mapStateToProps(state: GlobalState, ownProps: MoreMessagesButtonOwnProps) {
    const {channelId = ''} = ownProps;
    const unreadCount = state.views.channel.unreadMessageCount[channelId] || 0;
    const loadingPosts = Boolean(state.views.channel.loadingPosts[channelId]);
    const manuallyUnread = Boolean(state.entities.channels.manuallyUnread[channelId]);

    return {
        unreadCount,
        loadingPosts,
        manuallyUnread,
    };
}

const mapDispatchToProps = {
    resetUnreadMessageCount,
};

export default connect(mapStateToProps, mapDispatchToProps)(MoreMessagesButton);
