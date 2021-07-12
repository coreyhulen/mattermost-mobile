// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {handleSelectChannelByName} from '@actions/views/channel';
import {showPermalink} from '@actions/views/permalink';
import {getConfig, getCurrentUrl} from '@mm-redux/selectors/entities/general';
import {getCurrentTeam} from '@mm-redux/selectors/entities/teams';

import MarkdownLink from './markdown_link';

function mapStateToProps(state) {
    return {
        serverURL: getCurrentUrl(state),
        siteURL: getConfig(state).SiteURL,
        currentTeamName: getCurrentTeam(state)?.name,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            handleSelectChannelByName,
            showPermalink,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MarkdownLink);
