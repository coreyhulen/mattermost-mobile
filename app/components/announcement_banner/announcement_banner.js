// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {injectIntl} from 'react-intl';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {goToScreen} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import RemoveMarkdown from '@components/remove_markdown';
import {ViewTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';

const {View: AnimatedView} = Animated;

const AnnouncementBanner = injectIntl((props) => {
    const {bannerColor, bannerDismissed, bannerEnabled, bannerText, bannerTextColor, intl} = props;
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(false);
    const [navHeight, setNavHeight] = useState(0);

    const handlePress = () => {
        const screen = 'ExpandedAnnouncementBanner';
        const title = intl.formatMessage({
            id: 'mobile.announcement_banner.title',
            defaultMessage: 'Announcement',
        });

        goToScreen(screen, title);
    };

    useEffect(() => {
        const handleNavbarHeight = (height) => {
            setNavHeight(height);
        };

        EventEmitter.on(ViewTypes.CHANNEL_NAV_BAR_CHANGED, handleNavbarHeight);

        return () => EventEmitter.off(ViewTypes.CHANNEL_NAV_BAR_CHANGED, handleNavbarHeight);
    }, [insets]);

    useEffect(() => {
        const showBanner = bannerEnabled && !bannerDismissed && Boolean(bannerText);
        setVisible(showBanner);
        EventEmitter.emit(ViewTypes.INDICATOR_BAR_VISIBLE, showBanner);
    }, [bannerDismissed, bannerEnabled, bannerText]);

    useEffect(() => {
        Animated.timing(translateY, {
            toValue: visible ? navHeight : insets.top,
            duration: 50,
            useNativeDriver: true,
        }).start();
    }, [visible, navHeight]);

    if (!visible) {
        return null;
    }

    const bannerStyle = {
        backgroundColor: bannerColor,
        height: ViewTypes.INDICATOR_BAR_HEIGHT,
        transform: [{translateY}],
    };

    const bannerTextStyle = {
        color: bannerTextColor,
    };

    return (
        <AnimatedView
            style={[style.bannerContainer, bannerStyle]}
        >
            <TouchableOpacity
                onPress={handlePress}
                style={[style.wrapper, {marginLeft: insets.left, marginRight: insets.right}]}
            >
                <Text
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    style={[style.bannerText, bannerTextStyle]}
                >
                    <RemoveMarkdown value={bannerText}/>
                </Text>
                <CompassIcon
                    color={bannerTextColor}
                    name='information-outline'
                    size={16}
                />
            </TouchableOpacity>
        </AnimatedView>
    );
});

AnnouncementBanner.propTypes = {
    bannerColor: PropTypes.string,
    bannerDismissed: PropTypes.bool,
    bannerEnabled: PropTypes.bool,
    bannerText: PropTypes.string,
    bannerTextColor: PropTypes.string,
};

export default AnnouncementBanner;

const style = StyleSheet.create({
    bannerContainer: {
        elevation: 2,
        paddingHorizontal: 10,
        position: 'absolute',
        top: 0,
        overflow: 'hidden',
        width: '100%',
        zIndex: 2,
    },
    wrapper: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
    },
    bannerText: {
        flex: 1,
        fontSize: 14,
        marginRight: 5,
    },
});
