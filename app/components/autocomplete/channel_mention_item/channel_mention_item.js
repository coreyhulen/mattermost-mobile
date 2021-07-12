// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import {BotTag, GuestTag} from '@components/tag';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {General} from '@mm-redux/constants';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        icon: {
            fontSize: 18,
            marginRight: 11,
            color: theme.centerChannelColor,
            opacity: 0.56,
        },
        row: {
            paddingHorizontal: 16,
            height: 40,
            flexDirection: 'row',
            alignItems: 'center',
        },
        rowDisplayName: {
            fontSize: 15,
            color: theme.centerChannelColor,
        },
        rowName: {
            fontSize: 15,
            color: theme.centerChannelColor,
            opacity: 0.56,
        },
    };
});

const ChannelMentionItem = (props) => {
    const insets = useSafeAreaInsets();
    const {
        channelId,
        displayName,
        isBot,
        isGuest,
        name,
        onPress,
        shared,
        testID,
        theme,
        type,
    } = props;

    const completeMention = () => {
        if (type === General.DM_CHANNEL || type === General.GM_CHANNEL) {
            onPress('@' + displayName.replace(/ /g, ''));
        } else {
            onPress(name);
        }
    };

    const style = getStyleFromTheme(theme);
    const margins = {marginLeft: insets.left, marginRight: insets.right};
    let iconName = 'globe';
    let component;
    if (shared) {
        iconName = type === General.PRIVATE_CHANNEL ? 'circle-multiple-outline-lock' : 'circle-multiple-outline';
    } else if (type === General.PRIVATE_CHANNEL) {
        iconName = 'lock';
    }

    if (type === General.DM_CHANNEL || type === General.GM_CHANNEL) {
        if (!displayName) {
            return null;
        }

        component = (
            <TouchableWithFeedback
                key={channelId}
                onPress={completeMention}
                style={[style.row, margins]}
                testID={testID}
                type={'opacity'}
            >
                <Text style={style.rowDisplayName}>{'@' + displayName}</Text>
                <BotTag
                    show={isBot}
                    theme={theme}
                />
                <GuestTag
                    show={isGuest}
                    theme={theme}
                />
            </TouchableWithFeedback>
        );
    } else {
        component = (
            <TouchableWithFeedback
                key={channelId}
                onPress={completeMention}
                style={margins}
                underlayColor={changeOpacity(theme.buttonBg, 0.08)}
                testID={testID}
                type={'native'}
            >
                <View style={style.row}>
                    <CompassIcon
                        name={iconName}
                        style={style.icon}
                    />
                    <Text style={style.rowDisplayName}>{displayName}</Text>
                    <Text style={style.rowName}>{` ~${name}`}</Text>
                </View>
            </TouchableWithFeedback>
        );
    }

    return component;
};

ChannelMentionItem.propTypes = {
    channelId: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isBot: PropTypes.bool.isRequired,
    isGuest: PropTypes.bool.isRequired,
    onPress: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default ChannelMentionItem;
