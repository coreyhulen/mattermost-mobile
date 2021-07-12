// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Alert} from 'react-native';

import {Preferences} from '@mm-redux/constants';
import {getUserIdFromChannelName} from '@mm-redux/utils/channel_utils';
import {getLastCreateAt} from '@mm-redux/utils/post_utils';

export function isDirectChannelVisible(userId, myPreferences, channel) {
    const channelId = getUserIdFromChannelName(userId, channel.name);
    const dm = myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${channelId}`];
    return dm && dm.value === 'true';
}

export function isGroupChannelVisible(myPreferences, channel) {
    const gm = myPreferences[`${Preferences.CATEGORY_GROUP_CHANNEL_SHOW}--${channel.id}`];
    return gm && gm.value === 'true';
}

export function isFavoriteChannel(preferences, channelId) {
    const fav = preferences[`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channelId}`];
    return fav ? fav.value === 'true' : false;
}

export function isDirectChannelAutoClosed(config, preferences, channelId, channelActivity, channelArchiveTime = 0, currentChannelId = '') {
    // When the config is not set or is a favorite channel
    if (config.CloseUnusedDirectMessages !== 'true' || isFavoriteChannel(preferences, channelId)) {
        return false;
    }

    const cutoff = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    const viewTimePref = preferences[`${Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME}--${channelId}`];
    const viewTime = viewTimePref ? parseInt(viewTimePref.value || 0, 10) : 0;

    if (viewTime > cutoff) {
        return false;
    }

    const openTimePref = preferences[`${Preferences.CATEGORY_CHANNEL_OPEN_TIME}--${channelId}`];
    const openTime = openTimePref ? parseInt(openTimePref.value || 0, 10) : 0;

    // Only close archived channels when not being viewed
    if (channelId !== currentChannelId && channelArchiveTime && channelArchiveTime > openTime) {
        return true;
    }

    const autoClose = preferences[`${Preferences.CATEGORY_SIDEBAR_SETTINGS}--close_unused_direct_messages`];
    if (!autoClose || autoClose.value === 'after_seven_days') {
        if (channelActivity && channelActivity > cutoff) {
            return false;
        }
        if (openTime > cutoff) {
            return false;
        }

        return !channelActivity || channelActivity < cutoff;
    }

    return false;
}

export function getChannelSinceValue(state, channelId, postIds) {
    const lastGetPosts = state.views.channel.lastGetPosts[channelId];
    const lastConnectAt = state.websocket?.lastConnectAt || 0;

    let since;
    if (lastGetPosts && lastGetPosts < lastConnectAt) {
        // Since the websocket disconnected, we may have missed some posts since then
        since = lastGetPosts;
    } else {
        // Trust that we've received all posts since the last time the websocket disconnected
        // so set `since` to the `create_at` of latest one we've received
        const {posts} = state.entities.posts;
        const channelPosts = postIds.map((id) => posts[id]);
        since = getLastCreateAt(channelPosts);
    }

    return since;
}

export function privateChannelJoinPrompt(channel, intl) {
    return new Promise((resolve) => {
        Alert.alert(
            intl.formatMessage({
                id: 'permalink.show_dialog_warn.title',
                defaultMessage: 'Join private channel',
            }),
            intl.formatMessage({
                id: 'permalink.show_dialog_warn.description',
                defaultMessage: 'You are about to join {channel} without explicitly being added by the channel admin. Are you sure you wish to join this private channel?',
            }, {
                channel: channel.display_name,
            }),
            [
                {
                    text: intl.formatMessage({
                        id: 'permalink.show_dialog_warn.cancel',
                        defaultMessage: 'Cancel',
                    }),
                    onPress: async () => {
                        resolve({
                            join: false,
                        });
                    },
                },
                {
                    text: intl.formatMessage({
                        id: 'permalink.show_dialog_warn.join',
                        defaultMessage: 'Join',
                    }),
                    onPress: async () => {
                        resolve({
                            join: true,
                        });
                    },
                },
            ],
        );
    });
}
