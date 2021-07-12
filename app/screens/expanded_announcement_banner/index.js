// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {dismissBanner} from '@actions/views/announcement';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {isLandscape} from '@selectors/device';

import ExpandedAnnouncementBanner from './expanded_announcement_banner';

function mapStateToProps(state) {
    const config = getConfig(state);

    return {
        allowDismissal: config.AllowBannerDismissal === 'true',
        bannerText: config.BannerText,
        isLandscape: isLandscape(state),
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            dismissBanner,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExpandedAnnouncementBanner);
