// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {DeviceEventEmitter, FlatList, Platform, RefreshControl, StyleSheet, ViewToken} from 'react-native';

import {DeepLinkTypes, NavigationTypes} from '@constants';
import * as Screens from '@constants/screen';
import {useResetNativeScrollView} from '@hooks';
import {Posts} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {getDateForDateLine, isCombinedUserActivityPost, isDateLine, isStartOfNewMessages} from '@mm-redux/utils/post_list';
import telemetry, {PERF_MARKERS} from '@telemetry';
import {badDeepLink, errorBadChannel} from '@utils/draft';
import {emptyFunction} from '@utils/general';
import {makeExtraData} from '@utils/list_view';
import {matchDeepLink, PERMALINK_GENERIC_TEAM_NAME_REDIRECT} from '@utils/url';

import CombinedUserActivity from './combined_user_activity';
import DateSeparator from './date_separator';
import MoreMessagesButton from './more_messages_button';
import NewMessagesLine from './new_message_line';
import Post from './post';
import {INITIAL_BATCH_TO_RENDER, SCROLL_POSITION_CONFIG, VIEWABILITY_CONFIG} from './post_list_config';

import type {ActionResult} from '@mm-redux/types/actions';
import type {Theme} from '@mm-redux/types/preferences';

type PostListProps = {
    channelId?: string;
    closePermalink: () => Promise<ActionResult>;
    currentTeamName: string;
    deepLinkURL?: string;
    extraData: never;
    getPostThread: (rootId: string) => Promise<ActionResult>;
    handleSelectChannelByName: (channelName: string, teamName: string, errorHandler: (intl: typeof intlShape) => void, intl: typeof intlShape) => Promise<ActionResult>;
    highlightPinnedOrFlagged?: boolean;
    highlightPostId?: string;
    initialIndex: number;
    intl: typeof intlShape;
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
    showPermalink: (intl: typeof intlShape, teamName: string, postId: string, openAsPermalink?: boolean) => Promise<{}>;
    testID?: string;
    theme: Theme;
}

type ViewableItemsChanged = {
    viewableItems: Array<ViewToken>;
    changed: Array<ViewToken>;
}

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
});

const buildExtraData = makeExtraData();

