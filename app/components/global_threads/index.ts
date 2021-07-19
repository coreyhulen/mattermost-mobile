// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators, Dispatch} from 'redux';
import {connect} from 'react-redux';

import {handleViewingGlobalThreadsAll, handleViewingGlobalThreadsUnreads} from '@actions/views/threads';
import {getThreads, markAllThreadsInTeamRead} from '@mm-redux/actions/threads';
import {getCurrentUserId} from '@mm-redux/selectors/entities/common';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getTeamThreadCounts, getThreadOrderInCurrentTeam, getUnreadThreadOrderInCurrentTeam} from '@mm-redux/selectors/entities/threads';
import type {GlobalState} from '@mm-redux/types/store';
import {getViewingGlobalThreadsUnread} from '@selectors/threads';

import GlobalThreads from './global_threads';

function mapStateToProps(state: GlobalState) {
    const teamId = getCurrentTeamId(state);
    return {
        teamId,
        userId: getCurrentUserId(state),
        viewingUnreads: getViewingGlobalThreadsUnread(state),
        allThreadIds: getThreadOrderInCurrentTeam(state),
        unreadThreadIds: getUnreadThreadOrderInCurrentTeam(state),
        threadCount: getTeamThreadCounts(state, teamId),
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        actions: bindActionCreators({
            getThreads,
            handleViewingGlobalThreadsAll,
            handleViewingGlobalThreadsUnreads,
            markAllThreadsInTeamRead,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(GlobalThreads);
