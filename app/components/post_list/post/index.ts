// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {showPermalink} from '@actions/views/permalink';
import {removePost} from '@mm-redux/actions/posts';
import {getChannel} from '@mm-redux/selectors/entities/channels';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getPost, isRootPost} from '@mm-redux/selectors/entities/posts';
import {getMyPreferences, getTeammateNameDisplaySetting} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getUser} from '@mm-redux/selectors/entities/users';
import {isPostFlagged, isSystemMessage} from '@mm-redux/utils/post_utils';
import {canDeletePost} from '@selectors/permissions';
import {areConsecutivePosts, postUserDisplayName} from '@utils/post';

import Post from './post';

import type {Post as PostType} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    highlight?: boolean;
    postId: string;
    post?: PostType;
    previousPostId?: string;
    nextPostId?: string;
    testID: string;
    theme: Theme;
}

function mapSateToProps(state: GlobalState, ownProps: OwnProps) {
    const {nextPostId, postId, previousPostId} = ownProps;
    const post = ownProps.post || getPost(state, postId);
    const myPreferences = getMyPreferences(state);
    const channel = getChannel(state, post.channel_id);
    const teamId = getCurrentTeamId(state);
    const author = getUser(state, post.user_id);
    const previousPost = previousPostId ? getPost(state, previousPostId) : undefined;
    const config = getConfig(state);
    const teammateNameDisplay = getTeammateNameDisplaySetting(state);
    const enablePostUsernameOverride = config.EnablePostUsernameOverride === 'true';
    const isConsecutivePost = post && previousPost && !author?.is_bot && !isRootPost(state, post.id) && areConsecutivePosts(post, previousPost);
    let isFirstReply = true;
    let isLastReply = true;
    let canDelete = false;
    let rootPostAuthor;

    if (post && channel?.delete_at === 0) {
        canDelete = canDeletePost(state, channel?.team_id || teamId, post?.channel_id, post, false);
    }

    if (post.root_id) {
        const nextPost = nextPostId ? getPost(state, nextPostId) : undefined;
        isFirstReply = (previousPost?.id === post.root_id || previousPost?.root_id === post.root_id);
        isLastReply = !(nextPost?.root_id === post.root_id);
    }

    if (!isSystemMessage(post)) {
        const rootPost = post.root_id ? getPost(state, post.root_id) : undefined;
        const rootPostUser = rootPost?.user_id ? getUser(state, rootPost.user_id) : undefined;
        const differentThreadSequence = previousPost?.root_id ? previousPost?.root_id !== post.root_id : previousPost?.id !== post.root_id;

        if (rootPost?.user_id &&
            previousPostId &&
            differentThreadSequence
        ) {
            rootPostAuthor = postUserDisplayName(rootPost, rootPostUser, teammateNameDisplay, enablePostUsernameOverride);
        }
    }

    return {
        canDelete,
        enablePostUsernameOverride,
        isConsecutivePost,
        isFirstReply,
        isFlagged: isPostFlagged(post.id, myPreferences),
        isLastReply,
        post,
        rootPostAuthor,
        teammateNameDisplay,
    };
}

const mapDispatchToProps = {
    removePost,
    showPermalink,
};

export default connect(mapSateToProps, mapDispatchToProps)(Post);
