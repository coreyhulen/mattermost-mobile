// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {IntlShape} from 'react-intl';

import {Theme} from '@mm-redux/types/preferences';
import {changeOpacity} from '@mm-redux/utils/theme_utils';
import {preventDoubleTap} from '@utils/tap';
import {makeStyleSheetFromTheme} from '@utils/theme';

type Props = {
    active: boolean;
    intl: typeof IntlShape;
    onPress: () => void;
    theme: Theme
};

function ThreadFollow({active, intl, onPress, theme}: Props) {
    const styles = getStyleSheet(theme);
    const containerStyle = [styles.container];
    if (active) {
        containerStyle.push(styles.containerActive);
    }

    return (
        <TouchableOpacity
            onPress={preventDoubleTap(onPress)}
        >
            <View style={containerStyle}>
                <Text style={styles.text}>
                    {
                        active ? intl.formatMessage({
                            id: 'threads.following',
                            defaultMessage: 'Following',
                        }) : intl.formatMessage({
                            id: 'threads.follow',
                            defaultMessage: 'Follow',
                        })
                    }
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            borderColor: theme.sidebarHeaderTextColor,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: 4,
            paddingVertical: 4.5,
            paddingHorizontal: 10,
            opacity: 0.72,
            marginLeft: 12,
            ...Platform.select({
                android: {
                    marginRight: 12,
                },
                ios: {
                    right: -8,
                },
            }),
        },
        containerActive: {
            backgroundColor: changeOpacity(theme.sidebarHeaderTextColor, 0.24),
            borderColor: 'transparent',
            opacity: 1,
        },
        text: {
            color: theme.sidebarHeaderTextColor,
            fontWeight: '600',
            fontSize: 12,
        },
    };
});

export default ThreadFollow;
