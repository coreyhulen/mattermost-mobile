// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AsyncStorage from '@react-native-community/async-storage';

import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Dimensions, Platform, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {DeviceTypes, ViewTypes} from '@constants';
import mattermostManaged from '@mattermost-managed';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {makeStyleSheetFromTheme} from '@utils/theme';

import ChannelSearchButton from './channel_search_button';
import ChannelTitle from './channel_title';
import MainSidebarDrawerButton from './main_sidebar_drawer_button';
import SettingsSidebarDrawerButton from './settings_sidebar_drawer_button';

const {
    ANDROID_TOP_LANDSCAPE,
    ANDROID_TOP_PORTRAIT,
    CHANNEL_NAV_BAR_CHANGED,
    IOS_TOP_LANDSCAPE,
    IOS_TOP_PORTRAIT,
    STATUS_BAR_HEIGHT,
} = ViewTypes;

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

const ChannelNavBar = (props) => {
    const {isLandscape, onPress, openMainSidebar, openSettingsSidebar, theme} = props;
    const insets = useSafeAreaInsets();
    const style = getStyleFromTheme(theme);
    const [splitView, setSplitView] = useState(false);
    const [permanentSidebar, setPermanentSidebar] = useState(false);
    let height = 0;
    let canHaveSubtitle = true;

    const drawerButtonVisible = () => {
        if (Platform.OS === 'android') {
            return true;
        }

        return (!DeviceTypes.IS_TABLET || splitView || !permanentSidebar);
    };

    const handleDimensions = () => {
        if (DeviceTypes.IS_TABLET) {
            mattermostManaged.isRunningInSplitView().then((result) => {
                const isSplitView = Boolean(result.isSplitView);
                setSplitView(isSplitView);
            });
        }
    };

    const handlePermanentSidebar = async () => {
        if (DeviceTypes.IS_TABLET) {
            try {
                const enabled = await AsyncStorage.getItem(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS);
                setPermanentSidebar(enabled === 'true');
            } catch {
                // do nothing
            }
        }
    };

    const onLayout = ({nativeEvent}) => {
        const {height: layouHeight} = nativeEvent.layout;
        if (height !== layouHeight && Platform.OS === 'ios') {
            height = layouHeight;
        }

        EventEmitter.emit(CHANNEL_NAV_BAR_CHANGED, layouHeight);
    };

    useEffect(() => {
        handleDimensions();
        handlePermanentSidebar();
        Dimensions.addEventListener('change', handleDimensions);
        EventEmitter.on(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, handlePermanentSidebar);

        return () => {
            Dimensions.removeEventListener('change', handleDimensions);
            EventEmitter.off(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, handlePermanentSidebar);
        };
    }, []);

    switch (Platform.OS) {
    case 'android':
        height = ANDROID_TOP_PORTRAIT;
        if (DeviceTypes.IS_TABLET) {
            height = ANDROID_TOP_LANDSCAPE;
        }
        break;
    case 'ios':
        height = IOS_TOP_PORTRAIT - STATUS_BAR_HEIGHT;
        if (DeviceTypes.IS_TABLET && isLandscape) {
            height -= 1;
        } else if (isLandscape) {
            height = IOS_TOP_LANDSCAPE;
            canHaveSubtitle = false;
        }

        if (DeviceTypes.IS_IPHONE_WITH_INSETS && isLandscape) {
            canHaveSubtitle = false;
        }
        break;
    }

    return (
        <View
            onLayout={onLayout}
            style={[style.header, {height: height + insets.top, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right}]}
        >
            <MainSidebarDrawerButton
                openSidebar={openMainSidebar}
                visible={drawerButtonVisible()}
            />
            <ChannelTitle
                onPress={onPress}
                canHaveSubtitle={canHaveSubtitle}
            />
            <ChannelSearchButton
                theme={theme}
            />
            <SettingsSidebarDrawerButton openSidebar={openSettingsSidebar}/>
        </View>
    );
};

ChannelNavBar.propTypes = {
    isLandscape: PropTypes.bool.isRequired,
    openMainSidebar: PropTypes.func.isRequired,
    openSettingsSidebar: PropTypes.func.isRequired,
    onPress: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default ChannelNavBar;
