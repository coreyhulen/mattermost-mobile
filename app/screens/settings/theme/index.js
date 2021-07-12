// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {savePreferences} from '@mm-redux/actions/preferences';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {isLandscape, isTablet} from '@selectors/device';
import {getAllowedThemes, getCustomTheme} from '@selectors/theme';

import Theme from './theme';

const mapStateToProps = (state) => ({
    allowedThemes: getAllowedThemes(state),
    customTheme: getCustomTheme(state),
    isLandscape: isLandscape(state),
    isTablet: isTablet(state),
    teamId: getCurrentTeamId(state),
    theme: getTheme(state),
    userId: getCurrentUserId(state),
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators({
        savePreferences,
    }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Theme);
