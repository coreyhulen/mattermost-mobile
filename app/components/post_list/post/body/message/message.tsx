// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {LayoutChangeEvent, useWindowDimensions, ScrollView, View} from 'react-native';
import Animated from 'react-native-reanimated';

import Markdown from '@components/markdown';
import {SEARCH} from '@constants/screen';
import {useShowMoreAnimatedStyle} from '@hooks/show_more';
import {isEdited, isPostPendingOrFailed} from '@mm-redux/utils/post_utils';
import {getMarkdownTextStyles, getMarkdownBlockStyles} from '@utils/markdown';
import {makeStyleSheetFromTheme} from '@utils/theme';

import ShowMoreButton from './show_more_button';

import type {UserMentionKey} from '@mm-redux/selectors/entities/users';
import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';

type MessageProps = {
    highlight: boolean;
    isReplyPost: boolean;
    location: string;
    mentionKeys: UserMentionKey[];
    post: Post;
    theme: Theme;
}

const SHOW_MORE_HEIGHT = 54;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        messageContainer: {
            width: '100%',
        },
        reply: {
            paddingRight: 10,
        },
        message: {
            color: theme.centerChannelColor,
            fontSize: 15,
            lineHeight: 20,
        },
        pendingPost: {
            opacity: 0.5,
        },
    };
});

const Message = ({highlight, isReplyPost, location, mentionKeys, post, theme}: MessageProps) => {
    const [open, setOpen] = useState(false);
    const [height, setHeight] = useState<number|undefined>();
    const dimensions = useWindowDimensions();
    const maxHeight = Math.round((dimensions.height * 0.5) + SHOW_MORE_HEIGHT);
    const animatedStyle = useShowMoreAnimatedStyle(height, maxHeight, open);
    const style = getStyleSheet(theme);
    const blockStyles = getMarkdownBlockStyles(theme);
    const textStyles = getMarkdownTextStyles(theme);

    const onLayout = useCallback((event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height), []);
    const onPress = () => setOpen(!open);

    return (
        <>
            <Animated.View style={animatedStyle}>
                <ScrollView
                    keyboardShouldPersistTaps={'always'}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <View
                        style={[style.messageContainer, (isReplyPost && style.reply), (isPostPendingOrFailed(post) && style.pendingPost)]}
                        onLayout={onLayout}
                    >
                        <Markdown
                            baseTextStyle={style.message}
                            blockStyles={blockStyles}
                            channelMentions={post.props?.channel_mentions}
                            imagesMetadata={post.metadata?.images}
                            isEdited={isEdited(post)}
                            isReplyPost={isReplyPost}
                            isSearchResult={location === SEARCH}
                            postId={post.id}
                            textStyles={textStyles}
                            value={post.message}
                            mentionKeys={mentionKeys}
                        />
                    </View>
                </ScrollView>
            </Animated.View>
            {(height || 0) > maxHeight &&
            <ShowMoreButton
                highlight={highlight}
                theme={theme}
                showMore={!open}
                onPress={onPress}
            />
            }
        </>
    );
};

export default Message;
