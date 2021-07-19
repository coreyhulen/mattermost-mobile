// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Database, Q} from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import React from 'react';
import {Platform, StyleProp, StyleSheet, Text, TextStyle} from 'react-native';
import FastImage, {ImageStyle} from 'react-native-fast-image';

import {MM_TABLES, SYSTEM_IDENTIFIERS} from '@constants/database';
import {useServerUrl} from '@context/server_url';
import NetworkManager from '@init/network_manager';
import {BuiltInEmojis, EmojiIndicesByAlias, Emojis} from '@utils/emojis';

import type CustomEmojiModel from '@typings/database/models/servers/custom_emoji';
import type SystemModel from '@typings/database/models/servers/system';

type EmojiInputProps = {
    customEmojiStyle?: StyleProp<ImageStyle>;
    emojiName: string;
    literal?: string;
    size?: number;
    testID?: string;
    textStyle?: StyleProp<TextStyle>;
};

type EmojiProps = EmojiInputProps & {
    emojiRecords: CustomEmojiModel[];
    configRecord: SystemModel;
    currentUserIdRecord: SystemModel;
};

const {SERVER: {SYSTEM, CUSTOM_EMOJI}} = MM_TABLES;

const ConnectedEmoji = ({customEmojiStyle = undefined, emojiName, emojiRecords, literal = '', size, configRecord, currentUserIdRecord, testID, textStyle}: EmojiProps) => {
    const config = configRecord.value as ClientConfig | undefined;
    const currentUserId = currentUserIdRecord.value as string | undefined;
    const customEmojis = emojiRecords?.[0];

    const serverUrl = useServerUrl();
    const client = NetworkManager.getClient(serverUrl);

    let imageUrl = '';
    let unicode;
    let displayTextOnly = false;

    //todo: BuiltInEmojis has been removed from master branch
    if (EmojiIndicesByAlias.has(emojiName) || BuiltInEmojis.includes(emojiName)) {
        const emoji = Emojis[EmojiIndicesByAlias.get(emojiName)!];
        unicode = emoji.filename;
        if (BuiltInEmojis.includes(emojiName)) {
            if (serverUrl) {
                imageUrl = client.getSystemEmojiImageUrl(emoji.filename);
            } else {
                displayTextOnly = true;
            }
        }
    } else if (customEmojis && serverUrl) {
        imageUrl = client.getCustomEmojiImageUrl(customEmojis!.id);
    } else {
        displayTextOnly =

            // fixme: A new table will be created to handle nonExistentEmoji
            // state.entities.emojis.nonExistentEmoji.has(emojiName) ||
            config?.EnableCustomEmoji !== 'true' ||
            config?.ExperimentalEnablePostMetadata === 'true' ||
            !currentUserId;
    }

    let emojiSize = size;
    let fontSize = emojiSize;
    if (!emojiSize && textStyle) {
        const flatten = StyleSheet.flatten(textStyle);
        fontSize = flatten.fontSize;
        emojiSize = fontSize;
    }

    if (displayTextOnly) {
        return (
            <Text
                style={textStyle}
                testID={testID}
            >
                {literal}
            </Text>
        );
    }

    const width = emojiSize;
    const height = emojiSize;

    if (unicode && !imageUrl) {
        const codeArray = unicode.split('-');
        const code = codeArray.reduce((acc, c) => {
            return acc + String.fromCodePoint(parseInt(c, 16));
        }, '');

        return (
            <Text
                style={[textStyle, {fontSize: emojiSize}]}
                testID={testID}
            >
                {code}
            </Text>
        );
    }

    if (!imageUrl) {
        return null;
    }

    // Android can't change the emojiSize of an image after its first render, so
    // force a new image to be rendered when the emojiSize changes
    const key = Platform.OS === 'android' ? `${imageUrl}-${height}-${width}` : null;

    return (
        <FastImage
            key={key}
            style={[customEmojiStyle, {width, height}]}
            source={{uri: imageUrl}}
            resizeMode={FastImage.resizeMode.contain}
            testID={testID}
        />
    );
};

const Emoji: React.FunctionComponent<EmojiInputProps> = withDatabase(withObservables(['emojiName'], ({emojiName, database}: { emojiName: string; database: Database }) => ({
    configRecord: database.collections.get(SYSTEM).findAndObserve(SYSTEM_IDENTIFIERS.CONFIG),
    currentUserIdRecord: database.collections.get(SYSTEM).findAndObserve(SYSTEM_IDENTIFIERS.CURRENT_USER_ID),
    emojiRecords: database.collections.get(CUSTOM_EMOJI).query(Q.where('id', emojiName), Q.or(Q.where('name', emojiName))).observe(),
}))(ConnectedEmoji));

export default Emoji;
