// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Dimensions, Platform, View, Text} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {DeviceTypes, ViewTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {makeStyleSheetFromTheme} from '@utils/theme';
import mattermostManaged from 'app/mattermost_managed';

import MainSidebarDrawerButton from './main_sidebar_drawer_button';
import ChannelSearchButton from './channel_search_button';
import ChannelTitle from './channel_title';
import SettingsSidebarDrawerButton from './settings_sidebar_drawer_button';
import FormattedText from '@components/formatted_text';

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
        wrapper: {
            alignItems: 'center',
            flex: 1,
            position: 'relative',
            top: -1,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            width: '90%',
        },
        threadsTitle: {
            color: theme.sidebarHeaderTextColor,
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
        },
    };
});

const ChannelNavBar = (props) => {
    const {isLandscape, onPress, openMainSidebar, openSettingsSidebar, theme, isGlobalThreads} = props;
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

    let title;
    if (isGlobalThreads) {
        title = (<View style={style.wrapper}>
            <Text
                ellipsizeMode='tail'
                numberOfLines={1}
                style={style.threadsTitle}
            >
                <FormattedText
                    numberOfLines={1}
                    ellipsizeMode='tail'
                    id='threads'
                    defaultMessage='Threads'
                />
            </Text>
        </View>
        );
    } else {
        title = (
            <ChannelTitle
                onPress={onPress}
                canHaveSubtitle={canHaveSubtitle}
            />

        );
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
            {title}
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
    isGlobalThreads: PropTypes.bool,
};

export default ChannelNavBar;
