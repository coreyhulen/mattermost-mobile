// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {handleSelectChannelByName, refreshChannelWithRetry} from '@actions/views/channel';
import {closePermalink, showPermalink} from '@actions/views/permalink';
import {getPostThread} from '@actions/views/post';
import {setDeepLinkURL} from '@actions/views/root';
import {getConfig, getCurrentUrl} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeam} from '@mm-redux/selectors/entities/teams';
import {makePreparePostIdsForPostList, START_OF_NEW_MESSAGES} from '@mm-redux/utils/post_list';

import PostList from './post_list';

import type {GlobalState} from '@mm-redux/types/store';

type PostListOwnProps = {
    highlightPostId?: string;
    indicateNewMessages: boolean;
    lastViewedAt: number;
    postIds: string[];
}

function mapStateToProps() {
    const preparePostIds = makePreparePostIdsForPostList();

    return (state: GlobalState, ownProps: PostListOwnProps) => {
        const {highlightPostId, indicateNewMessages, lastViewedAt, postIds} = ownProps;
        const ids = preparePostIds(state, postIds, lastViewedAt, indicateNewMessages);
        let initialIndex = ids.indexOf(START_OF_NEW_MESSAGES);

        if (highlightPostId) {
            initialIndex = ids.indexOf(highlightPostId);
        }

        return {
            deepLinkURL: state.views.root.deepLinkURL,
            postIds: ids,
            initialIndex: Math.max(initialIndex, 0),
            serverURL: getCurrentUrl(state),
            siteURL: getConfig(state)?.SiteURL,
            theme: getTheme(state),
            currentTeamName: getCurrentTeam(state)?.name,
        };
    };
}

const mapDispatchToProps = {
    closePermalink,
    getPostThread,
    handleSelectChannelByName,
    refreshChannelWithRetry,
    setDeepLinkURL,
    showPermalink,
};

export default connect(mapStateToProps, mapDispatchToProps)(PostList);
