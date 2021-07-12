// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {StyleSheet} from 'react-native';
import tinyColor from 'tinycolor2';

import {mergeNavigationOptions} from '@actions/navigation';
import * as ThemeUtils from '@mm-redux/utils/theme_utils';

const MODAL_SCREENS_WITHOUT_BACK = [
    'AddReaction',
    'ChannelInfo',
    'CreateChannel',
    'EditPost',
    'ErrorTeamsList',
    'MoreChannels',
    'MoreDirectMessages',
    'Permalink',
    'SelectTeam',
    'Settings',
    'TermsOfService',
    'UserProfile',
];

export function makeStyleSheetFromTheme(getStyleFromTheme) {
    return ThemeUtils.makeStyleFromTheme((theme) => {
        return StyleSheet.create(getStyleFromTheme(theme));
    });
}

export const changeOpacity = ThemeUtils.changeOpacity;

export const blendColors = ThemeUtils.blendColors;

export function concatStyles(...styles) {
    return [].concat(styles);
}

export function setNavigatorStyles(componentId, theme) {
    const options = {
        topBar: {
            title: {
                color: theme.sidebarHeaderTextColor,
            },
            background: {
                color: theme.sidebarHeaderBg,
            },
            leftButtonColor: theme.sidebarHeaderTextColor,
            rightButtonColor: theme.sidebarHeaderTextColor,
        },
        layout: {
            componentBackgroundColor: theme.centerChannelBg,
        },
    };

    if (!MODAL_SCREENS_WITHOUT_BACK.includes(componentId)) {
        options.topBar.backButton = {
            color: theme.sidebarHeaderTextColor,
        };
    }

    mergeNavigationOptions(componentId, options);
}

export function isThemeSwitchingEnabled(state) {
    const {config} = state.entities.general;
    return config.EnableThemeSelection === 'true';
}

export function getKeyboardAppearanceFromTheme(theme) {
    return tinyColor(theme.centerChannelBg).isLight() ? 'light' : 'dark';
}

export function hexToHue(hexColor) {
    let {red, green, blue} = ThemeUtils.getComponents(hexColor);
    red /= 255;
    green /= 255;
    blue /= 255;

    const channelMax = Math.max(red, green, blue);
    const channelMin = Math.min(red, green, blue);
    const delta = channelMax - channelMin;
    let hue = 0;

    if (delta === 0) {
        hue = 0;
    } else if (channelMax === red) {
        hue = ((green - blue) / delta) % 6;
    } else if (channelMax === green) {
        hue = ((blue - red) / delta) + 2;
    } else {
        hue = ((red - green) / delta) + 4;
    }

    hue = Math.round(hue * 60);

    if (hue < 0) {
        hue += 360;
    }

    return hue;
}
