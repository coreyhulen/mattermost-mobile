// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getRedirectLocation} from '@mm-redux/actions/general';
import {getExpandedLink} from '@mm-redux/selectors/entities/posts';

import ImagePreview from './image_preview';

import type {Post} from '@mm-redux/types/posts';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    post: Post;
}

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const {post} = ownProps;

    const link = post.metadata.embeds[0].url!;
    let expandedLink;
    if (link) {
        expandedLink = getExpandedLink(state, link);
    }

    return {
        link,
        expandedLink,
    };
}

const mapDispatchToProps = {
    getRedirectLocation,
};

export default connect(mapStateToProps, mapDispatchToProps)(ImagePreview);
