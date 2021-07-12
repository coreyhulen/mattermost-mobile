// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FlatList, View} from 'react-native';
import {useSelector} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {changeOpacity, makeStyleFromTheme} from '@mm-redux/utils/theme_utils';
import telemetry, {PerfMetric} from '@telemetry';

import PerfItem from './item';

import type {Theme} from '@mm-redux/types/preferences';

const getStyleSheet = makeStyleFromTheme((theme: Theme) => {
    return {
        container: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            flex: 1,
        },
    };
});

const PerfMetrics = () => {
    const theme: Theme = useSelector(getTheme);
    const style = getStyleSheet(theme);
    const data: PerfMetric[] = telemetry.getMetrics();

    return (
        <View style={style.container}>
            <FlatList
                data={data}
                keyExtractor={(item: PerfMetric) => `${item.name}-${item.startTime}`}
                renderItem={({item}) => (
                    <PerfItem
                        metric={item}
                        theme={theme}
                    />
                )}
            />
        </View>
    );
};

export default PerfMetrics;
