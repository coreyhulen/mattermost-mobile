// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {autocompleteUsers} from '@mm-redux/actions/users';
import {Permissions} from '@mm-redux/constants';
import {getCurrentChannelId, getDefaultChannel} from '@mm-redux/selectors/entities/channels';
import {getLicense} from '@mm-redux/selectors/entities/general';
import {getAssociatedGroupsForReference, searchAssociatedGroupsForReferenceLocal} from '@mm-redux/selectors/entities/groups';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {haveIChannelPermission} from '@mm-redux/selectors/entities/roles';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {
    filterMembersInChannel,
    filterMembersNotInChannel,
    filterMembersInCurrentTeam,
    getMatchTermForAtMention,
} from '@selectors/autocomplete';

import AtMention from './at_mention';

function mapStateToProps(state, ownProps) {
    const {cursorPosition, isSearch} = ownProps;
    const currentChannelId = getCurrentChannelId(state);
    const currentTeamId = getCurrentTeamId(state);
    const license = getLicense(state);
    const hasLicense = license?.IsLicensed === 'true' && license?.LDAPGroups === 'true';
    let useChannelMentions = true;
    if (isMinimumServerVersion(state.entities.general.serverVersion, 5, 22)) {
        useChannelMentions = haveIChannelPermission(
            state,
            {
                channel: currentChannelId,
                team: currentTeamId,
                permission: Permissions.USE_CHANNEL_MENTIONS,
                default: true,
            },
        );
    }

    const value = ownProps.value.substring(0, cursorPosition);
    const matchTerm = getMatchTermForAtMention(value, isSearch);

    let teamMembers;
    let inChannel;
    let outChannel;
    let groups = [];
    if (isSearch) {
        teamMembers = filterMembersInCurrentTeam(state, matchTerm);
    } else {
        inChannel = filterMembersInChannel(state, matchTerm);
        outChannel = filterMembersNotInChannel(state, matchTerm);
    }

    if (haveIChannelPermission(state, {channel: currentChannelId, team: currentTeamId, permission: Permissions.USE_GROUP_MENTIONS, default: true}) && hasLicense && isMinimumServerVersion(state.entities.general.serverVersion, 5, 24)) {
        if (matchTerm) {
            groups = searchAssociatedGroupsForReferenceLocal(state, matchTerm, currentTeamId, currentChannelId);
        } else {
            groups = getAssociatedGroupsForReference(state, currentTeamId, currentChannelId);
        }
    }

    return {
        currentChannelId,
        currentTeamId,
        defaultChannel: getDefaultChannel(state),
        matchTerm,
        teamMembers,
        inChannel,
        outChannel,
        requestStatus: state.requests.users.autocompleteUsers.status,
        theme: getTheme(state),
        useChannelMentions,
        groups,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            autocompleteUsers,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AtMention);
