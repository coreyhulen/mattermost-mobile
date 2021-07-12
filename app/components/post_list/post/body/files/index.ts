// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {makeGetFilesForPost} from '@mm-redux/selectors/entities/files';
import {canDownloadFilesOnMobile} from '@mm-redux/selectors/entities/general';

import Files from './files';

import type {Theme} from '@mm-redux/types/preferences';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    fileIds: string[];
    failed?: boolean;
    isReplyPost: boolean;
    postId: string;
    theme: Theme;
}

function mapStateToProps() {
    const getFilesForPost = makeGetFilesForPost();
    return (state: GlobalState, ownProps: OwnProps) => {
        return {
            canDownloadFiles: canDownloadFilesOnMobile(state),
            files: getFilesForPost(state, ownProps.postId),
        };
    };
}

export default connect(mapStateToProps)(Files);
