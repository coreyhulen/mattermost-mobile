// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {selectPost} from 'mattermost-redux/actions/posts';
import {RequestStatus} from 'mattermost-redux/constants';
import {makeGetPostsInChannel} from 'mattermost-redux/selectors/entities/posts';
import {getCurrentChannelId, getMyCurrentChannelMembership} from 'mattermost-redux/selectors/entities/channels';
import {loadPostsIfNecessaryWithRetry, loadThreadIfNecessary, increasePostVisibility, refreshChannelWithRetry} from 'app/actions/views/channel';
import {getTheme} from 'app/selectors/preferences';

import ChannelPostList from './channel_post_list';

function makeMapStateToProps() {
    const getPostsInChannel = makeGetPostsInChannel();

    return function mapStateToProps(state, ownProps) {
        const channelId = ownProps.channel.id;
        const {getPosts, getPostsRetryAttempts, getPostsSince, getPostsSinceRetryAttempts} = state.requests.posts;
        const posts = getPostsInChannel(state, channelId) || [];

        let getPostsStatus;
        if (getPostsRetryAttempts > 0) {
            getPostsStatus = getPosts.status;
        } else if (getPostsSinceRetryAttempts > 1) {
            getPostsStatus = getPostsSince.status;
        }

        return {
            channelIsLoading: state.views.channel.loading,
            channelIsRefreshing: getPostsStatus === RequestStatus.STARTED,
            channelRefreshingFailed: getPostsStatus === RequestStatus.FAILURE,
            currentChannelId: getCurrentChannelId(state),
            posts,
            postVisibility: state.views.channel.postVisibility[channelId],
            loadingPosts: state.views.channel.loadingPosts[channelId],
            myMember: getMyCurrentChannelMembership(state),
            networkOnline: state.offline.online,
            theme: getTheme(state),
            ...ownProps
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            loadPostsIfNecessaryWithRetry,
            loadThreadIfNecessary,
            increasePostVisibility,
            selectPost,
            refreshChannelWithRetry
        }, dispatch)
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps)(ChannelPostList);
