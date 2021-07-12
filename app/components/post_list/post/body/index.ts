// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {General} from '@mm-redux/constants';
import {getChannel, canManageChannelMembers} from '@mm-redux/selectors/entities/channels';
import {getCustomEmojisByName} from '@mm-redux/selectors/entities/emojis';
import {makeIsPostCommentMention, postHasReactions} from '@mm-redux/selectors/entities/posts';
import {memoizeResult} from '@mm-redux/utils/helpers';
import {isPostEphemeral} from '@mm-redux/utils/post_utils';
import {appsEnabled} from '@utils/apps';
import {hasEmojisOnly} from '@utils/emoji_utils';

import Body from './body';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    highlight: boolean;
    isFirstReply?: boolean;
    isLastReply?: boolean;
    location: string;
    post: Post;
    rootPostAuthor?: string;
    showAddReaction?: boolean;
    theme: Theme;
}

function mapStateToProps() {
    const isPostCommentMention = makeIsPostCommentMention();
    const memoizeHasEmojisOnly = memoizeResult((message: string, customEmojis: Set<string>) => hasEmojisOnly(message, customEmojis));
    return (state: GlobalState, ownProps: OwnProps) => {
        const {post} = ownProps;
        const channel = getChannel(state, post.channel_id);
        const isUserCanManageMembers = canManageChannelMembers(state);
        const customEmojis = getCustomEmojisByName(state);
        const {isEmojiOnly, isJumboEmoji} = memoizeHasEmojisOnly(post.message, customEmojis);
        const isEphemeralPost = isPostEphemeral(post);

        let isPostAddChannelMember = false;
        if (
            [General.PRIVATE_CHANNEL, General.OPEN_CHANNEL].includes(channel?.type) &&
            isUserCanManageMembers &&
            isEphemeralPost &&
            post.props?.add_channel_member
        ) {
            isPostAddChannelMember = true;
        }

        return {
            appsEnabled: appsEnabled(state),
            hasReactions: postHasReactions(state, post.id),
            highlightReplyBar: isPostCommentMention(state, post.id, post.root_id),
            isEmojiOnly,
            isJumboEmoji,
            isPostAddChannelMember,
        };
    };
}

export default connect(mapStateToProps)(Body);
