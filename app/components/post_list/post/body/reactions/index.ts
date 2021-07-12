// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {addReaction} from '@actions/views/emoji';
import {MAX_ALLOWED_REACTIONS} from '@constants/emoji';
import {removeReaction} from '@mm-redux/actions/posts';
import Permissions from '@mm-redux/constants/permissions';
import {getChannel, isChannelReadOnlyById} from '@mm-redux/selectors/entities/channels';
import {makeGetReactionsForPost} from '@mm-redux/selectors/entities/posts';
import {haveIChannelPermission} from '@mm-redux/selectors/entities/roles';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {selectEmojisCountFromReactions} from '@selectors/emojis';

import Reactions from './reactions';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type{GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    post: Post;
    theme: Theme;
};

function mapStateToProps() {
    const getReactionsForPostSelector = makeGetReactionsForPost();
    return (state: GlobalState, ownProps: OwnProps) => {
        const {post} = ownProps;
        const channel = getChannel(state, post.channel_id);
        const channelIsReadOnly = isChannelReadOnlyById(state, channel?.id);
        const currentUserId = getCurrentUserId(state);
        const reactions = getReactionsForPostSelector(state, post.id);

        let canAddReaction = true;
        let canRemoveReaction = true;
        let canAddMoreReactions = true;
        if (channel.delete_at !== 0 || channelIsReadOnly) {
            canAddReaction = false;
            canRemoveReaction = false;
            canAddMoreReactions = false;
        }

        canAddReaction = haveIChannelPermission(state, {
            team: channel?.team_id,
            channel: channel?.id,
            permission: Permissions.ADD_REACTION,
            default: true,
        });

        canAddMoreReactions = selectEmojisCountFromReactions(reactions) < MAX_ALLOWED_REACTIONS;

        canRemoveReaction = haveIChannelPermission(state, {
            team: channel?.team_id,
            channel: channel?.id,
            permission: Permissions.REMOVE_REACTION,
            default: true,
        });

        return {
            currentUserId,
            reactions,
            canAddReaction,
            canAddMoreReactions,
            canRemoveReaction,
            postId: post.id,
        };
    };
}

const mapDispatchToProps = {
    addReaction,
    removeReaction,
};

export default connect(mapStateToProps, mapDispatchToProps)(Reactions);
