// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {DeviceEventEmitter, LayoutChangeEvent, Platform, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '@context/theme';
import VIEWS from '@constants/view';
import DEVICE from '@constants/device';
import {General} from '@constants';
import {getUserIdFromChannelName} from '@utils/user';
import {makeStyleSheetFromTheme} from '@utils/theme';

import ChannelTitle from '../channel_title';

import MainSidebarDrawerButton from '../main_sidebar_drawer_button';

import type ChannelModel from '@typings/database/models/servers/channel';

type ChannelNavBar = {
    channel: ChannelModel;
    currentUserId: string;
    onPress: () => void;
    config: ClientConfig;
}

//todo: Read Messages - Include MainSidebarDrawerButton, ChannelSearchButton, SettingsSidebarDrawerButton

const ChannelNavBar = ({currentUserId, channel, onPress, config}: ChannelNavBar) => {
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const style = getStyleFromTheme(theme);
    let height = 0;
    let canHaveSubtitle = true;

    const [isLandscape, setIsLandscape] = useState<boolean>(false);

    useEffect(() => {
        const checkOrientation = async () => {
            const isInLandscape = await DeviceInfo.isLandscape();
            setIsLandscape(isInLandscape);
        };
        checkOrientation();
    }, []);

    const onLayout = ({nativeEvent}: LayoutChangeEvent) => {
        const {height: layoutHeight} = nativeEvent.layout;
        if (height !== layoutHeight && Platform.OS === 'ios') {
            height = layoutHeight;
        }

        DeviceEventEmitter.emit(VIEWS.CHANNEL_NAV_BAR_CHANGED, layoutHeight);
    };

    switch (Platform.OS) {
        case 'android':
            height = VIEWS.ANDROID_TOP_PORTRAIT;
            if (DEVICE.IS_TABLET) {
                height = VIEWS.ANDROID_TOP_LANDSCAPE;
            }
            break;
        case 'ios':
            height = VIEWS.IOS_TOP_PORTRAIT - VIEWS.STATUS_BAR_HEIGHT;
            if (DEVICE.IS_TABLET && isLandscape) {
                height -= 1;
            } else if (isLandscape) {
                height = VIEWS.IOS_TOP_LANDSCAPE;
                canHaveSubtitle = false;
            }

            if (DEVICE.IS_IPHONE_WITH_INSETS && isLandscape) {
                canHaveSubtitle = false;
            }
            break;
    }

    let teammateId: string | undefined;
    if (channel?.type === General.DM_CHANNEL) {
        teammateId = getUserIdFromChannelName(currentUserId, channel.name);
    }

    const populateMockData = () => {
        return '';
    };

    return (
        <View
            onLayout={onLayout}
            style={[style.header, {height: height + insets.top, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right}]}
        >
            <MainSidebarDrawerButton
                openSidebar={populateMockData}
                visible={true}
                badgeCount={0}
            />
            <ChannelTitle
                currentUserId={currentUserId}
                channel={channel}
                onPress={onPress}
                canHaveSubtitle={canHaveSubtitle}
                config={config}
                teammateId={teammateId}
            />
        </View>
    );
};

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        header: {
            backgroundColor: theme.sidebarHeaderBg,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            width: '100%',
            ...Platform.select({
                android: {
                    elevation: 10,
                },
                ios: {
                    zIndex: 10,
                },
            }),
        },
    };
});

export default ChannelNavBar;