const PostList = ({
    channelId, currentTeamName = '', closePermalink, deepLinkURL, extraData, getPostThread,
    handleSelectChannelByName, highlightPostId, highlightPinnedOrFlagged, initialIndex, intl, loadMorePostsVisible,
    location, onLoadMoreUp = emptyFunction, postIds = [], refreshChannelWithRetry, renderFooter = (() => null), rootId,
    serverURL = '', setDeepLinkURL, showMoreMessagesButton, showPermalink, siteURL = '', scrollViewNativeID, shouldRenderReplyButton, testID, theme,
}: PostListProps) => {
    const prevChannelId = useRef(channelId);
    const hasPostsKey = postIds.length ? 'true' : 'false';
    const flatListRef = useRef<FlatList<never>>(null);
    const onScrollEndIndexListener = useRef<onScrollEndIndexListenerEvent>();
    const onViewableItemsChangedListener = useRef<ViewableItemsChangedListenerEvent>();
    const [refreshing, setRefreshing] = useState(false);

    const registerViewableItemsListener = useCallback((listener) => {
        onViewableItemsChangedListener.current = listener;
        const removeListener = () => {
            onViewableItemsChangedListener.current = undefined;
        };

        return removeListener;
    }, []);

    const registerScrollEndIndexListener = useCallback((listener) => {
        onScrollEndIndexListener.current = listener;
        const removeListener = () => {
            onScrollEndIndexListener.current = undefined;
        };

        return removeListener;
    }, []);

    const keyExtractor = useCallback((item) => {
        // All keys are strings (either post IDs or special keys)
        return item;
    }, []);

    const onPermalinkPress = (postId: string, teamName: string) => {
        showPermalink(intl, teamName, postId);
    };

    const onRefresh = async () => {
        if (location === Screens.CHANNEL && channelId) {
            setRefreshing(true);
            await refreshChannelWithRetry(channelId);
            setRefreshing(false);
        } else if (location === Screens.THREAD && rootId) {
            setRefreshing(true);
            await getPostThread(rootId);
            setRefreshing(false);
        }
    };

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

    const onViewableItemsChanged = useCallback(({viewableItems}: ViewableItemsChanged) => {
        if (!viewableItems.length) {
            return;
        }

        const viewableItemsMap = viewableItems.reduce((acc: Record<string, boolean>, {item, isViewable}) => {
            if (isViewable) {
                acc[item] = true;
            }
            return acc;
        }, {});

        DeviceEventEmitter.emit('scrolled', viewableItemsMap);

        if (onViewableItemsChangedListener.current && !deepLinkURL) {
            onViewableItemsChangedListener.current(viewableItems);
        }
    }, []);

    const renderItem = useCallback(({item, index}) => {
        if (isStartOfNewMessages(item)) {
            // postIds includes a date item after the new message indicator so 2
            // needs to be added to the index for the length check to be correct.
            const moreNewMessages = postIds.length === index + 2;

            // The date line and new message line each count for a line. So the
            // goal of this is to check for the 3rd previous, which for the start
            // of a thread would be null as it doesn't exist.
            const checkForPostId = index < postIds.length - 3;

            return (
                <NewMessagesLine
                    theme={theme}
                    moreMessages={moreNewMessages && checkForPostId}
                    testID={`${testID}.new_messages_line`}
                />
            );
        } else if (isDateLine(item)) {
            return (
                <DateSeparator
                    date={getDateForDateLine(item)}
                    theme={theme}
                />
            );
        }

        if (isCombinedUserActivityPost(item)) {
            const postProps = {
                postId: item,
                testID: `${testID}.combined_user_activity`,
                theme,
            };

            return (<CombinedUserActivity {...postProps}/>);
        }

        let previousPostId: string|undefined;
        let nextPostId: string|undefined;
        if (index < postIds.length - 1) {
            previousPostId = postIds.slice(index + 1).find((v) => !isStartOfNewMessages(v) && !isDateLine(v));
        }

        if (index > 0) {
            const next = postIds.slice(0, index);
            for (let i = next.length - 1; i >= 0; i--) {
                const v = next[i];
                if (!isStartOfNewMessages(v) && !isDateLine(v)) {
                    nextPostId = v;
                    break;
                }
            }
        }

        const postProps = {
            highlightPinnedOrFlagged,
            location,
            nextPostId,
            previousPostId,
            shouldRenderReplyButton,
            theme,
        };

        return (
            <Post
                highlight={highlightPostId === item}
                postId={item}
                testID={`${testID}.post`}
                {...postProps}
            />
        );
    }, [postIds, theme]);

    const scrollToIndex = useCallback((index: number, animated = true) => {
        flatListRef.current?.scrollToIndex({
            animated,
            index,
            viewOffset: 0,
            viewPosition: 1, // 0 is at bottom
        });
    }, []);

    useResetNativeScrollView(scrollViewNativeID, postIds);

    useEffect(() => {
        const scrollToBottom = (screen: string) => {
            if (screen === location) {
                const scrollToBottomTimer = setTimeout(() => {
                    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
                    clearTimeout(scrollToBottomTimer);
                }, 400);
            }
        };

        EventEmitter.on('scroll-to-bottom', scrollToBottom);
        EventEmitter.on(NavigationTypes.NAVIGATION_DISMISS_AND_POP_TO_ROOT, closePermalink);

        return () => {
            EventEmitter.off('scroll-to-bottom', scrollToBottom);
            EventEmitter.off(NavigationTypes.NAVIGATION_DISMISS_AND_POP_TO_ROOT, closePermalink);
        };
    }, []);

    useEffect(() => {
        if (deepLinkURL) {
            const match = matchDeepLink(deepLinkURL, serverURL, siteURL);

            if (match) {
                if (match.type === DeepLinkTypes.CHANNEL) {
                    handleSelectChannelByName(match.channelName!, match.teamName, errorBadChannel, intl);
                } else if (match.type === DeepLinkTypes.PERMALINK) {
                    const teamName = match.teamName === PERMALINK_GENERIC_TEAM_NAME_REDIRECT ? currentTeamName : match.teamName;
                    onPermalinkPress(match.postId!, teamName);
                }
            } else {
                badDeepLink(intl);
            }

            setDeepLinkURL('');
        }
    }, [deepLinkURL]);

    useLayoutEffect(() => {
        if (postIds.length && channelId !== prevChannelId.current) {
            telemetry.end([PERF_MARKERS.CHANNEL_RENDER]);
            prevChannelId.current = channelId;
        }
    }, [channelId, postIds]);

    useLayoutEffect(() => {
        if (initialIndex > 0 && initialIndex <= postIds.length && highlightPostId) {
            scrollToIndex(initialIndex, false);
        }
    }, [initialIndex, highlightPostId]);

    const refreshControl = useMemo(() => (
        <RefreshControl
            refreshing={refreshing}
            colors={[theme.onlineIndicator, theme.awayIndicator, theme.dndIndicator]}
            tintColor={theme.centerChannelColor}
            onRefresh={onRefresh}
        />
    ), [refreshing, theme]);

    return (
        <>
            <FlatList
                contentContainerStyle={styles.postListContent}
                data={postIds}
                extraData={buildExtraData(channelId, highlightPostId, extraData, loadMorePostsVisible)}
                initialNumToRender={INITIAL_BATCH_TO_RENDER}
                inverted={true}
                key={`recyclerFor-${channelId}-${hasPostsKey}`}
                keyboardDismissMode={'interactive'}
                keyboardShouldPersistTaps={'handled'}
                keyExtractor={keyExtractor}
                ListFooterComponent={renderFooter}
                listKey={`recyclerFor-${channelId}`}
                maintainVisibleContentPosition={SCROLL_POSITION_CONFIG}
                maxToRenderPerBatch={Platform.select({android: 5})}
                nativeID={scrollViewNativeID}
                onScrollToIndexFailed={onScrollToIndexFailed}
                ref={flatListRef}
                onEndReached={onLoadMoreUp}
                onEndReachedThreshold={2}
                removeClippedSubviews={true}
                renderItem={renderItem}
                scrollEventThrottle={60}
                style={styles.flex}
                windowSize={Posts.POST_CHUNK_SIZE / 2}
                viewabilityConfig={VIEWABILITY_CONFIG}
                onViewableItemsChanged={onViewableItemsChanged}
                refreshControl={refreshControl}
                testID={testID}
            />
            {showMoreMessagesButton &&
                <MoreMessagesButton
                    channelId={channelId}
                    deepLinkURL={deepLinkURL}
                    newMessageLineIndex={initialIndex}
                    postIds={postIds}
                    registerViewableItemsListener={registerViewableItemsListener}
                    registerScrollEndIndexListener={registerScrollEndIndexListener}
                    scrollToIndex={scrollToIndex}
                    theme={theme}
                    testID={`${testID}.more_messages_button`}
                />
            }
        </>
    );
};

export default injectIntl(PostList);
