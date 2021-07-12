// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import FormattedText from '@components/formatted_text';

import type {DetailsProps} from '@mm-types/screens/gallery';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        marginHorizontal: 12,
    },
    chanelText: {
        color: '#FFFFFF',
        fontFamily: 'Open Sans',
        fontSize: 12,
        lineHeight: 12,
        marginTop: 3,
        opacity: 0.56,
    },
    userText: {
        color: '#FFFFFF',
        fontFamily: 'Open Sans',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 20,
    },
});

const Details = ({channel, isDirect, ownPost, user}: DetailsProps) => {
    const prefix = isDirect ? '@' : '~';
    let userElement = (
        <Text
            ellipsizeMode='tail'
            numberOfLines={1}
            style={styles.userText}
        >
            {user}
        </Text>
    );

    if (ownPost) {
        userElement = (
            <FormattedText
                id='channel_header.directchannel.you'
                defaultMessage='{displayname} (you)'
                ellipsizeMode='tail'
                numberOfLines={1}
                style={styles.userText}
                values={{displayname: user}}
            />
        );
    } else if (!user) {
        userElement = (
            <FormattedText
                id='channel_loader.someone'
                defaultMessage='Someone'
                ellipsizeMode='tail'
                numberOfLines={1}
                style={styles.userText}
            />
        );
    }

    return (
        <View style={styles.container}>
            {userElement}
            <FormattedText
                id='gallery.footer.channel_name'
                defaultMessage='Shared in {channelName}'
                ellipsizeMode='tail'
                numberOfLines={1}
                style={styles.chanelText}
                values={{channelName: `${prefix}${channel}`}}
            />
        </View>
    );
};

export default Details;
