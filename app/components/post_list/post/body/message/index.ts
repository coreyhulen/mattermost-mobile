// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getChannel} from '@mm-redux/selectors/entities/channels';
import {makeGetMentionKeysForPost} from '@mm-redux/selectors/entities/search';

import Message from './message';

import type {Post as PostType} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    post: PostType;
    theme: Theme;
}

function mapSateToProps() {
    const getMentionKeysForPost = makeGetMentionKeysForPost();
    return (state: GlobalState, ownProps: OwnProps) => {
        const {post} = ownProps;
        const channel = getChannel(state, post.channel_id) || {};

        let disableGroupHighlight = false;
        if (post.id === post.pending_post_id) {
            disableGroupHighlight = true;
        }

        return {
            mentionKeys: getMentionKeysForPost(state, channel, disableGroupHighlight, post.props?.mentionHighlightDisabled),
        };
    };
}

export default connect(mapSateToProps)(Message);
