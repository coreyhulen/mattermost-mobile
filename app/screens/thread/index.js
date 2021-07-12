// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {selectPost} from '@mm-redux/actions/posts';
import {getChannel, getMyCurrentChannelMembership} from '@mm-redux/selectors/entities/channels';
import {makeGetPostIdsForThread} from '@mm-redux/selectors/entities/posts';
import {getTheme} from '@mm-redux/selectors/entities/preferences';

import Thread from './thread';

function makeMapStateToProps() {
    const getPostIdsForThread = makeGetPostIdsForThread();
    return function mapStateToProps(state, ownProps) {
        const channel = getChannel(state, ownProps.channelId);

        return {
            channelId: ownProps.channelId,
            channelType: channel ? channel.type : '',
            displayName: channel ? channel.display_name : '',
            myMember: getMyCurrentChannelMembership(state),
            rootId: ownProps.rootId,
            postIds: getPostIdsForThread(state, ownProps.rootId),
            theme: getTheme(state),
            channelIsArchived: channel ? channel.delete_at !== 0 : false,
            threadLoadingStatus: state.requests.posts.getPostThread,
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            selectPost,
        }, dispatch),
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps)(Thread);
