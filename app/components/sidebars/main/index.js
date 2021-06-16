// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {fetchMyCategories} from '@mm-redux/actions/channel_categories';
import {joinChannel} from '@mm-redux/actions/channels';
import {getTeams} from '@mm-redux/actions/teams';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId, getMyTeamsCount} from '@mm-redux/selectors/entities/teams';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';

import {setChannelDisplayName, handleSelectChannel} from 'app/actions/views/channel';
import {makeDirectChannel} from 'app/actions/views/more_dms';

import MainSidebar from './main_sidebar';

function mapStateToProps(state) {
    const currentUser = getCurrentUser(state);

    return {
        locale: currentUser?.locale,
        currentTeamId: getCurrentTeamId(state),
        currentUserId: currentUser?.id,
        teamsCount: getMyTeamsCount(state),
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getTeams,
            joinChannel,
            makeDirectChannel,
            setChannelDisplayName,
            handleSelectChannel,
            fetchMyCategories,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(MainSidebar);
