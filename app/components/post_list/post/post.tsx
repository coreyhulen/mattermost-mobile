// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode, useRef} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {Keyboard, StyleProp, View, ViewStyle} from 'react-native';

import {showModalOverCurrentContext} from '@actions/navigation';
import SystemAvatar from '@components/post_list/system_avatar';
import SystemHeader from '@components/post_list/system_header';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import * as Screens from '@constants/screen';
import {Posts} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {fromAutoResponder, isPostEphemeral, isPostPendingOrFailed, isSystemMessage} from '@mm-redux/utils/post_utils';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import Avatar from './avatar';
import Body from './body';
import Header from './header';
import PreHeader from './pre_header';
import SystemMessage from './system_message';

import type {Post as PostType} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';

type PostProps = {
    canDelete: boolean;
    enablePostUsernameOverride: boolean;
    highlight?: boolean;
    highlightPinnedOrFlagged?: boolean;
    intl: typeof intlShape;
    isConsecutivePost?: boolean;
    isFirstReply?: boolean;
    isFlagged?: boolean;
    isLastReply?: boolean;
    location: string;
    post?: PostType;
    removePost: (post: PostType) => void;
    rootPostAuthor?: string;
    shouldRenderReplyButton?: boolean;
    showAddReaction?: boolean;
    showPermalink: (intl: typeof intlShape, teamName: string, postId: string) => null;
    skipFlaggedHeader?: boolean;
    skipPinnedHeader?: boolean;
    teammateNameDisplay: string;
    testID?: string;
    theme: Theme;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        consecutive: {marginTop: 0},
        consecutivePostContainer: {
            marginBottom: 10,
            marginRight: 10,
            marginLeft: 47,
            marginTop: 10,
        },
        container: {flexDirection: 'row'},
        highlight: {backgroundColor: changeOpacity(theme.mentionHighlightBg, 0.5)},
        highlightBar: {
            backgroundColor: theme.mentionHighlightBg,
            opacity: 1,
        },
        highlightPinnedOrFlagged: {backgroundColor: changeOpacity(theme.mentionHighlightBg, 0.2)},
        pendingPost: {opacity: 0.5},
        postStyle: {
            overflow: 'hidden',
            flex: 1,
        },
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
        rightColumn: {
            flex: 1,
            flexDirection: 'column',
            marginRight: 12,
        },
        rightColumnPadding: {paddingBottom: 3},
    };
});

