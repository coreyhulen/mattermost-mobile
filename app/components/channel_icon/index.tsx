// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleProp, Text, View, ViewStyle} from 'react-native';

import CompassIcon from '@components/compass_icon';
import ProfilePicture from '@components/profile_picture';
import General from '@constants/general';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

type ChannelIconProps = {
    hasDraft?: boolean;
    isActive?: boolean;
    isArchived?: boolean;
    isInfo?: boolean;
    isUnread?: boolean;
    membersCount?: number;
    shared: boolean;
    size: number;
    statusStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    testID?: string;
    theme: Theme;
    type: string;
    userId?: string;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        icon: {
            color: changeOpacity(theme.sidebarText, 0.4),
        },
        iconActive: {
            color: theme.sidebarTextActiveColor,
        },
        iconUnread: {
            color: theme.sidebarUnreadText,
        },
        iconInfo: {
            color: theme.centerChannelColor,
        },
        groupBox: {
            alignItems: 'center',
            backgroundColor: changeOpacity(theme.sidebarText, 0.16),
            borderRadius: 4,
            justifyContent: 'center',
        },
        groupBoxActive: {
            backgroundColor: changeOpacity(theme.sidebarTextActiveColor, 0.3),
        },
        groupBoxUnread: {
            backgroundColor: changeOpacity(theme.sidebarUnreadText, 0.3),
        },
        groupBoxInfo: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.3),
        },
        group: {
            color: theme.sidebarText,
            fontSize: 10,
            fontWeight: '600',
        },
        groupActive: {
            color: theme.sidebarTextActiveColor,
        },
        groupUnread: {
            color: theme.sidebarUnreadText,
        },
        groupInfo: {
            color: theme.centerChannelColor,
        },
    };
});

const ChannelIcon = ({hasDraft = false, isActive = false, isArchived = false, isInfo = false, isUnread = false, membersCount = 0, shared, size = 12, statusStyle, style, testID, theme, type, userId}: ChannelIconProps) => {
    const styles = getStyleSheet(theme);

    let activeIcon;
    let unreadIcon;
    let activeGroupBox;
    let unreadGroupBox;
    let activeGroup;
    let unreadGroup;

    if (isUnread) {
        unreadIcon = styles.iconUnread;
        unreadGroupBox = styles.groupBoxUnread;
        unreadGroup = styles.groupUnread;
    }

    if (isActive) {
        activeIcon = styles.iconActive;
        activeGroupBox = styles.groupBoxActive;
        activeGroup = styles.groupActive;
    }

    if (isInfo) {
        activeIcon = styles.iconInfo;
        activeGroupBox = styles.groupBoxInfo;
        activeGroup = styles.groupInfo;
    }

    let icon;
    if (isArchived) {
        icon = (
            <CompassIcon
                name='archive-outline'
                style={[styles.icon, unreadIcon, activeIcon, {fontSize: size, left: 1}]}
                testID={`${testID}.archive`}
            />
        );
    } else if (hasDraft) {
        icon = (
            <CompassIcon
                name='pencil-outline'
                style={[styles.icon, unreadIcon, activeIcon, {fontSize: size, left: 2}]}
                testID={`${testID}.draft`}
            />
        );
    } else if (shared) {
        const iconName = type === General.PRIVATE_CHANNEL ? 'circle-multiple-outline-lock' : 'circle-multiple-outline';
        const sharedTestID = type === General.PRIVATE_CHANNEL ? 'channel_icon.shared_private' : 'channel_icon.shared_open';
        icon = (
            <CompassIcon
                name={iconName}
                style={[styles.icon, unreadIcon, activeIcon, {fontSize: size, left: 0.5}]}
                testID={sharedTestID}
            />
        );
    } else if (type === General.OPEN_CHANNEL) {
        icon = (
            <CompassIcon
                name='globe'
                style={[styles.icon, unreadIcon, activeIcon, {fontSize: size, left: 1}]}
                testID={`${testID}.public`}
            />
        );
    } else if (type === General.PRIVATE_CHANNEL) {
        icon = (
            <CompassIcon
                name='lock-outline'
                style={[styles.icon, unreadIcon, activeIcon, {fontSize: size, left: 0.5}]}
                testID={`${testID}.private`}
            />
        );
    } else if (type === General.GM_CHANNEL) {
        const fontSize = size - 12;
        const boxSize = size - 4;
        icon = (
            <View
                style={[styles.groupBox, unreadGroupBox, activeGroupBox, {width: boxSize, height: boxSize}]}
            >
                <Text
                    style={[styles.group, unreadGroup, activeGroup, {fontSize}]}
                    testID={`${testID}.gm_member_count`}
                >
                    {membersCount}
                </Text>
            </View>
        );
    } else if (type === General.DM_CHANNEL) {
        icon = (
            <ProfilePicture
                size={size}
                statusSize={12}
                userId={userId}
                testID={testID}
                statusStyle={statusStyle}
            />
        );
    }

    return (
        <View style={[styles.container, {width: size, height: size}, style]}>
            {icon}
        </View>
    );
};

export default ChannelIcon;
