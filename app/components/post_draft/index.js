// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {General, Permissions} from '@mm-redux/constants';
import {getCurrentChannel, getChannel, isChannelReadOnlyById} from '@mm-redux/selectors/entities/channels';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {haveIChannelPermission} from '@mm-redux/selectors/entities/roles';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {getChannelMembersForDm} from '@selectors/channel';

import PostDraft from './post_draft';

export function mapStateToProps(state, ownProps) {
    const channel = ownProps.rootId ? getChannel(state, ownProps.channelId) : getCurrentChannel(state);
    const currentUserId = getCurrentUserId(state);
    const channelId = ownProps.channelId || (channel ? channel.id : '');
    let canPost = true;
    let deactivatedChannel = false;

    if (channel && channel.type === General.DM_CHANNEL) {
        const teammate = getChannelMembersForDm(state, channel);
        if (teammate.length && teammate[0].delete_at) {
            deactivatedChannel = true;
        }
    }

    if (channel && isMinimumServerVersion(state.entities.general.serverVersion, 5, 22)) {
        canPost = haveIChannelPermission(
            state,
            {
                channel: channel.id,
                team: channel.team_id,
                permission: Permissions.CREATE_POST,
                default: true,
            },
        );
    }

    let channelIsReadOnly = false;
    if (currentUserId && channelId) {
        channelIsReadOnly = isChannelReadOnlyById(state, channelId) || false;
    }

    return {
        canPost,
        channelId,
        channelIsArchived: ownProps.channelIsArchived || (channel ? channel.delete_at !== 0 : false),
        channelIsReadOnly,
        deactivatedChannel,
        theme: getTheme(state),
    };
}

export default connect(mapStateToProps, null, null, {forwardRef: true})(PostDraft);
