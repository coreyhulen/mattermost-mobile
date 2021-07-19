// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';
import {getChannel} from '@mm-redux/selectors/entities/channels';
import {getPost} from '@mm-redux/selectors/entities/posts';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {GlobalState} from '@mm-redux/types/store';
import {Team} from '@mm-redux/types/teams';
import {UserThread, ThreadsState} from '@mm-redux/types/threads';
import {$ID, RelationOneToMany} from '@mm-redux/types/utilities';

export function getThreadsInTeam(state: GlobalState): RelationOneToMany<Team, UserThread> {
    return state.entities.threads.threadsInTeam;
}

export const getThreadsInCurrentTeam: (state: GlobalState) => Array<$ID<UserThread>> = createSelector(
    getCurrentTeamId,
    getThreadsInTeam,
    (currentTeamId: $ID<Team>, threadsInTeam: ThreadsState['threadsInTeam']) => {
        return threadsInTeam?.[currentTeamId] ?? [];
    },
);

export function getThreadCounts(state: GlobalState): ThreadsState['counts'] {
    return state.entities.threads.counts;
}

export function getTeamThreadCounts(state: GlobalState, teamId: $ID<Team>): ThreadsState['counts'][$ID<Team>] {
    return getThreadCounts(state)[teamId];
}

export const getThreadCountsInCurrentTeam: (state: GlobalState) => ThreadsState['counts'][$ID<Team>] = createSelector(
    getCurrentTeamId,
    getThreadCounts,
    (currentTeamId: $ID<Team>, counts: ThreadsState['counts']) => {
        return counts?.[currentTeamId];
    },
);

export function getThreads(state: GlobalState) {
    return state.entities.threads.threads;
}

export function getThread(state: GlobalState, threadId: $ID<UserThread>, fallbackFromPosts?: boolean): UserThread | null {
    const thread = getThreads(state)[threadId];

    // fallbackfromPosts is for In-Channel view, where we need to show the footer from post data as user might not follow all the threads.
    // "thread" will be undefined for unfollowed threads
    // "thread.id" might not be there when user pressed on follow the thread, but thread is not received from server
    if (!thread || !thread?.id) {
        if (fallbackFromPosts) {
            const post = getPost(state, threadId);
            if (post?.participants?.length) {
                const {id, is_following, reply_count, last_reply_at, participants} = post;
                return {
                    id,
                    is_following: thread?.is_following || is_following,
                    reply_count,
                    participants,
                    last_reply_at: last_reply_at || 0,
                    post,
                    last_viewed_at: 0,
                    unread_mentions: 0,
                    unread_replies: 0,
                };
            }
        }
    }
    return thread || null;
}

export const getThreadOrderInCurrentTeam: (state: GlobalState) => Array<$ID<UserThread>> = createSelector(
    getThreadsInCurrentTeam,
    getThreads,
    (threadsInTeam: Array<$ID<UserThread>>, threads: ThreadsState['threads']) => {
        const ids = threadsInTeam.filter((id) => {
            return threads[id]?.is_following;
        });
        return sortByLastReply(ids, threads);
    },
);

export function getThreadTeamId(state: GlobalState, threadId: $ID<UserThread>): $ID<Team> {
    let teamId;
    const thread = getThread(state, threadId, true);
    if (thread && thread.post.channel_id) {
        const channel = getChannel(state, thread.post.channel_id);
        teamId = channel.team_id;
    }
    return teamId || getCurrentTeamId(state);
}

export const getUnreadThreadOrderInCurrentTeam: (state: GlobalState) => Array<$ID<UserThread>> = createSelector(
    getThreadsInCurrentTeam,
    getThreads,
    (threadsInTeam: Array<$ID<UserThread>>, threads: ThreadsState['threads']) => {
        const ids = threadsInTeam.filter((id) => {
            const thread = threads[id];
            return thread?.unread_mentions || thread?.unread_replies;
        });

        return sortByLastReply(ids, threads);
    },
);

function sortByLastReply(ids: Array<$ID<UserThread>>, threads: ReturnType<typeof getThreads>) {
    return ids.sort((a, b) => threads[b].last_reply_at - threads[a].last_reply_at);
}
