// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import FormattedText from '@components/formatted_text';
import FormattedTime from '@components/formatted_time';
import {makeStyleSheetFromTheme} from '@utils/theme';

import type {Theme} from '@mm-redux/types/preferences';
import type {UserTimezone} from '@mm-redux/types/users';

type Props = {
    createAt: number | string | Date;
    isMilitaryTime: boolean;
    theme: Theme;
    userTimezone: UserTimezone | string | null | undefined;
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
        header: {
            flex: 1,
            flexDirection: 'row',
            marginTop: 10,
        },
        time: {
            color: theme.centerChannelColor,
            fontSize: 12,
            marginTop: 5,
            opacity: 0.5,
            flex: 1,
        },
    };
});

const SystemHeader = ({isMilitaryTime, createAt, theme, userTimezone}: Props) => {
    const styles = getStyleSheet(theme);

    return (
        <View style={styles.header}>
            <View style={styles.displayNameContainer}>
                <FormattedText
                    id='post_info.system'
                    defaultMessage='System'
                    style={styles.displayName}
                    testID='post_header.display_name'
                />
            </View>
            <FormattedTime
                timezone={userTimezone!}
                isMilitaryTime={isMilitaryTime}
                value={createAt}
                style={styles.time}
                testID='post_header.date_time'
            />
        </View>
    );
};

export default SystemHeader;
