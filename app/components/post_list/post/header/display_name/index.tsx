// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef} from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {Keyboard, Text, useWindowDimensions, View} from 'react-native';

import {showModal} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {preventDoubleTap} from '@utils/tap';
import {makeStyleSheetFromTheme} from '@utils/theme';

import type {Theme} from '@mm-redux/types/preferences';
import type {ImageSource} from 'react-native-vector-icons/Icon';

type HeaderDisplayNameProps = {
    commentCount: number;
    displayName?: string;
    intl: typeof intlShape;
    isAutomation: boolean;
    rootPostAuthor?: string;
    shouldRenderReplyButton?: boolean;
    theme: Theme;
    userId: string;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        displayName: {
            color: theme.centerChannelColor,
            fontSize: 15,
            fontWeight: '600',
            flexGrow: 1,
            paddingVertical: 2,
        },
        displayNameContainer: {
            maxWidth: '60%',
            marginRight: 5,
            marginBottom: 3,
        },
        displayNameContainerBotReplyWidth: {
            maxWidth: '50%',
        },
        displayNameContainerLandscape: {
            maxWidth: '80%',
        },
        displayNameContainerLandscapeBotReplyWidth: {
            maxWidth: '70%',
        },

    };
});

const HeaderDisplayName = ({
    commentCount, displayName, intl, isAutomation, rootPostAuthor, shouldRenderReplyButton, theme, userId,
}: HeaderDisplayNameProps) => {
    const closeButton = useRef<ImageSource>();
    const dimensions = useWindowDimensions();
    const style = getStyleSheet(theme);

    const onPress = useCallback(preventDoubleTap(() => {
        const screen = 'UserProfile';
        const title = intl.formatMessage({id: 'mobile.routes.user_profile', defaultMessage: 'Profile'});
        const passProps = {userId};

        if (!closeButton.current) {
            closeButton.current = CompassIcon.getImageSourceSync('close', 24, theme.sidebarHeaderTextColor);
        }

        const options = {
            topBar: {
                leftButtons: [{
                    id: 'close-settings',
                    icon: closeButton.current,
                    testID: 'close.settings.button',
                }],
            },
        };

        Keyboard.dismiss();
        showModal(screen, title, passProps, options);
    }), []);

    const calcNameWidth = () => {
        const isLandscape = dimensions.width > dimensions.height;

        const showReply = shouldRenderReplyButton || (!rootPostAuthor && commentCount > 0);
        const reduceWidth = showReply && isAutomation;

        if (reduceWidth && isLandscape) {
            return style.displayNameContainerLandscapeBotReplyWidth;
        } else if (isLandscape) {
            return style.displayNameContainerLandscape;
        } else if (reduceWidth) {
            return style.displayNameContainerBotReplyWidth;
        }
        return undefined;
    };

    const displayNameWidth = calcNameWidth();
    const displayNameStyle = [style.displayNameContainer, displayNameWidth];

    if (isAutomation) {
        return (
            <View style={displayNameStyle}>
                <Text
                    style={style.displayName}
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                    testID='post_header.display_name'
                >
                    {displayName}
                </Text>
            </View>
        );
    } else if (displayName) {
        return (
            <TouchableWithFeedback
                onPress={onPress}
                style={displayNameStyle}
                type={'opacity'}
            >
                <Text
                    style={style.displayName}
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                    testID='post_header.display_name'
                >
                    {displayName}
                </Text>
            </TouchableWithFeedback>
        );
    }

    return (
        <View style={style.displayNameContainer}>
            <FormattedText
                id='channel_loader.someone'
                defaultMessage='Someone'
                style={style.displayName}
                testID='post_header.display_name'
            />
        </View>
    );
};

export default injectIntl(HeaderDisplayName);
