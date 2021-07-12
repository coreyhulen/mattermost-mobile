// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ViewTypes} from '@constants';

function selectedMenuAction(state = {}, action) {
    switch (action.type) {
    case ViewTypes.SELECTED_ACTION_MENU:
        return action.data;

    default:
        return state;
    }
}

function submittedMenuActions(state = {}, action) {
    switch (action.type) {
    case ViewTypes.SUBMIT_ATTACHMENT_MENU_ACTION: {
        const nextState = {...state};
        if (nextState[action.postId]) {
            nextState[action.postId] = {
                ...nextState[action.postId],
                ...action.data,
            };
        } else {
            nextState[action.postId] = action.data;
        }

        return nextState;
    }
    default:
        return state;
    }
}

export default combineReducers({

    // Currently selected menu action
    selectedMenuAction,

    // Submitted menu actions per post
    submittedMenuActions,
});
