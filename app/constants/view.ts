// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

import keyMirror from '@utils/key_mirror';

// The iPhone 11 and iPhone 11 Pro Max have a navbar height of 44 and iPhone 11 Pro has 32
const IPHONE_11_LANDSCAPE_HEIGHT = ['iPhone 11', 'iPhone 11 Pro Max'];

export const Upgrade = {
    CAN_UPGRADE: 'can_upgrade',
    MUST_UPGRADE: 'must_upgrade',
    NO_UPGRADE: 'no_upgrade',
    IS_BETA: 'is_beta',
};

export const SidebarSectionTypes = {
    UNREADS: 'unreads',
    FAVORITE: 'favorite',
    PUBLIC: 'public',
    PRIVATE: 'private',
    DIRECT: 'direct',
    RECENT_ACTIVITY: 'recent',
    ALPHA: 'alpha',
};

export const NotificationLevels = {
    DEFAULT: 'default',
    ALL: 'all',
    MENTION: 'mention',
    NONE: 'none',
};

export const NOTIFY_ALL_MEMBERS = 5;
export const INDICATOR_BAR_HEIGHT = 38;

export const CHANNEL_ITEM_LARGE_BADGE_MAX_WIDTH = 38;
export const CHANNEL_ITEM_SMALL_BADGE_MAX_WIDTH = 32;
export const LARGE_BADGE_MAX_WIDTH = 30;
export const SMALL_BADGE_MAX_WIDTH = 26;
export const MAX_BADGE_RIGHT_POSITION = -13;
export const LARGE_BADGE_RIGHT_POSITION = -11;
export const SMALL_BADGE_RIGHT_POSITION = -9;

const ViewTypes = keyMirror({
    DATA_CLEANUP: null,
    SERVER_URL_CHANGED: null,

    POST_DRAFT_CHANGED: null,
    COMMENT_DRAFT_CHANGED: null,
    SEARCH_DRAFT_CHANGED: null,

    POST_DRAFT_SELECTION_CHANGED: null,
    COMMENT_DRAFT_SELECTION_CHANGED: null,

    SET_POST_DRAFT: null,
    SET_COMMENT_DRAFT: null,

    SET_TEMP_UPLOAD_FILES_FOR_POST_DRAFT: null,
    RETRY_UPLOAD_FILE_FOR_POST: null,

    CLEAR_FILES_FOR_POST_DRAFT: null,
    CLEAR_FAILED_FILES_FOR_POST_DRAFT: null,

    REMOVE_FILE_FROM_POST_DRAFT: null,
    REMOVE_LAST_FILE_FROM_POST_DRAFT: null,

    SET_CHANNEL_LOADER: null,
    SET_CHANNEL_REFRESHING: null,
    SET_CHANNEL_RETRY_FAILED: null,
    SET_CHANNEL_DISPLAY_NAME: null,

    REMOVE_LAST_CHANNEL_FOR_TEAM: null,

    SET_INITIAL_POST_VISIBILITY: null,
    RECEIVED_FOCUSED_POST: null,
    LOADING_POSTS: null,
    SET_LOAD_MORE_POSTS_VISIBLE: null,

    RECEIVED_POSTS_FOR_CHANNEL_AT_TIME: null,

    SET_LAST_UPGRADE_CHECK: null,

    ADD_RECENT_EMOJI: null,
    ANNOUNCEMENT_BANNER: null,

    INCREMENT_EMOJI_PICKER_PAGE: null,

    SET_DEEP_LINK_URL: null,

    SET_PROFILE_IMAGE_URI: null,

    SELECTED_ACTION_MENU: null,
    SUBMIT_ATTACHMENT_MENU_ACTION: null,

    PORTRAIT: null,
    LANDSCAPE: null,

    INDICATOR_BAR_VISIBLE: null,
    CHANNEL_NAV_BAR_CHANGED: null,
});

const RequiredServer = {
    FULL_VERSION: 5.25,
    MAJOR_VERSION: 5,
    MIN_VERSION: 25,
    PATCH_VERSION: 0,
};

export default {
    ...ViewTypes,
    RequiredServer,
    POST_VISIBILITY_CHUNK_SIZE: Platform.OS === 'android' ? 15 : 60,
    FEATURE_TOGGLE_PREFIX: 'feature_enabled_',
    EMBED_PREVIEW: 'embed_preview',
    LINK_PREVIEW_DISPLAY: 'link_previews',
    MIN_CHANNELNAME_LENGTH: 2,
    MAX_CHANNELNAME_LENGTH: 64,
    ANDROID_TOP_LANDSCAPE: 46,
    ANDROID_TOP_PORTRAIT: 56,
    IOS_TOP_LANDSCAPE: IPHONE_11_LANDSCAPE_HEIGHT.includes(DeviceInfo.getModel()) ? 44 : 32,
    IOS_TOP_PORTRAIT: 64,
    IOS_INSETS_TOP_PORTRAIT: 88,
    STATUS_BAR_HEIGHT: 20,
    PROFILE_PICTURE_SIZE: 32,
    PROFILE_PICTURE_EMOJI_SIZE: 28,
    DATA_SOURCE_USERS: 'users',
    DATA_SOURCE_CHANNELS: 'channels',
    NotificationLevels,
    SidebarSectionTypes,
    IOS_HORIZONTAL_LANDSCAPE: 44,
};
