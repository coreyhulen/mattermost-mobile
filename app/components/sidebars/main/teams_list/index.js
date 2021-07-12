// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {handleTeamChange} from '@actions/views/select_team';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId, getMySortedTeamIds, getJoinableTeamIds} from '@mm-redux/selectors/entities/teams';
import {getCurrentLocale} from '@selectors/i18n';

import TeamsList from './teams_list';

function mapStateToProps(state) {
    const locale = getCurrentLocale(state);

    return {
        currentTeamId: getCurrentTeamId(state),
        hasOtherJoinableTeams: getJoinableTeamIds(state).length > 0,
        teamIds: getMySortedTeamIds(state, locale),
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            handleTeamChange,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(TeamsList);
