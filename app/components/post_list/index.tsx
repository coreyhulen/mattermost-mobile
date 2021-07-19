// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactElement, useCallback, useRef, useState} from 'react';
import {IntlShape} from 'react-intl';
import {
    DeviceEventEmitter,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    ViewToken,
} from 'react-native';

import POST from '@constants/posts';
import {emptyFunction} from '@utils/general';
import {makeExtraData} from '@utils/list_view';

import {
    INITIAL_BATCH_TO_RENDER,
    SCROLL_POSITION_CONFIG,
    VIEWABILITY_CONFIG,
} from './post_list_config';

export type ActionResult = {
    data?: any;
    error?: any;
};

type PostListProps = {
    channelId?: string;
    closePermalink: () => Promise<ActionResult>;
    currentTeamName: string;
    deepLinkURL?: string;
    extraData: never;
    getPostThread: (rootId: string) => Promise<ActionResult>;
    handleSelectChannelByName: (
        channelName: string,
        teamName: string,
        errorHandler: (intl: IntlShape) => void,
        intl: IntlShape
    ) => Promise<ActionResult>;
    highlightPinnedOrFlagged?: boolean;
    highlightPostId?: string;
    initialIndex: number;
    intl: IntlShape;
    loadMorePostsVisible?: boolean;
    location: string;
    onLoadMoreUp: () => void;
    postIds: string[];
    refreshChannelWithRetry: (channelId: string) => Promise<ActionResult>;
    renderFooter: () => ReactElement | null;
    rootId?: string;
    scrollViewNativeID?: string;
    serverURL: string;
    shouldRenderReplyButton?: boolean;
    showMoreMessagesButton?: boolean;
    siteURL: string;
    setDeepLinkURL: (url?: string) => void;
    showPermalink: (
        intl: IntlShape,
        teamName: string,
        postId: string,
        openAsPermalink?: boolean
    ) => Promise<{}>;
    testID?: string;
    theme: Theme;
};

type ViewableItemsChanged = {
    viewableItems: ViewToken[];
    changed: ViewToken[];
};

type onScrollEndIndexListenerEvent = (endIndex: number) => void;
type ViewableItemsChangedListenerEvent = (viewableItms: ViewToken[]) => void;

type ScrollIndexFailed = {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    postListContent: {
        paddingTop: 5,
    },
    scale: {
        ...Platform.select({
            android: {
                scaleY: -1,
            },
        }),
    },
});

const buildExtraData = makeExtraData();

