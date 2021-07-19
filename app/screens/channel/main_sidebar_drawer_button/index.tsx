// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useTheme} from '@context/theme';
import React from 'react';
import {useIntl} from 'react-intl';
import {TouchableOpacity, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {preventDoubleTap} from '@utils/tap';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {t} from '@utils/i18n';

type Props = {
    openSidebar: () => void;
    badgeCount: number;
    visible: boolean;
}

const MainSidebarDrawerButton = ({openSidebar, visible = true}: Props) => {
    const theme = useTheme();
    const intl = useIntl();

    const handlePress = preventDoubleTap(() => {
        openSidebar();
    });

    //todo: render badge component

    const {formatMessage} = intl;

    const buttonDescriptor = {
        id: t('navbar.channel_drawer.button'),
        defaultMessage: 'Channels and teams',
        description: 'Accessibility helper for channel drawer button.',
    };

    const accessibilityLabel = formatMessage(buttonDescriptor);

    const buttonHint = {
        id: t('navbar.channel_drawer.hint'),
        defaultMessage: 'Opens the channels and teams drawer',
        description: 'Accessibility helper for explaining what the channel drawer button will do.',
    };

    const accessibilityHint = formatMessage(buttonHint);

    const style = getStyleFromTheme(theme);

    let icon;
    let containerStyle;
    if (visible) {
        icon = (
            <CompassIcon
                name='menu-variant'
                size={24}
                color={theme.sidebarHeaderTextColor}
            />
        );
        containerStyle = style.container;
    } else {
        icon = (<View style={style.tabletIcon}/>);
        containerStyle = style.tabletContainer;
    }

    console.log('>>>>>>>>>>>>>>> here');

    return (
        <TouchableOpacity
            accessible={true}
            accessibilityHint={accessibilityHint}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole='button'
            onPress={handlePress}
            style={containerStyle}
        >
            <View
                style={[style.wrapper]}
                testID='main_sidebar_drawer.button'
            >
                <View>
                    {icon}
                    {/*{badge}*/}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            width: 55,
        },
        tabletContainer: {
            width: 10,
        },
        tabletIcon: {
            height: 25,
        },
        wrapper: {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            paddingHorizontal: 10,
        },
        badge: {
            backgroundColor: theme.mentionBg,
            height: 18,
            padding: 3,
        },
        smallBadge: {
            backgroundColor: theme.mentionBg,
            height: 8,
            padding: 3,
        },
        badgeContainer: {
            borderColor: theme.sidebarHeaderBg,
            borderRadius: 14,
            borderWidth: 2,
            position: 'absolute',
            top: -6,
        },
        smallBadgeContainer: {
            borderColor: theme.sidebarHeaderBg,
            borderRadius: 14,
            borderWidth: 2,
            position: 'absolute',

            right: -4,
            top: 0,
        },
        mention: {
            color: theme.mentionColor,
            fontSize: 10,
            fontWeight: 'bold',
        },
    };
});

export default MainSidebarDrawerButton;
