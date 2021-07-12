// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {convertChannelToPrivate} from '@mm-redux/actions/channels';
import {General, Permissions} from '@mm-redux/constants';
import {getCurrentChannel} from '@mm-redux/selectors/entities/channels';
import {getServerVersion} from '@mm-redux/selectors/entities/general';
import {haveIChannelPermission} from '@mm-redux/selectors/entities/roles';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserRoles} from '@mm-redux/selectors/entities/users';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {isAdmin as checkIsAdmin} from '@mm-redux/utils/user_utils';

import ConvertPrivate from './convert_private';

function mapStateToProps(state) {
    const currentChannel = getCurrentChannel(state);
    const channelId = currentChannel?.id || '';
    const currentTeamId = getCurrentTeamId(state);
    const isDefaultChannel = currentChannel.name === General.DEFAULT_CHANNEL;
    const isPublicChannel = currentChannel.type === General.OPEN_CHANNEL;
    const isChannelConvertible = !isDefaultChannel && isPublicChannel;
    const roles = getCurrentUserRoles(state) || '';
    const isAdmin = checkIsAdmin(roles);
    let canConvert = isChannelConvertible && isAdmin;
    if (isMinimumServerVersion(getServerVersion(state), 5, 28)) {
        canConvert = isChannelConvertible && haveIChannelPermission(
            state,
            {
                channel: channelId,
                team: currentTeamId,
                permission: Permissions.CONVERT_PUBLIC_CHANNEL_TO_PRIVATE,
                default: isAdmin,
            },
        );
    }

    return {
        canConvert,
        channelId,
        displayName: (currentChannel?.display_name || '').trim(),
    };
}

const mapDispatchToProps = {
    convertChannelToPrivate,
};

export default connect(mapStateToProps, mapDispatchToProps)(ConvertPrivate);
