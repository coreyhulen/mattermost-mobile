// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {GlobalState} from '@mm-redux/types/store';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';

import {appsEnabled} from '@utils/apps';

import AppSlashSuggestion from './app_slash_suggestion';

function mapStateToProps(state: GlobalState) {
    return {
        currentTeamId: getCurrentTeamId(state),
        theme: getTheme(state),
        appsEnabled: appsEnabled(state),
    };
}

export default connect(mapStateToProps)(AppSlashSuggestion);
