// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {Platform, Pressable, PressableStateCallbackType} from 'react-native';

import type {ActionProps} from '@mm-types/screens/gallery';

const pressedStyle = ({pressed}: PressableStateCallbackType) => {
    let opacity = 1;
    if (Platform.OS === 'ios' && pressed) {
        opacity = 0.5;
    }

    return [{opacity}];
};

const androidRippleConfig = {borderless: false, radius: 10};

const Action = ({action, children, visible, style}: ActionProps) => {
    const [disabled, setDisabled] = useState(false);

    const onPress = useCallback(async () => {
        setDisabled(true);
        action(() => {
            setDisabled(false);
        });
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <Pressable
            android_ripple={androidRippleConfig}
            disabled={disabled}
            hitSlop={24}
            onPress={onPress}
            style={(pressed) => [
                pressedStyle(pressed),
                style,
            ]}
        >
            {children}
        </Pressable>
    );
};

export default Action;
