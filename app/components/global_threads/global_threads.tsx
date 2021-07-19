// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {Alert, FlatList} from 'react-native';

import type {ActionResult} from '@mm-redux/types/actions';
import type {Theme} from '@mm-redux/types/preferences';
import type {Team} from '@mm-redux/types/teams';
import type {UserProfile} from '@mm-redux/types/users';
import type {$ID} from '@mm-redux/types/utilities';
import type {ThreadsState, UserThread} from '@mm-redux/types/threads';

import ThreadList from './thread_list';

type Props = {
    actions: {
        getThreads: (userId: $ID<UserProfile>, teamId: $ID<Team>, before?: $ID<UserThread>, after?: $ID<UserThread>, perPage?: number, deleted?: boolean, unread?: boolean) => Promise<ActionResult>;
        handleViewingGlobalThreadsAll: () => void;
        handleViewingGlobalThreadsUnreads: () => void;
        markAllThreadsInTeamRead: (userId: $ID<UserProfile>, teamId: $ID<Team>) => void;
    },
    allThreadIds: $ID<UserThread>[];
    intl: typeof intlShape;
    teamId: $ID<Team>;
    theme: Theme;
    threadCount: ThreadsState['counts'][$ID<Team>];
    unreadThreadIds: $ID<UserThread>[];
    userId: $ID<UserProfile>;
    viewingUnreads: boolean;
}

function GlobalThreadsList({actions, allThreadIds, intl, teamId, theme, threadCount, unreadThreadIds, userId, viewingUnreads}: Props) {
    const ids = viewingUnreads ? unreadThreadIds : allThreadIds;
    const haveUnreads = threadCount?.total_unread_threads > 0;

    const listRef = React.useRef<FlatList>(null);

    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    const scrollToTop = () => {
        listRef.current?.scrollToOffset({offset: 0});
    };

    const loadThreads = async (before = '', after = '', unread = false) => {
        if (!isLoading) {
            setIsLoading(true);
        }
        await actions.getThreads(userId, teamId, before, after, undefined, false, unread);
        setIsLoading(false);
    };

    React.useEffect(() => {
        // Loads on mount, Loads on team change
        scrollToTop();
        loadThreads('', ids[0]);
    }, [teamId]);

    // Prevent from being called when an active request is pending.
    const loadMoreThreads = async () => {
        if (
            !isLoading &&
            ids.length &&
            threadCount.total
        ) {
            // Check if we have more threads to load.
            if (viewingUnreads) {
                if (threadCount.total_unread_threads === unreadThreadIds.length) {
                    return;
                }
            } else if (threadCount.total === allThreadIds.length) {
                return;
            }

            // Get the last thread, send request for threads after this thread.
            const lastThreadId = ids[ids.length - 1];
            await loadThreads(lastThreadId, '', viewingUnreads);
        }
    };

    const handleViewAllThreads = () => {
        scrollToTop();
        loadThreads('', allThreadIds[0], false);
        actions.handleViewingGlobalThreadsAll();
    };

    const handleViewUnreadThreads = () => {
        scrollToTop();
        loadThreads('', unreadThreadIds[0], true);
        actions.handleViewingGlobalThreadsUnreads();
    };

    const markAllAsRead = () => {
        Alert.alert(
            intl.formatMessage({
                id: 'global_threads.markAllRead.title',
                defaultMessage: 'Are you sure you want to mark all threads as read?',
            }),
            intl.formatMessage({
                id: 'global_threads.markAllRead.message',
                defaultMessage: 'This will clear any unread status for all of your threads shown here',
            }),
            [{
                text: intl.formatMessage({
                    id: 'global_threads.markAllRead.cancel',
                    defaultMessage: 'Cancel',
                }),
                style: 'cancel',
            }, {
                text: intl.formatMessage({
                    id: 'global_threads.markAllRead.markRead',
                    defaultMessage: 'Mark read',
                }),
                style: 'default',
                onPress: () => {
                    actions.markAllThreadsInTeamRead(userId, teamId);
                },
            }],
        );
    };

    return (
        <ThreadList
            haveUnreads={haveUnreads}
            isLoading={isLoading}
            listRef={listRef}
            loadMoreThreads={loadMoreThreads}
            markAllAsRead={markAllAsRead}
            testID={'global_threads'}
            theme={theme}
            threadIds={ids}
            viewingUnreads={viewingUnreads}
            viewAllThreads={handleViewAllThreads}
            viewUnreadThreads={handleViewUnreadThreads}
        />
    );
}

export default injectIntl(GlobalThreadsList);
