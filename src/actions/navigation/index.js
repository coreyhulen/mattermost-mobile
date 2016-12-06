// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {NavigationTypes} from 'constants';
import Routes from 'navigation/routes';

export function goBack() {
    return async (dispatch, getState) => {
        dispatch({
            type: NavigationTypes.NAVIGATION_POP
        }, getState);
    };
}

export function goToLogin() {
    return async (dispatch, getState) => {
        dispatch({
            type: NavigationTypes.NAVIGATION_PUSH,
            route: Routes.Login
        }, getState);
    };
}

export function goToSelectTeam() {
    return async (dispatch, getState) => {
        dispatch({
            type: NavigationTypes.NAVIGATION_PUSH,
            route: Routes.SelectTeam
        }, getState);
    };
}

export function goToChannel() {
    return async (dispatch, getState) => {
        dispatch({
            type: NavigationTypes.NAVIGATION_PUSH,
            route: Routes.Channel
        }, getState);
    };
}

export function goToRecentMentions() {
    return async (dispatch, getState) => {
        dispatch({
            type: NavigationTypes.NAVIGATION_PUSH,
            route: {
                ...Routes.Search,
                props: {
                    searchType: 'recent_mentions'
                }
            }
        }, getState);
    };
}

export function goToFlaggedPosts() {
    return async (dispatch, getState) => {
        dispatch({
            type: NavigationTypes.NAVIGATION_PUSH,
            route: {
                ...Routes.Search,
                props: {
                    searchType: 'flagged_posts'
                }
            }
        }, getState);
    };
}
