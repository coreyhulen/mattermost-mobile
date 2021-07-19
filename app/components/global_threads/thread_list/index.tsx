// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {FlatList, Platform, View} from 'react-native';
import {injectIntl, intlShape} from 'react-intl';

import EmptyState from '@components/global_threads/empty_state';
import ThreadItem from '@components/global_threads/thread_item';
import Loading from '@components/loading';
import {INITIAL_BATCH_TO_RENDER} from '@components/post_list/post_list_config';
import {ViewTypes} from '@constants';
import type {Theme} from '@mm-redux/types/preferences';
import type {UserThread} from '@mm-redux/types/threads';
import type {$ID} from '@mm-redux/types/utilities';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ThreadListHeader from './thread_list_header';

export type Props = {
    haveUnreads: boolean;
    intl: typeof intlShape;
    isLoading: boolean;
    loadMoreThreads: () => Promise<void>;
    listRef: React.RefObject<FlatList>;
    markAllAsRead: () => void;
    testID: string;
    theme: Theme;
    threadIds: $ID<UserThread>[];
    viewAllThreads: () => void;
    viewUnreadThreads: () => void;
    viewingUnreads: boolean;
};

function ThreadList({haveUnreads, intl, isLoading, loadMoreThreads, listRef, markAllAsRead, testID, theme, threadIds, viewAllThreads, viewUnreadThreads, viewingUnreads}: Props) {
    const style = getStyleSheet(theme);

    const handleEndReached = React.useCallback(() => {
        loadMoreThreads();
    }, [loadMoreThreads, viewingUnreads]);

    const keyExtractor = React.useCallback((item) => item, []);

    const renderPost = React.useCallback(({item}) => {
        return (
            <ThreadItem
                testID={testID}
                theme={theme}
                threadId={item}
            />
        );
    }, []);

    const renderHeader = () => {
        if (!viewingUnreads && !threadIds.length) {
            return null;
        }
        return (
            <ThreadListHeader
                haveUnreads={haveUnreads}
                markAllAsRead={markAllAsRead}
                style={style}
                testId={testID}
                viewAllThreads={viewAllThreads}
                viewUnreadThreads={viewUnreadThreads}
                viewingUnreads={viewingUnreads}
            />
        );
    };

    const renderEmptyList = () => {
        if (isLoading) {
            return (
                <Loading/>
            );
        }
        return (
            <EmptyState
                intl={intl}
                isUnreads={viewingUnreads}
            />
        );
    };

    const renderFooter = () => {
        if (isLoading && threadIds?.length >= ViewTypes.CRT_CHUNK_SIZE) {
            return (
                <View style={style.loadingMoreContainer}>
                    <Loading size='small'/>
                </View>
            );
        }
        return null;
    };

    return (
        <View style={style.container}>
            {renderHeader()}
            <FlatList
                contentContainerStyle={style.messagesContainer}
                data={threadIds}
                keyExtractor={keyExtractor}
                ListEmptyComponent={renderEmptyList()}
                ListFooterComponent={renderFooter()}
                onEndReached={handleEndReached}
                onEndReachedThreshold={2}
                ref={listRef}
                renderItem={renderPost}
                initialNumToRender={INITIAL_BATCH_TO_RENDER}
                maxToRenderPerBatch={Platform.select({android: 5})}
                removeClippedSubviews={true}
                scrollIndicatorInsets={style.listScrollIndicator}
            />
        </View>
    );
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        borderBottom: {
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.08),
            borderBottomWidth: 1,
        },

        container: {
            flex: 1,
        },
        headerContainer: {
            alignItems: 'center',
            flexDirection: 'row',
        },

        menuContainer: {
            alignItems: 'center',
            flexGrow: 1,
            flexDirection: 'row',
            paddingLeft: 12,
            marginVertical: 12,
        },
        menuItemContainer: {
            paddingVertical: 8,
            paddingHorizontal: 16,
        },
        menuItemContainerSelected: {
            backgroundColor: changeOpacity(theme.buttonBg, 0.08),
            borderRadius: 4,
        },
        menuItem: {
            color: changeOpacity(theme.centerChannelColor, 0.56),
            alignSelf: 'center',
            fontFamily: 'Open Sans',
            fontWeight: '600',
            fontSize: 16,
            lineHeight: 24,
        },
        menuItemSelected: {
            color: theme.buttonBg,
        },

        unreadsDot: {
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.sidebarTextActiveBorder,
            right: -6,
            top: 4,
        },

        markAllReadIconContainer: {
            paddingHorizontal: 20,
        },
        markAllReadIcon: {
            fontSize: 28,
            lineHeight: 28,
            color: changeOpacity(theme.centerChannelColor, 0.56),
        },
        markAllReadIconDisabled: {
            opacity: 0.5,
        },
        messagesContainer: {
            flexGrow: 1,
        },
        listScrollIndicator: {
            right: 1,
        },
        loadingMoreContainer: {
            paddingVertical: 12,
        },
    };
});

export {ThreadList}; // Used for shallow render test cases

export default injectIntl(ThreadList);
