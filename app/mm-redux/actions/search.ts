// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Client4} from '@client/rest';
import {analytics} from '@init/analytics';
import {SearchTypes} from '@mm-redux/action_types';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId, getCurrentUserMentionKeys} from '@mm-redux/selectors/entities/users';
import {ActionResult, batchActions, DispatchFunc, GetStateFunc, ActionFunc} from '@mm-redux/types/actions';
import {Post} from '@mm-redux/types/posts';
import {SearchParameter} from '@mm-redux/types/search';
import {RelationOneToOne} from '@mm-redux/types/utilities';

import {getChannelAndMyMember, getChannelMembers} from './channels';
import {logError} from './errors';
import {forceLogoutIfNecessary} from './helpers';
import {getProfilesAndStatusesForPosts, receivedPosts} from './posts';

const WEBAPP_SEARCH_PER_PAGE = 20;
export function getMissingChannelsFromPosts(posts: RelationOneToOne<Post, Post>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {
            channels,
            membersInChannel,
            myMembers,
        } = getState().entities.channels;
        const promises: Promise<ActionResult>[] = [];
        Object.values(posts).forEach((post) => {
            const id = post.channel_id;

            if (!channels[id] || !myMembers[id]) {
                promises.push(dispatch(getChannelAndMyMember(id)));
            }

            if (!membersInChannel[id]) {
                promises.push(dispatch(getChannelMembers(id)));
            }
        });
        return Promise.all(promises);
    };
}

export function searchPostsWithParams(teamId: string, params: SearchParameter): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const isGettingMore = params.page > 0;
        dispatch({
            type: SearchTypes.SEARCH_POSTS_REQUEST,
            isGettingMore,
        });
        let posts;

        try {
            posts = await Client4.searchPostsWithParams(teamId, params);

            const profilesAndStatuses = getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
            const missingChannels = dispatch(getMissingChannelsFromPosts(posts.posts));
            const arr: [Promise<any>, Promise<any>] = [profilesAndStatuses, missingChannels];
            await Promise.all(arr);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_POSTS,
                data: posts,
                isGettingMore,
            },
            receivedPosts(posts),
            {
                type: SearchTypes.RECEIVED_SEARCH_TERM,
                data: {
                    teamId,
                    params,
                    isEnd: (posts.order.length < params.per_page),
                },
            },
            {
                type: SearchTypes.SEARCH_POSTS_SUCCESS,
            },
        ], 'SEARCH_POST_BATCH'));

        return {data: posts};
    };
}

export function searchPosts(teamId: string, terms: string, isOrSearch: boolean, includeDeletedChannels: boolean) {
    return searchPostsWithParams(teamId, {terms, is_or_search: isOrSearch, include_deleted_channels: includeDeletedChannels, page: 0, per_page: WEBAPP_SEARCH_PER_PAGE});
}

export function getMorePostsForSearch(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const teamId = getCurrentTeamId(getState());
        const {params, isEnd} = getState().entities.search.current[teamId];
        if (!isEnd) {
            const newParams = Object.assign({}, params);
            newParams.page += 1;
            return dispatch(searchPostsWithParams(teamId, newParams));
        }
        return {data: true};
    };
}

export function clearSearch(): ActionFunc {
    return async (dispatch) => {
        dispatch({type: SearchTypes.REMOVE_SEARCH_POSTS});

        return {data: true};
    };
}

export function getFlaggedPosts(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const userId = getCurrentUserId(state);
        const teamId = getCurrentTeamId(state);

        dispatch({type: SearchTypes.SEARCH_FLAGGED_POSTS_REQUEST});

        let posts;
        try {
            posts = await Client4.getFlaggedPosts(userId, '', teamId);

            await Promise.all([getProfilesAndStatusesForPosts(posts.posts, dispatch, getState) as any, dispatch(getMissingChannelsFromPosts(posts.posts)) as any]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: SearchTypes.SEARCH_FLAGGED_POSTS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_FLAGGED_POSTS,
                data: posts,
            },
            receivedPosts(posts),
            {
                type: SearchTypes.SEARCH_FLAGGED_POSTS_SUCCESS,
            },
        ], 'SEARCH_FLAGGED_POSTS_BATCH'));

        return {data: posts};
    };
}

export function getPinnedPosts(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: SearchTypes.SEARCH_PINNED_POSTS_REQUEST});

        let result;
        try {
            result = await Client4.getPinnedPosts(channelId);

            const profilesAndStatuses = getProfilesAndStatusesForPosts(result.posts, dispatch, getState);
            const missingChannels = dispatch(getMissingChannelsFromPosts(result.posts));
            const arr: [Promise<any>, Promise<any>] = [profilesAndStatuses, missingChannels];
            await Promise.all(arr);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: SearchTypes.SEARCH_PINNED_POSTS_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_PINNED_POSTS,
                data: {
                    pinned: result,
                    channelId,
                },
            },
            receivedPosts(result),
            {
                type: SearchTypes.SEARCH_PINNED_POSTS_SUCCESS,
            },
        ], 'SEARCH_PINNED_POSTS_BATCH'));

        return {data: result};
    };
}

export function clearPinnedPosts(channelId: string): ActionFunc {
    return async (dispatch) => {
        dispatch({
            type: SearchTypes.REMOVE_SEARCH_PINNED_POSTS,
            data: {
                channelId,
            },
        });

        return {data: true};
    };
}

export function getRecentMentions(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const teamId = getCurrentTeamId(state);

        let posts;
        try {
            const termKeys = getCurrentUserMentionKeys(state).filter(({key}) => {
                return key !== '@channel' && key !== '@all' && key !== '@here';
            });

            const terms = termKeys.map(({key}) => key).join(' ').trim() + ' ';

            analytics.trackAPI('api_posts_search_mention');
            posts = await Client4.searchPosts(teamId, terms, true);

            const profilesAndStatuses = getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
            const missingChannels = dispatch(getMissingChannelsFromPosts(posts.posts));
            const arr: [Promise<any>, Promise<any>] = [profilesAndStatuses, missingChannels];
            await Promise.all(arr);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_POSTS,
                data: posts,
            },
            receivedPosts(posts),
        ], 'SEARCH_RECENT_MENTIONS_BATCH'));

        return {data: posts};
    };
}

export function removeSearchTerms(teamId: string, terms: string): ActionFunc {
    return async (dispatch) => {
        dispatch({
            type: SearchTypes.REMOVE_SEARCH_TERM,
            data: {
                teamId,
                terms,
            },
        });

        return {data: true};
    };
}

export default {
    clearSearch,
    removeSearchTerms,
    searchPosts,
};
