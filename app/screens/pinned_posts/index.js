// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {clearSearch, getPinnedPosts} from '@mm-redux/actions/search';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {makePreparePostIdsForSearchPosts} from '@selectors/post_list';

import PinnedPosts from './pinned_posts';

function makeMapStateToProps() {
    const preparePostIds = makePreparePostIdsForSearchPosts();
    return (state, ownProps) => {
        const {pinned} = state.entities.search;
        const channelPinnedPosts = pinned[ownProps.currentChannelId] || [];
        const postIds = preparePostIds(state, channelPinnedPosts);

        return {
            postIds,
            theme: getTheme(state),
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            clearSearch,
            getPinnedPosts,
        }, dispatch),
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps)(PinnedPosts);
