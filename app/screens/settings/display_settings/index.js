// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {isTimezoneEnabled} from '@mm-redux/selectors/entities/timezone';
import {getAllowedThemes} from '@selectors/theme';
import {isThemeSwitchingEnabled} from '@utils/theme';

import DisplaySettings from './display_settings';

function mapStateToProps(state) {
    const enableTimezone = isTimezoneEnabled(state);
    const enableTheme = isThemeSwitchingEnabled(state) && getAllowedThemes(state).length > 1;

    return {
        enableTheme,
        enableTimezone,
        theme: getTheme(state),
    };
}

export default connect(mapStateToProps)(DisplaySettings);
