// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import type {Theme} from '@mm-redux/types/preferences';

interface ReadOnlyProps {
    testID?: string;
    theme: Theme;
}

const ReadOnlyChannnel = ({testID, theme}: ReadOnlyProps): ReactNode => {
    const style = getStyle(theme);
    return (
        <SafeAreaView
            edges={['bottom']}
            style={style.background}
        >
            <View
                testID={testID}
                style={style.container}
            >
                <CompassIcon
                    name='glasses'
                    style={style.icon}
                    color={theme.centerChannelColor}
                />
                <FormattedText
                    id='mobile.create_post.read_only'
                    defaultMessage='This channel is read-only.'
                    style={style.text}
                />
            </View>
        </SafeAreaView>
    );
};

const getStyle = makeStyleSheetFromTheme((theme: Theme) => ({
    background: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
    },
    container: {
        alignItems: 'center',
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.20),
        borderTopWidth: 1,
        flexDirection: 'row',
        height: 50,
        paddingHorizontal: 12,
    },
    icon: {
        fontSize: 20,
        lineHeight: 22,
        opacity: 0.56,
    },
    text: {
        color: theme.centerChannelColor,
        fontSize: 15,
        lineHeight: 20,
        marginLeft: 9,
        opacity: 0.56,
    },
}));

export default ReadOnlyChannnel;
