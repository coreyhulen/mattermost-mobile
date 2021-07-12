// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useNavigation} from '@react-navigation/native';

import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {StyleSheet, Text, TouchableHighlight, View} from 'react-native';

import FormattedText from '@components/formatted_text';
import {Preferences} from '@mm-redux/constants';
import {changeOpacity} from '@utils/theme';

import type {Channel} from '@mm-redux/types/channels';

interface ChannelButtonProps {
    channel?: Channel | null;
    intl: typeof intlShape;
    onSelect: (channel?: Channel | null) => void;
    teamId?: string;
}

const theme = Preferences.THEMES.default;

const ChannelButton = ({channel, intl, onSelect, teamId}: ChannelButtonProps) => {
    const navigation = useNavigation();
    const onPress = () => {
        navigation.navigate('Channels', {
            title: intl.formatMessage({id: 'mobile.routes.selectChannel', defaultMessage: 'Select Channel'}),
            currentChannelId: channel?.id,
            teamId,
            onSelectChannel,
        });
    };
    const onSelectChannel = (c: Channel) => {
        onSelect(c);
        navigation.goBack();
    };

    return (
        <TouchableHighlight
            onPress={onPress}
            style={styles.buttonContainer}
            underlayColor={changeOpacity(theme.centerChannelColor, 0.2)}
        >
            <View style={styles.buttonWrapper}>
                <FormattedText
                    defaultMessage='Channel'
                    id='mobile.share_extension.channel'
                    style={styles.buttonLabel}
                />
                <Text
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    style={styles.buttonValue}
                >
                    {channel?.display_name}
                </Text>
            </View>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    buttonContainer: {
        borderBottomColor: changeOpacity(theme.centerChannelColor, 0.2),
        borderBottomWidth: 1,
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.2),
        borderTopWidth: 1,
        height: 70,
        paddingHorizontal: 15,
    },
    buttonWrapper: {
        alignItems: 'flex-start',
        flex: 1,
    },
    buttonLabel: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 3,
    },
    buttonValue: {
        color: changeOpacity(theme.centerChannelColor, 0.6),
        fontSize: 14,
    },
});

export default injectIntl(ChannelButton);
