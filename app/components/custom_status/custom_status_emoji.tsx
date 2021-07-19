// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import withObservables from '@nozbe/with-observables';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import React from 'react';
import {Text, TextStyle} from 'react-native';

import Emoji from '@components/emoji';
import {MM_TABLES, SYSTEM_IDENTIFIERS} from '@constants/database';

import type {Database} from '@nozbe/watermelondb';
import type SystemModel from '@typings/database/models/servers/system';
import type UserModel from '@typings/database/models/servers/user';

const {SERVER: {SYSTEM, USER}} = MM_TABLES;

const ConnectedCustomStatusEmoji = ({emojiSize = 16, style, testID, userRecord}: CustomStatusEmojiProps) => {
    const customStatus = userRecord?.props?.customStatus;
    if (!customStatus?.emoji) {
        return null;
    }

    const testIdPrefix = testID ? `${testID}.` : '';
    return (
        <Text
            style={style}
            testID={`${testIdPrefix}custom_status_emoji.${customStatus.emoji}`}
        >
            <Emoji
                size={emojiSize}
                emojiName={customStatus.emoji}
            />
        </Text>
    );
};

type CustomStatusEmojiInputProps = {
    emojiSize?: number;
    style?: TextStyle;
    testID?: string;
    userId?: string;
};

type CustomStatusEmojiProps = CustomStatusEmojiInputProps & {
    currentUserIdRecord: SystemModel;
    database: Database;
    userRecord: UserModel;
};

const enhanceCurrentUserId = withObservables([], ({database}: { database: Database }) => ({
    currentUserIdRecord: database.collections.get(SYSTEM).findAndObserve(SYSTEM_IDENTIFIERS.CURRENT_USER_ID),
}));

const enhanceUserId = withObservables(['userId'], ({userId, currentUserIdRecord, database}: { userId: string; currentUserIdRecord: SystemModel; database: Database }) => ({
    userRecord: database.collections.get(USER).findAndObserve(userId ?? currentUserIdRecord?.value),
}));

const CustomStatusEmoji: React.FunctionComponent<CustomStatusEmojiInputProps> = withDatabase(enhanceCurrentUserId(enhanceUserId(ConnectedCustomStatusEmoji)));

export default CustomStatusEmoji;
