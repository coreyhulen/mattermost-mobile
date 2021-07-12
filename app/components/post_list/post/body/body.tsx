// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';

import FormattedText from '@components/formatted_text';
import MarkdownEmoji from '@components/markdown/markdown_emoji';
import {THREAD} from '@constants/screen';
import {Posts} from '@mm-redux/constants';
import {isEdited, isPostEphemeral} from '@mm-redux/utils/post_utils';
import {makeStyleSheetFromTheme} from '@utils/theme';

import AddMembers from './add_members';
import Content from './content';
import Failed from './failed';
import Files from './files';
import Message from './message';
import Reactions from './reactions';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';

type BodyProps = {
    appsEnabled: boolean;
    hasReactions: boolean;
    highlight: boolean;
    highlightReplyBar: boolean;
    isEmojiOnly: boolean;
    isFirstReply?: boolean;
    isJumboEmoji: boolean;
    isLastReply?: boolean;
    isPostAddChannelMember: boolean;
    location: string;
    post: Post;
    rootPostAuthor?: string;
    showAddReaction?: boolean;
    theme: Theme;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        messageBody: {
            paddingBottom: 2,
            paddingTop: 2,
            flex: 1,
        },
        messageContainer: {width: '100%'},
        replyBar: {
            backgroundColor: theme.centerChannelColor,
            opacity: 0.1,
            marginLeft: 1,
            marginRight: 7,
            width: 3,
            flexBasis: 3,
        },
        replyBarFirst: {paddingTop: 10},
        replyBarLast: {paddingBottom: 10},
        replyMention: {
            backgroundColor: theme.mentionHighlightBg,
            opacity: 1,
        },
        message: {
            color: theme.centerChannelColor,
            fontSize: 15,
            lineHeight: 20,
        },
        messageContainerWithReplyBar: {
            flexDirection: 'row',
            width: '100%',
        },
    };
});

const Body = ({
    appsEnabled, hasReactions, highlight, highlightReplyBar, isEmojiOnly, isFirstReply, isJumboEmoji, isLastReply, isPostAddChannelMember,
    location, post, rootPostAuthor, showAddReaction, theme,
}: BodyProps) => {
    const style = getStyleSheet(theme);
    const hasBeenDeleted = Boolean(post.delete_at) || post.state === Posts.POST_DELETED;
    let body;
    let message;

    const isReplyPost = Boolean(post.root_id && (!isPostEphemeral(post) || post.state === Posts.POST_DELETED) && location !== THREAD);
    const hasContent = (post.metadata?.embeds?.length || (appsEnabled && post.props?.app_bindings?.length)) || post.props?.attachments?.length;

    const replyBarStyle = useCallback((): StyleProp<ViewStyle>[]|undefined => {
        if (!isReplyPost) {
            return undefined;
        }

        const barStyle = [style.replyBar];

        if (isFirstReply || rootPostAuthor) {
            barStyle.push(style.replyBarFirst);
        }

        if (isLastReply) {
            barStyle.push(style.replyBarLast);
        }

        if (highlightReplyBar) {
            barStyle.push(style.replyMention);
        }

        return barStyle;
    }, []);

    if (hasBeenDeleted) {
        body = (
            <FormattedText
                style={style.message}
                id='post_body.deleted'
                defaultMessage='(message deleted)'
            />
        );
    } else if (isPostAddChannelMember) {
        message = (
            <AddMembers
                post={post}
                theme={theme}
            />
        );
    } else if (isEmojiOnly) {
        message = (
            <MarkdownEmoji
                baseTextStyle={style.message}
                isEdited={isEdited(post)}
                isJumboEmoji={isJumboEmoji}
                value={post.message}
            />
        );
    } else if (post.message.length) {
        message = (
            <Message
                highlight={highlight}
                isReplyPost={isReplyPost}
                location={location}
                post={post}
                theme={theme}
            />
        );
    }

    if (!hasBeenDeleted) {
        body = (
            <View style={style.messageBody}>
                {message}
                {hasContent &&
                <Content
                    isReplyPost={isReplyPost}
                    post={post}
                    theme={theme}
                />
                }
                {Boolean(post.file_ids?.length) &&
                <Files
                    fileIds={post.file_ids!}
                    failed={post.failed}
                    postId={post.id}
                    isReplyPost={isReplyPost}
                    theme={theme}
                />
                }
                {hasReactions && showAddReaction &&
                <Reactions
                    post={post}
                    theme={theme}
                />
                }
            </View>
        );
    }

    return (
        <View style={style.messageContainerWithReplyBar}>
            <View style={replyBarStyle()}/>
            {body}
            {post.failed &&
            <Failed
                post={post}
                theme={theme}
            />
            }
        </View>
    );
};

export default Body;
