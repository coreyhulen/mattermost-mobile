// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId, getTeam, makeGetBadgeCountForTeamId} from '@mm-redux/selectors/entities/teams';

import TeamsListItem from './teams_list_item.js';

function makeMapStateToProps() {
    const getMentionCount = makeGetBadgeCountForTeamId();

    return function mapStateToProps(state, ownProps) {
        const team = getTeam(state, ownProps.teamId);

        return {
            currentTeamId: getCurrentTeamId(state),
            displayName: team.display_name,
            mentionCount: getMentionCount(state, ownProps.teamId),
            name: team.name,
            theme: getTheme(state),
        };
    };
}

export default connect(makeMapStateToProps)(TeamsListItem);
