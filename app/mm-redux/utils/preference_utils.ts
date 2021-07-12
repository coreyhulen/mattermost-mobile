// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PreferencesType} from '@mm-redux/types/preferences';

import {Preferences} from '../constants';

export function getPreferenceKey(category: string, name: string): string {
    return `${category}--${name}`;
}

export function getPreferencesByCategory(myPreferences: PreferencesType, category: string): Map<string, any> {
    const prefix = `${category}--`;
    const preferences = new Map();
    Object.keys(myPreferences).forEach((key) => {
        if (key.startsWith(prefix)) {
            preferences.set(key.substring(prefix.length), myPreferences[key]);
        }
    });

    return preferences;
}

export function isChannelFavorite(myPreferences: PreferencesType, channelId: string): boolean {
    const preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, channelId)];

    return Boolean(preference && preference.value !== 'false');
}
