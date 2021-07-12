// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AsyncStorage from '@react-native-community/async-storage';

import {DeviceTypes} from '@constants';

export async function setupPermanentSidebar() {
    if (DeviceTypes.IS_TABLET) {
        const value = await AsyncStorage.getItem(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS);

        if (!value) {
            AsyncStorage.setItem(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, 'true');
        }
    }
}
