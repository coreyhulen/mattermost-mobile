// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text, View} from 'react-native';

import {makeStyleSheetFromTheme} from '@utils/theme';

import type {Theme} from '@mm-redux/types/preferences';
import type {PerfMetric} from '@telemetry';

type PerfItemProps = {
    metric: PerfMetric;
    theme: Theme;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        alignItems: 'flex-start',
        backgroundColor: theme.centerChannelBg,
        margin: 5,
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 5,
    },
    totalTime: {
        fontWeight: 'bold',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 1,
        paddingHorizontal: 4,
        textAlign: 'center',
        marginVertical: 3,
    },
    text: {
        color: theme.centerChannelColor,
        fontSize: 16,
    },
    extra: {
        paddingHorizontal: 5,
        paddingVertical: 3,
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 0,
    },
}));

const PerfItem = ({metric, theme}: PerfItemProps) => {
    const styles = getStyleSheet(theme);
    const time = (metric.endTime || 0) - metric.startTime;

    const getStatusTextColor = (totalTime: number) => {
        if (totalTime <= 500) {
            return theme.onlineIndicator;
        }

        if (totalTime <= 2000) {
            return theme.awayIndicator;
        }

        return theme.dndIndicator;
    };

    const getStatusStyles = (totalTime: number) => ({
        color: getStatusTextColor(totalTime),
        borderColor: getStatusTextColor(totalTime),
    });

    return (
        <View style={styles.container}>
            <Text style={[styles.text, styles.name]}>
                {metric.name}
            </Text>
            <Text style={[styles.totalTime, getStatusStyles(time)]}>
                {time + 'ms'}
            </Text>
            <Text style={[styles.text, styles.extra]}>
                {metric.extra}
            </Text>
        </View>
    );
};

export default PerfItem;
