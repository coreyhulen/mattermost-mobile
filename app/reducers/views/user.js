// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {ViewTypes} from '@constants';

function profileImageUri(state = '', action) {
    switch (action.type) {
    case ViewTypes.SET_PROFILE_IMAGE_URI: {
        return action.imageUri;
    }
    default:
        return state;
    }
}

export default combineReducers({
    profileImageUri,
});
