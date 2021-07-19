// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {PostTypes, TeamTypes, ThreadTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {Post} from '@mm-redux/types/posts';
import {Team} from '@mm-redux/types/teams';
import {ThreadsState, UserThread} from '@mm-redux/types/threads';
import {UserProfile} from '@mm-redux/types/users';
import {IDMappedObjects} from '@mm-redux/types/utilities';

export const threadsReducer = (state: ThreadsState['threads'] = {}, action: GenericAction) => {
    switch (action.type) {
    case ThreadTypes.RECEIVED_THREADS: {
        const {threads} = action.data;
        const newThreads = threads.reduce((results: IDMappedObjects<UserThread>, thread: UserThread) => {
            results[thread.id] = thread;
            return results;
        }, {});
        return {
            ...state,
            ...newThreads,
        };
    }
    case ThreadTypes.RECEIVED_THREAD: {
        const {thread} = action.data;
        return {
            ...state,
            [thread.id]: thread,
        };
    }
    case ThreadTypes.READ_CHANGED_THREAD: {
        const {
            id,
            newUnreadMentions,
            newUnreadReplies,
            lastViewedAt,
        } = action.data;

        return {
            ...state,
            [id]: {
                ...(state[id] || {}),
                last_viewed_at: lastViewedAt,
                unread_mentions: newUnreadMentions,
                unread_replies: newUnreadReplies,
                is_following: true,
            },
        };
    }
    case ThreadTypes.FOLLOW_CHANGED_THREAD: {
        const {id, following} = action.data;
        return {
            ...state,
            [id]: {...(state[id] || {}), is_following: following},
        };
    }
    case ThreadTypes.ALL_TEAM_THREADS_READ: {
        return Object.entries(state).reduce<ThreadsState['threads']>((newState, [id, thread]) => {
            newState[id] = {
                ...thread,
                unread_mentions: 0,
                unread_replies: 0,
            };
            return newState;
        }, {});
    }
    case PostTypes.POST_REMOVED: {
        const post = action.data;

        if (post.root_id || !state[post.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, post.id);

        return nextState;
    }
    case PostTypes.RECEIVED_NEW_POST: {
        const post: Post = action.data;
        const thread: UserThread | undefined = state[post.root_id];
        if (thread) {
            const participants = thread.participants || [];
            const nextThread = {...thread};
            if (!participants.find((user: UserProfile | {id: string}) => user.id === post.user_id)) {
                nextThread.participants = [...participants, {id: post.user_id}];
            }

            if (post.reply_count) {
                nextThread.reply_count = post.reply_count;
            }

            return {
                ...state,
                [post.root_id]: nextThread,
            };
        }
        return state;
    }
    }
    return state;
};

export const threadsInTeamReducer = (state: ThreadsState['threadsInTeam'] = {}, action: GenericAction) => {
    switch (action.type) {
    case ThreadTypes.RECEIVED_THREADS: {
        const nextSet = new Set(state[action.data.team_id]);

        action.data.threads.forEach((thread: UserThread) => {
            nextSet.add(thread.id);
        });

        return {
            ...state,
            [action.data.team_id]: Array.from(nextSet),
        };
    }
    case ThreadTypes.RECEIVED_THREAD: {
        if (state[action.data.team_id]?.includes(action.data.thread.id)) {
            return state;
        }

        const nextSet = new Set(state[action.data.team_id]);

        nextSet.add(action.data.thread.id);

        return {
            ...state,
            [action.data.team_id]: Array.from(nextSet),
        };
    }
    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        if (!state[team.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, team.id);

        return nextState;
    }

    case PostTypes.POST_REMOVED: {
        const post = action.data;
        if (post.root_id) {
            return state;
        }

        let postIndex = 0;
        const teamId = Object.keys(state).find((id) => {
            const currentPostIndex = state[id].indexOf(post.id);
            if (currentPostIndex > -1) {
                postIndex = currentPostIndex;
                return true;
            }
            return false;
        });

        if (!teamId) {
            return state;
        }

        return {
            ...state,
            [teamId]: [
                ...state[teamId].slice(0, postIndex),
                ...state[teamId].slice(postIndex + 1),
            ],
        };
    }
    }
    return state;
};

export const countsReducer = (state: ThreadsState['counts'] = {}, action: GenericAction) => {
    switch (action.type) {
    case ThreadTypes.ALL_TEAM_THREADS_READ: {
        const counts = state[action.data.team_id] ?? {};
        return {
            ...state,
            [action.data.team_id]: {
                ...counts,
                total_unread_mentions: 0,
                total_unread_threads: 0,
            },
        };
    }
    case ThreadTypes.READ_CHANGED_THREAD: {
        const {
            teamId,
            prevUnreadMentions = 0,
            newUnreadMentions = 0,
            prevUnreadReplies = 0,
            newUnreadReplies = 0,
        } = action.data;
        const counts = state[teamId] ? {
            ...state[teamId],
        } : {
            total_unread_threads: 0,
            total: 0,
            total_unread_mentions: 0,
        };
        const unreadMentionDiff = newUnreadMentions - prevUnreadMentions;

        counts.total_unread_mentions += unreadMentionDiff;

        if (newUnreadReplies > 0 && prevUnreadReplies === 0) {
            counts.total_unread_threads += 1;
        } else if (prevUnreadReplies > 0 && newUnreadReplies === 0) {
            counts.total_unread_threads -= 1;
        }

        return {
            ...state,
            [action.data.teamId]: counts,
        };
    }
    case ThreadTypes.RECEIVED_THREADS: {
        return {
            ...state,
            [action.data.team_id]: {
                total: action.data.total,
                total_unread_threads: action.data.total_unread_threads,
                total_unread_mentions: action.data.total_unread_mentions,
            },
        };
    }
    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        if (!state[team.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, team.id);

        return nextState;
    }
    }
    return state;
};

export default combineReducers({
    threads: threadsReducer,
    threadsInTeam: threadsInTeamReducer,
    counts: countsReducer,
});
