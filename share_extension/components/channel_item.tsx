// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react';
import {StyleSheet, Text, TouchableHighlight, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {Preferences} from '@mm-redux/constants';
import {Channel} from '@mm-redux/types/channels';
import {DirectChannel, GroupChannel, PublicChannel, PrivateChannel} from '@share/components/channel_type';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity} from '@utils/theme';

interface ChannelItemProps {
    onSelect: (channel: Channel) => void;
    selected: boolean;
    channel: Channel;
}

const theme = Preferences.THEMES.default;

const channelTypes: Record<string, ReactNode> = {
    D: DirectChannel,
    G: GroupChannel,
    O: PublicChannel,
    P: PrivateChannel,
};

const ChannelItem = ({onSelect, selected, channel}: ChannelItemProps) => {
    const onPress = preventDoubleTap(() => {
        onSelect(channel);
    });

    let current;
    if (selected) {
        current = (
            <View style={styles.checkmarkContainer}>
                <CompassIcon
                    name='check'
                    style={styles.checkmark}
                />
            </View>
        );
    }

    const channelType = channelTypes[channel.type] || PublicChannel;

    return (
        <TouchableHighlight
            underlayColor={changeOpacity(theme.sidebarTextHoverBg, 0.5)}
            onPress={onPress}
        >
            <View style={styles.container}>
                <View style={styles.item}>
                    {channelType()}
                    <Text
                        testID='share_extension.channel_item.display_name'
                        style={[styles.text]}
                        ellipsizeMode='tail'
                        numberOfLines={1}
                    >
                        {channel.display_name}
                    </Text>
                    {current}
                </View>
            </View>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        height: 45,
        paddingHorizontal: 15,
    },
    item: {
        alignItems: 'center',
        height: 45,
        flex: 1,
        flexDirection: 'row',
    },
    text: {
        color: theme.centerChannelColor,
        flex: 1,
        fontSize: 16,
        paddingRight: 5,
    },
    iconContainer: {
        marginRight: 5,
    },
    checkmarkContainer: {
        alignItems: 'flex-end',
    },
    checkmark: {
        color: theme.linkColor,
        fontSize: 16,
    },
});

export default ChannelItem;
