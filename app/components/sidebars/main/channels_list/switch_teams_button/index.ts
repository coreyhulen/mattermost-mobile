// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId, getMyTeamsCount, getChannelDrawerBadgeCount} from '@mm-redux/selectors/entities/teams';

import SwitchTeamsButton from './switch_teams_button';

function mapStateToProps(state) {
    const currentTeamId = getCurrentTeamId(state);

    return {
        currentTeamId,
        mentionCount: getChannelDrawerBadgeCount(state),
        teamsCount: getMyTeamsCount(state),
        theme: getTheme(state),
    };
}

export default connect(mapStateToProps)(SwitchTeamsButton);
