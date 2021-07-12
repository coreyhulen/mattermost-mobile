// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {handleTeamChange} from '@actions/views/select_team';
import {logout} from '@actions/views/user';
import {getTeams, addUserToTeam} from '@mm-redux/actions/teams';
import {General} from '@mm-redux/constants';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getSortedJoinableTeams} from '@mm-redux/selectors/entities/teams';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';
import {isGuest} from '@utils/users';

import SelectTeam from './select_team.js';

function mapStateToProps(state) {
    const currentUser = getCurrentUser(state);
    const currentUserIsGuest = isGuest(currentUser);
    const locale = currentUser?.locale || General.DEFAULT_LOCALE;

    return {
        currentUserId: currentUser && currentUser.id,
        currentUserIsGuest,
        teamsRequest: state.requests.teams.getTeams,
        teams: getSortedJoinableTeams(state, locale),
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getTeams,
            handleTeamChange,
            addUserToTeam,
            logout,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectTeam);
