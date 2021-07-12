// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFetchBlobFS from 'rn-fetch-blob/fs';

import keyMirror from '@mm-redux/utils/key_mirror';

const deviceTypes = keyMirror({
    CONNECTION_CHANGED: null,
    DEVICE_DIMENSIONS_CHANGED: null,
    DEVICE_TYPE_CHANGED: null,
    DEVICE_ORIENTATION_CHANGED: null,
});

const isPhoneWithInsets = Platform.OS === 'ios' && DeviceInfo.hasNotch();
const isTablet = DeviceInfo.isTablet();
const isIPhone12Mini = DeviceInfo.getModel() === 'iPhone 12 mini';

export default {
    ...deviceTypes,
    DOCUMENTS_PATH: `${RNFetchBlobFS.dirs.CacheDir}/Documents`,
    IMAGES_PATH: `${RNFetchBlobFS.dirs.CacheDir}/Images`,
    IS_IPHONE_WITH_INSETS: isPhoneWithInsets,
    IS_TABLET: isTablet,
    VIDEOS_PATH: `${RNFetchBlobFS.dirs.CacheDir}/Videos`,
    PERMANENT_SIDEBAR_SETTINGS: '@PERMANENT_SIDEBAR_SETTINGS',
    TABLET_WIDTH: 250,
    AUTOCOMPLETE_MAX_HEIGHT: (isPhoneWithInsets && !isIPhone12Mini) || isTablet ? 200 : 145,
    POST_INPUT_MAX_HEIGHT: (isPhoneWithInsets && !isIPhone12Mini) || isTablet ? 150 : 88,
};
