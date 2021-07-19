// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {General} from '@mm-redux/constants';
import {getChannel} from '@mm-redux/selectors/entities/channels';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getUser} from '@mm-redux/selectors/entities/users';
import {GlobalState} from '@mm-redux/types/store';
import {getChannelNameForSearchAutocomplete} from '@selectors/channel';
import {isGuest as isGuestUser} from '@utils/users';

import ChannelMentionItem from './channel_mention_item';

type OwnProps = {
    channelId: string;
}

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const channel = getChannel(state, ownProps.channelId);
    let displayName = getChannelNameForSearchAutocomplete(state, ownProps.channelId);

    let isBot = false;
    let isGuest = false;
    if (channel?.type === General.DM_CHANNEL) {
        const teammate = channel.teammate_id ? getUser(state, channel.teammate_id) : undefined;
        if (teammate) {
            displayName = teammate.username;
            isBot = teammate.is_bot || false;
            isGuest = isGuestUser(teammate) || false;
        }
    }

    return {
        displayName,
        name: channel?.name,
        shared: channel?.shared,
        type: channel?.type,
        isBot,
        isGuest,
        theme: getTheme(state),
    };
}

export default connect(mapStateToProps)(ChannelMentionItem);
