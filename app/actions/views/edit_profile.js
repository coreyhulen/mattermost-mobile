// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';
import {updateMe, setDefaultProfileImage} from '@mm-redux/actions/users';

export function updateUser(user, success, error) {
    return async (dispatch, getState) => {
        const result = await updateMe(user)(dispatch, getState);
        const {data, error: err} = result;
        if (data && success) {
            success(data);
        } else if (err && error) {
            error({id: err.server_error_id, ...err});
        }
        return result;
    };
}

export function setProfileImageUri(imageUri = '') {
    return {
        type: ViewTypes.SET_PROFILE_IMAGE_URI,
        imageUri,
    };
}

export function removeProfileImage(user) {
    return async (dispatch) => {
        const result = await dispatch(setDefaultProfileImage(user));
        return result;
    };
}

export default {
    updateUser,
    setProfileImageUri,
    removeProfileImage,
};
