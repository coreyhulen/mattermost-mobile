// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getBadgeCount} from '@selectors/views';

import MainSidebarDrawerButton from './main_sidebar_drawer_button';

function mapStateToProps(state) {
    return {
        badgeCount: getBadgeCount(state),
        theme: getTheme(state),
    };
}

export default connect(mapStateToProps)(MainSidebarDrawerButton);
