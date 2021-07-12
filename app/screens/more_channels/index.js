// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {handleSelectChannel, setChannelDisplayName} from '@actions/views/channel';
import {getArchivedChannels, getChannels, getSharedChannels, joinChannel, searchChannels} from '@mm-redux/actions/channels';
import {General} from '@mm-redux/constants';
import {getConfig, getLicense} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId, getCurrentUserRoles} from '@mm-redux/selectors/entities/users';
import {showCreateOption} from '@mm-redux/utils/channel_utils';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {isAdmin, isSystemAdmin} from '@mm-redux/utils/user_utils';
import {teamArchivedChannels, joinablePublicChannels, joinableSharedChannels} from '@selectors/channel';

import MoreChannels from './more_channels';

const defaultSharedChannels = [];

function mapStateToProps(state) {
    const config = getConfig(state);
    const license = getLicense(state);
    const sharedChannelsEnabled = config.ExperimentalSharedChannels === 'true';
    const roles = getCurrentUserRoles(state);
    const channels = joinablePublicChannels(state);
    const sharedChannels = sharedChannelsEnabled ? joinableSharedChannels(state) : defaultSharedChannels;
    const archivedChannels = teamArchivedChannels(state);
    const currentTeamId = getCurrentTeamId(state);
    const canShowArchivedChannels = config.ExperimentalViewArchivedChannels === 'true' &&
        isMinimumServerVersion(state.entities.general.serverVersion, 5, 18);

    return {
        canCreateChannels: showCreateOption(state, config, license, currentTeamId, General.OPEN_CHANNEL, isAdmin(roles), isSystemAdmin(roles)),
        currentUserId: getCurrentUserId(state),
        currentTeamId,
        channels,
        sharedChannels,
        sharedChannelsEnabled,
        archivedChannels,
        theme: getTheme(state),
        canShowArchivedChannels,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getArchivedChannels,
            getChannels,
            getSharedChannels,
            handleSelectChannel,
            joinChannel,
            searchChannels,
            setChannelDisplayName,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MoreChannels);
