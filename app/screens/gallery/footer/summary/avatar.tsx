// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleSheet, View} from 'react-native';
import FastImage from 'react-native-fast-image';

import CompassIcon from '@components/compass_icon';
import {changeOpacity} from '@mm-redux/utils/theme_utils';

import type {AvatarProps} from '@mm-types/screens/gallery';

const styles = StyleSheet.create({
    avatarContainer: {
        borderWidth: 1,
        borderColor: 'rgba(61, 60, 64, 0.08)',
    },
    avatar: {
        height: 32,
        width: 32,
    },
    avatarRadius: {
        borderRadius: 16,
    },
});

const Avatar = ({avatarUri, theme}: AvatarProps) => {
    let element;
    if (avatarUri) {
        element = (
            <FastImage
                source={{uri: avatarUri}}
                style={[styles.avatar, styles.avatarRadius]}
            />
        );
    } else {
        element = (
            <CompassIcon
                name='account-outline'
                size={32}
                color={changeOpacity(theme.centerChannelColor, 0.48)}
            />
        );
    }

    return (
        <View style={[styles.avatarContainer, styles.avatarRadius]}>
            {element}
        </View>
    );
};

export default Avatar;
