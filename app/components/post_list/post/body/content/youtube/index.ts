// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getConfig} from '@mm-redux/selectors/entities/general';

import YouTube from './youtube';

import type {Post} from '@mm-redux/types/posts';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    googleDeveloperKey?: string;
    isReplyPost: boolean;
    post: Post;
}

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const {isReplyPost} = ownProps;
    const config = getConfig(state);
    return {
        googleDeveloperKey: config.GoogleDeveloperKey,
        isReplyPost,
    };
}

export default connect(mapStateToProps)(YouTube);
