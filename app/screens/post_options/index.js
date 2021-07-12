// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {addReaction} from '@actions/views/emoji';
import {MAX_ALLOWED_REACTIONS} from '@constants/emoji';
import {THREAD} from '@constants/screen';
import mattermostManaged from '@mattermost-managed';
import {
    deletePost,
    flagPost,
    pinPost,
    unflagPost,
    unpinPost,
    removePost,
    setUnreadPost,
} from '@mm-redux/actions/posts';
import {General, Permissions, Posts} from '@mm-redux/constants';
import {isChannelReadOnlyById, getChannel, getCurrentChannelId} from '@mm-redux/selectors/entities/channels';
import {getConfig, getLicense} from '@mm-redux/selectors/entities/general';
import {makeGetReactionsForPost} from '@mm-redux/selectors/entities/posts';
import {getMyPreferences, getTheme} from '@mm-redux/selectors/entities/preferences';
import {haveIChannelPermission} from '@mm-redux/selectors/entities/roles';
import {getCurrentTeamId, getCurrentTeamUrl} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {canEditPost, isPostFlagged, isSystemMessage} from '@mm-redux/utils/post_utils';
import {getDimensions} from '@selectors/device';
import {selectEmojisCountFromReactions} from '@selectors/emojis';
import {canDeletePost} from '@selectors/permissions';

import PostOptions from './post_options';

export function makeMapStateToProps() {
    const getReactionsForPostSelector = makeGetReactionsForPost();

    return (state, ownProps) => {
        const managedConfig = mattermostManaged.getCachedConfig();
        const post = ownProps.post;
        const channel = getChannel(state, post.channel_id);
        const config = getConfig(state);
        const license = getLicense(state);
        const currentUserId = getCurrentUserId(state);
        const currentTeamId = getCurrentTeamId(state);
        const currentChannelId = getCurrentChannelId(state);
        const reactions = getReactionsForPostSelector(state, post.id);
        const channelIsReadOnly = isChannelReadOnlyById(state, post.channel_id);
        const myPreferences = getMyPreferences(state);
        const channelIsArchived = channel.delete_at !== 0;
        const isSystemPost = isSystemMessage(post);
        const hasBeenDeleted = (post.delete_at !== 0 || post.state === Posts.POST_DELETED);

        let canMarkAsUnread = true;
        let canReply = true;
        let canCopyPermalink = true;
        let canCopyText = false;
        let canEdit = false;
        let canEditUntil = -1;
        let canFlag = true;
        let canPin = true;

        const canPost = haveIChannelPermission(
            state,
            {
                channel: post.channel_id,
                team: channel.team_id || currentTeamId,
                permission: Permissions.CREATE_POST,
                default: true,
            },
        );

        let canAddReaction = haveIChannelPermission(state, {
            team: currentTeamId,
            channel: post.channel_id,
            permission: Permissions.ADD_REACTION,
            default: true,
        });

        let canDelete = false;
        if (post && channel?.delete_at === 0) {
            canDelete = canDeletePost(state, channel?.team_id || currentTeamId, post?.channel_id, post, false);
        }

        if (ownProps.location === THREAD) {
            canReply = false;
        }

        if (channelIsArchived || channelIsReadOnly) {
            canAddReaction = false;
            canReply = false;
            canDelete = false;
            canPin = false;
        } else {
            canEdit = canEditPost(state, config, license, currentTeamId, currentChannelId, currentUserId, post);
            if (canEdit && license.IsLicensed === 'true' &&
                (config.AllowEditPost === General.ALLOW_EDIT_POST_TIME_LIMIT || (config.PostEditTimeLimit !== -1 && config.PostEditTimeLimit !== '-1'))
            ) {
                canEditUntil = post.create_at + (config.PostEditTimeLimit * 1000);
            }
        }

        if (!canPost) {
            canReply = false;
        }

        if (isSystemPost) {
            canAddReaction = false;
            canReply = false;
            canCopyPermalink = false;
            canEdit = false;
            canPin = false;
            canFlag = false;
        }
        if (hasBeenDeleted) {
            canDelete = false;
        }

        if (!ownProps.showAddReaction) {
            canAddReaction = false;
        }

        if (!isSystemPost && managedConfig?.copyAndPasteProtection !== 'true' && post.message) {
            canCopyText = true;
        }

        if (channelIsArchived) {
            canMarkAsUnread = false;
        }

        return {
            ...getDimensions(state),
            canAddReaction: canAddReaction && selectEmojisCountFromReactions(reactions) < MAX_ALLOWED_REACTIONS,
            canReply,
            canCopyPermalink,
            canCopyText,
            canEdit,
            canEditUntil,
            canDelete,
            canFlag,
            canPin,
            canMarkAsUnread,
            currentTeamUrl: getCurrentTeamUrl(state),
            currentUserId,
            isFlagged: isPostFlagged(post.id, myPreferences),
            theme: getTheme(state),
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            addReaction,
            deletePost,
            flagPost,
            pinPost,
            removePost,
            unflagPost,
            unpinPost,
            setUnreadPost,
        }, dispatch),
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps)(PostOptions);
