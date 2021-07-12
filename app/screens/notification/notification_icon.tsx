// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useSelector} from 'react-redux';

import {Client4} from '@client/rest';
import CompassIcon from '@components/compass_icon';
import ProfilePicture from '@components/profile_picture';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getUser} from '@mm-redux/selectors/entities/users';

import type {GlobalState} from '@mm-redux/types/store';

interface NotificationIconProps {
    fromWebhook: boolean;
    senderId: string;
    useUserIcon: boolean;
    overrideIconUrl?: string;
}

const IMAGE_SIZE = 32;
const logo = require('@assets/images/icon.png');

const NotificationIcon = ({fromWebhook, overrideIconUrl, senderId, useUserIcon}: NotificationIconProps) => {
    const config = useSelector(getConfig);
    const user = useSelector((state: GlobalState) => getUser(state, senderId));

    let icon;
    if (fromWebhook && useUserIcon && config.EnablePostIconOverride === 'true') {
        if (overrideIconUrl) {
            const source = {uri: Client4.getAbsoluteUrl(overrideIconUrl)};
            icon = (
                <FastImage
                    source={source}
                    style={styles.icon}
                />
            );
        } else {
            icon = (
                <CompassIcon
                    name='webhook'
                    style={styles.icon}
                />
            );
        }
    } else if (user) {
        icon = (
            <ProfilePicture
                userId={user.id}
                size={IMAGE_SIZE}
                iconSize={24}
                testID='in_app_notification.profile_picture'
            />
        );
    } else {
        icon = (
            <FastImage
                source={logo}
                style={styles.icon}
            />
        );
    }

    return (
        <View
            style={styles.iconContainer}
            testID='in_app_notification.icon'
        >
            {icon}
        </View>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        ...Platform.select({
            android: {
                paddingTop: 17,
            },
            ios: {
                paddingTop: 37,
            },
        }),
    },
    icon: {
        borderRadius: (IMAGE_SIZE / 2),
        height: IMAGE_SIZE,
        width: IMAGE_SIZE,
    },
});

export default NotificationIcon;