const PostList = ({
    channelId,
    deepLinkURL,
    extraData,
    highlightPostId,
    highlightPinnedOrFlagged,
    loadMorePostsVisible,
    location,
    onLoadMoreUp = emptyFunction,
    postIds = [],
    renderFooter = () => null,
    scrollViewNativeID,
    shouldRenderReplyButton,
    testID,
    theme,
}: PostListProps) => {
    // const prevChannelId = useRef(channelId);
    const hasPostsKey = postIds.length ? 'true' : 'false';
    const flatListRef = useRef<FlatList<never>>(null);
    const onScrollEndIndexListener = useRef<onScrollEndIndexListenerEvent>();
    const onViewableItemsChangedListener =
        useRef<ViewableItemsChangedListenerEvent>();

    // const [refreshing, setRefreshing] = useState(false);
    const [offsetY, setOffsetY] = useState(0);

    const onScrollToIndexFailed = useCallback((info: ScrollIndexFailed) => {
        const animationFrameIndexFailed = requestAnimationFrame(() => {
            const index = Math.min(info.highestMeasuredFrameIndex, info.index);
            if (onScrollEndIndexListener.current) {
                onScrollEndIndexListener.current(index);
            }
            scrollToIndex(index);
            cancelAnimationFrame(animationFrameIndexFailed);
        });
    }, []);

    const onViewableItemsChanged = useCallback(
        ({viewableItems}: ViewableItemsChanged) => {
            if (!viewableItems.length) {
                return;
            }

            const viewableItemsMap = viewableItems.reduce(
                (acc: Record<string, boolean>, {item, isViewable}) => {
                    if (isViewable) {
                        acc[item] = true;
                    }
                    return acc;
                },
                {},
            );

            DeviceEventEmitter.emit('scrolled', viewableItemsMap);

            if (onViewableItemsChangedListener.current && !deepLinkURL) {
                onViewableItemsChangedListener.current(viewableItems);
            }
        },
        [],
    );

    const keyExtractor = useCallback((item) => {
        // All keys are strings (either post IDs or special keys)
        return item;
    }, []);

    const renderItem = useCallback(
        ({item, index}) => {
            // if (isStartOfNewMessages(item)) {
            //     // postIds includes a date item after the new message indicator so 2
            //     // needs to be added to the index for the length check to be correct.
            //     const moreNewMessages = postIds.length === index + 2;
            //
            //     // The date line and new message line each count for a line. So the
            //     // goal of this is to check for the 3rd previous, which for the start
            //     // of a thread would be null as it doesn't exist.
            //     const checkForPostId = index < postIds.length - 3;
            //
            //     return (
            //         <NewMessagesLine
            //             theme={theme}
            //             moreMessages={moreNewMessages && checkForPostId}
            //             testID={`${testID}.new_messages_line`}
            //             style={styles.scale}
            //         />
            //     );
            // } else if (isDateLine(item)) {
            //     return (
            //         <DateSeparator
            //             date={getDateForDateLine(item)}
            //             theme={theme}
            //             style={styles.scale}
            //         />
            //     );
            // }

            // if (isCombinedUserActivityPost(item)) {
            //     const postProps = {
            //         postId: item,
            //         style: styles.scale,
            //         testID: `${testID}.combined_user_activity`,
            //         theme,
            //     };
            //
            //     return <CombinedUserActivity {...postProps}/>;
            // }

            // let previousPostId: string | undefined;
            // let nextPostId: string | undefined;
            // if (index < postIds.length - 1) {
            //     previousPostId = postIds.
            //         slice(index + 1).
            //         find((v) => !isStartOfNewMessages(v) && !isDateLine(v));
            // }
            //
            // if (index > 0) {
            //     const next = postIds.slice(0, index);
            //     for (let i = next.length - 1; i >= 0; i--) {
            //         const v = next[i];
            //         if (!isStartOfNewMessages(v) && !isDateLine(v)) {
            //             nextPostId = v;
            //             break;
            //         }
            //     }
            // }

            const postProps = {
                highlightPinnedOrFlagged,
                location,

                // nextPostId,
                // previousPostId,
                shouldRenderReplyButton,
                theme,
            };

            return (
                <Post
                    highlight={highlightPostId === item}
                    postId={item}
                    style={styles.scale}
                    testID={`${testID}.post`}
                    {...postProps}
                />
            );
        },
        [postIds, theme],
    );

    const scrollToIndex = useCallback((index: number, animated = true) => {
        flatListRef.current?.scrollToIndex({
            animated,
            index,
            viewOffset: 0,
            viewPosition: 1, // 0 is at bottom
        });
    }, []);

    const onScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (Platform.OS === 'android') {
                const {y} = event.nativeEvent.contentOffset;
                if (y === 0) {
                    setOffsetY(y);
                } else if (offsetY === 0 && y !== 0) {
                    setOffsetY(y);
                }
            }
        },
        [offsetY],
    );

    const list = (
        <FlatList
            contentContainerStyle={styles.postListContent}
            data={postIds}
            extraData={buildExtraData(
                channelId,
                highlightPostId,
                extraData,
                loadMorePostsVisible,
            )}
            initialNumToRender={INITIAL_BATCH_TO_RENDER}
            key={`recyclerFor-${channelId}-${hasPostsKey}`}
            keyboardDismissMode={'interactive'}
            keyboardShouldPersistTaps={'handled'}
            keyExtractor={keyExtractor}
            ListFooterComponent={renderFooter}
            listKey={`recyclerFor-${channelId}`}
            maintainVisibleContentPosition={SCROLL_POSITION_CONFIG}
            maxToRenderPerBatch={Platform.select({android: 5})}
            nativeID={scrollViewNativeID}
            onEndReached={onLoadMoreUp}
            onEndReachedThreshold={2}
            onScroll={onScroll}
            onScrollToIndexFailed={onScrollToIndexFailed}
            onViewableItemsChanged={onViewableItemsChanged}
            ref={flatListRef}
            removeClippedSubviews={true}
            renderItem={renderItem}
            scrollEventThrottle={60}
            style={styles.flex}
            windowSize={POST.POST_CHUNK_SIZE / 2}
            viewabilityConfig={VIEWABILITY_CONFIG}
            testID={testID}
        />
    );

    return (
        <>
            {list}
            {/*<PostListRefreshControl*/}
            {/*    enabled={offsetY === 0}*/}
            {/*    refreshing={refreshing}*/}
            {/*    onRefresh={onRefresh}*/}
            {/*    theme={theme}*/}
            {/*>*/}
            {/*    {list}*/}
            {/*</PostListRefreshControl>*/}
            {/*{showMoreMessagesButton &&*/}
            {/*    <MoreMessagesButton*/}
            {/*        channelId={channelId}*/}
            {/*        deepLinkURL={deepLinkURL}*/}
            {/*        newMessageLineIndex={initialIndex}*/}
            {/*        postIds={postIds}*/}
            {/*        registerViewableItemsListener={registerViewableItemsListener}*/}
            {/*        registerScrollEndIndexListener={registerScrollEndIndexListener}*/}
            {/*        scrollToIndex={scrollToIndex}*/}
            {/*        theme={theme}*/}
            {/*        testID={`${testID}.more_messages_button`}*/}
            {/*    />*/}
            {/*}*/}
        </>
    );
};

export default PostList;
