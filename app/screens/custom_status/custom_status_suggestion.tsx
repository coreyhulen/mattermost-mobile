// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {injectIntl, intlShape} from 'react-intl';
import React, {useCallback} from 'react';
import {View, TouchableOpacity, Text} from 'react-native';

import Emoji from '@components/emoji';
import ClearButton from '@components/custom_status/clear_button';
import CustomStatusText from '@components/custom_status/custom_status_text';
import {durationValues} from '@constants/custom_status';
import {Theme} from '@mm-redux/types/preferences';
import {CustomStatusDuration, UserCustomStatus} from '@mm-redux/types/users';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

type Props = {
    intl: typeof intlShape;
    handleSuggestionClick: (status: UserCustomStatus) => void;
    emoji: string;
    text: string;
    handleClear?: (status: UserCustomStatus) => void;
    theme: Theme;
    separator: boolean;
    duration: CustomStatusDuration;
    isExpirySupported: boolean;
    expires_at?: string;
};

const CustomStatusSuggestion = ({handleSuggestionClick, emoji, text, theme, separator, handleClear, duration, expires_at, intl, isExpirySupported}: Props) => {
    const style = getStyleSheet(theme);

    const handleClick = useCallback(preventDoubleTap(() => {
        handleSuggestionClick({emoji, text, duration});
    }), []);

    const handleSuggestionClear = useCallback(() => {
        if (handleClear) {
            handleClear({emoji, text, duration, expires_at});
        }
    }, []);

    const clearButton = handleClear && expires_at ?
        (
            <View style={style.clearButtonContainer}>
                <ClearButton
                    handlePress={handleSuggestionClear}
                    theme={theme}
                    iconName='close'
                    size={18}
                    testID='custom_status_suggestion.clear.button'
                />
            </View>
        ) : null;

    return (
        <TouchableOpacity
            testID={`custom_status_suggestion.${text}`}
            onPress={handleClick}
        >
            <View style={style.container}>
                <Text style={style.iconContainer}>
                    <Emoji
                        emojiName={emoji}
                        size={20}
                    />
                </Text>
                <View style={style.wrapper}>
                    <View style={style.textContainer}>
                        <View>
                            <CustomStatusText
                                text={text}
                                theme={theme}
                                textStyle={style.customStatusText}
                            />
                        </View>
                        {Boolean(duration && isExpirySupported) && (
                            <View style={{paddingTop: 5}}>
                                <CustomStatusText
                                    text={intl.formatMessage(durationValues[duration])}
                                    theme={theme}
                                    textStyle={style.customStatusDuration}
                                />
                            </View>
                        )}
                    </View>
                    {clearButton}
                    {separator && <View style={style.divider}/>}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default injectIntl(CustomStatusSuggestion);

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            backgroundColor: theme.centerChannelBg,
            flexDirection: 'row',
            minHeight: 50,
        },
        iconContainer: {
            width: 45,
            height: 46,
            left: 14,
            top: 12,
            marginRight: 6,
            color: theme.centerChannelColor,
        },
        wrapper: {
            flex: 1,
        },
        textContainer: {
            paddingTop: 14,
            paddingBottom: 14,
            justifyContent: 'center',
            width: '70%',
            flex: 1,
        },
        clearButtonContainer: {
            position: 'absolute',
            top: 4,
            right: 13,
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            height: 1,
            marginRight: 16,
        },
        customStatusDuration: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
            fontSize: 15,
        },
        customStatusText: {
            color: theme.centerChannelColor,
        },
    };
});
