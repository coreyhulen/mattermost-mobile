// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DeviceTypes} from '@constants';

export default function isTablet(state = false, action) {
    switch (action.type) {
    case DeviceTypes.DEVICE_TYPE_CHANGED:
        return action.data;
    }

    return state;
}

