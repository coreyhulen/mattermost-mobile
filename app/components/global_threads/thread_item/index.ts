// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators, Dispatch} from 'redux';
import {connect} from 'react-redux';

import {selectPost} from '@mm-redux/actions/posts';
import {getPost, getPostThread} from '@actions/views/post';
import {getChannel} from '@mm-redux/selectors/entities/channels';
import {getPost as getPostSelector} from '@mm-redux/selectors/entities/posts';
import {getThread} from '@mm-redux/selectors/entities/threads';
import {getUser} from '@mm-redux/selectors/entities/users';
import type {GlobalState} from '@mm-redux/types/store';

import ThreadItem, {DispatchProps, OwnProps, StateProps} from './thread_item';

function mapStateToProps(state: GlobalState, props: OwnProps) {
    const {threadId} = props;
    const post = getPostSelector(state, threadId);
    return {
        channel: getChannel(state, post?.channel_id),
        post: getPostSelector(state, threadId),
        thread: getThread(state, threadId),
        threadStarter: getUser(state, post?.user_id),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        actions: bindActionCreators({
            getPost,
            getPostThread,
            selectPost,
        }, dispatch),
    };
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(ThreadItem);