const Post = ({
    canDelete, enablePostUsernameOverride, highlight, highlightPinnedOrFlagged = true, intl, isConsecutivePost, isFirstReply, isFlagged, isLastReply,
    location, post, removePost, rootPostAuthor, shouldRenderReplyButton, skipFlaggedHeader, skipPinnedHeader, showAddReaction = true, showPermalink,
    teammateNameDisplay, testID, theme,
}: PostProps) => {
    const pressDetected = useRef(false);
    const style = getStyleSheet(theme);

    const handlePress = preventDoubleTap(() => {
        pressDetected.current = true;

        if (post) {
            if (location === Screens.THREAD) {
                Keyboard.dismiss();
            } else if (location === Screens.SEARCH) {
                showPermalink(intl, '', post.id);
                return;
            }

            const isValidSystemMessage = fromAutoResponder(post) || !isSystemMessage(post);
            if (post.state !== Posts.POST_DELETED && isValidSystemMessage && !isPostPendingOrFailed(post)) {
                if ([Screens.CHANNEL, Screens.PERMALINK].includes(location)) {
                    EventEmitter.emit('goToThread', post);
                }
            } else if ((isPostEphemeral(post) || post.state === Posts.POST_DELETED)) {
                removePost(post);
            }

            const pressTimeout = setTimeout(() => {
                pressDetected.current = false;
                clearTimeout(pressTimeout);
            }, 300);
        }
    });

    const showPostOptions = () => {
        if (!post) {
            return;
        }

        const hasBeenDeleted = (post.delete_at !== 0 || post.state === Posts.POST_DELETED);
        if (isSystemMessage(post) && (!canDelete || hasBeenDeleted)) {
            return;
        }

        if (isPostPendingOrFailed(post) || isPostEphemeral(post)) {
            return;
        }

        const screen = 'PostOptions';
        const passProps = {
            location,
            post,
            showAddReaction,
        };

        Keyboard.dismiss();
        const postOptionsRequest = requestAnimationFrame(() => {
            showModalOverCurrentContext(screen, passProps);
            cancelAnimationFrame(postOptionsRequest);
        });
    };

    if (!post) {
        return null;
    }

    const highlightFlagged = isFlagged && !skipFlaggedHeader;
    const hightlightPinned = post.is_pinned && !skipPinnedHeader;
    const itemTestID = `${testID}.${post.id}`;
    const rightColumnStyle = [style.rightColumn, (post.root_id && isLastReply && style.rightColumnPadding)];
    const pendingPostStyle: StyleProp<ViewStyle> | undefined = isPostPendingOrFailed(post) ? style.pendingPost : undefined;
    const isAutoResponder = fromAutoResponder(post);

    let highlightedStyle: StyleProp<ViewStyle>;
    if (highlight) {
        highlightedStyle = style.highlight;
    } else if ((highlightFlagged || hightlightPinned) && highlightPinnedOrFlagged) {
        highlightedStyle = style.highlightPinnedOrFlagged;
    }

    let header: ReactNode;
    let postAvatar: ReactNode;
    let consecutiveStyle: StyleProp<ViewStyle>;
    if (isConsecutivePost) {
        consecutiveStyle = style.consective;
        postAvatar = <View style={style.consecutivePostContainer}/>;
    } else {
        postAvatar = isAutoResponder ? (
            <SystemAvatar theme={theme}/>
        ) : (
            <Avatar
                pendingPostStyle={pendingPostStyle}
                post={post}
                theme={theme}
            />
        );

        if (isSystemMessage(post) && !isAutoResponder) {
            header = (
                <SystemHeader
                    createAt={post.create_at}
                    theme={theme}
                />
            );
        } else {
            header = (
                <Header
                    enablePostUsernameOverride={enablePostUsernameOverride}
                    location={location}
                    post={post}
                    rootPostAuthor={rootPostAuthor}
                    shouldRenderReplyButton={shouldRenderReplyButton}
                    teammateNameDisplay={teammateNameDisplay}
                    theme={theme}
                />
            );
        }
    }

    let body;
    if (isSystemMessage(post) && !isPostEphemeral(post) && !isAutoResponder) {
        body = (
            <SystemMessage
                post={post}
                theme={theme}
            />
        );
    } else {
        body = (
            <Body
                highlight={Boolean(highlightedStyle)}
                isFirstReply={isFirstReply}
                isLastReply={isLastReply}
                location={location}
                post={post}
                rootPostAuthor={rootPostAuthor}
                showAddReaction={showAddReaction}
                theme={theme}
            />
        );
    }

    return (
        <View
            testID={testID}
            style={[style.postStyle, highlightedStyle]}
        >
            <TouchableWithFeedback
                testID={itemTestID}
                onPress={handlePress}
                onLongPress={showPostOptions}
                delayLongPress={200}
                underlayColor={changeOpacity(theme.centerChannelColor, 0.1)}
                cancelTouchOnPanning={true}
            >
                <>
                    <PreHeader
                        isConsecutivePost={isConsecutivePost}
                        isFlagged={isFlagged}
                        isPinned={post.is_pinned}
                        skipFlaggedHeader={skipFlaggedHeader}
                        skipPinnedHeader={skipPinnedHeader}
                        theme={theme}
                    />
                    <View style={[style.container, consecutiveStyle]}>
                        {postAvatar}
                        <View style={rightColumnStyle}>
                            {header}
                            {body}
                        </View>
                    </View>
                </>
            </TouchableWithFeedback>
        </View>
    );
};

export default injectIntl(Post);
