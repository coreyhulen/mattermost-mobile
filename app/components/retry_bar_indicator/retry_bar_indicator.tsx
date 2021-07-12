// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, TouchableWithoutFeedback} from 'react-native';

import FormattedText from '@components/formatted_text';
import {ViewTypes} from '@constants';
import {INDICATOR_BAR_HEIGHT} from '@constants/view';
import EventEmitter from '@mm-redux/utils/event_emitter';

type Props = {
    channelId?: string;
    failed: boolean;
    refreshChannelWithRetry: (channelId: string) => void;
}

const style = StyleSheet.create({
    flex: {flex: 1},
    message: {color: 'white', flex: 1, fontSize: 12},
    refreshIndicator: {
        alignItems: 'center',
        backgroundColor: '#fb8000',
        flexDirection: 'row',
        paddingHorizontal: 10,
        position: 'absolute',
        top: 0,
        overflow: 'hidden',
        width: '100%',
    },
});

const RetryBarIndicator = ({channelId, failed, refreshChannelWithRetry}: Props) => {
    const retryMessageHeight = useRef(new Animated.Value(0)).current;

    const onPress = () => {
        if (channelId) {
            refreshChannelWithRetry(channelId);
        }
    };

    useEffect(() => {
        const value = failed ? INDICATOR_BAR_HEIGHT : 0;
        if (failed) {
            EventEmitter.emit(ViewTypes.INDICATOR_BAR_VISIBLE, true);
        }

        Animated.timing(retryMessageHeight, {
            toValue: value,
            duration: 350,
            useNativeDriver: false,
        }).start(() => {
            if (!failed) {
                EventEmitter.emit(ViewTypes.INDICATOR_BAR_VISIBLE, false);
            }
        });
    }, [failed]);

    const refreshIndicatorDimensions = {
        height: retryMessageHeight,
    };

    return (
        <Animated.View style={[style.refreshIndicator, refreshIndicatorDimensions]}>
            <TouchableWithoutFeedback onPress={onPress}>
                <FormattedText
                    id='mobile.retry_message'
                    defaultMessage='Fetching messages failed. Tap here to try again.'
                    style={style.message}
                />
            </TouchableWithoutFeedback>
        </Animated.View>
    );
};

export default RetryBarIndicator;
