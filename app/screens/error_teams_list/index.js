// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {connection} from '@actions/device';
import {selectDefaultTeam} from '@actions/views/select_team';
import {logout, loadMe} from '@actions/views/user';

import ErrorTeamsList from './error_teams_list.js';

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            logout,
            selectDefaultTeam,
            connection,
            loadMe,
        }, dispatch),
    };
}

export default connect(null, mapDispatchToProps)(ErrorTeamsList);
