// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getMyCurrentChannelMembership} from '@mm-redux/selectors/entities/channels';

import NotificationPreference from './notification_preference';

function mapStateToProps(state) {
    const channelMember = getMyCurrentChannelMembership(state);

    return {
        channelId: channelMember?.channel_id,
        userId: channelMember?.user_id,
        notifyProps: channelMember?.notify_props,
    };
}

export default connect(mapStateToProps)(NotificationPreference);
