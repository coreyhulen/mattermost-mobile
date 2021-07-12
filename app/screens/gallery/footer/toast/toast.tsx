// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useImperativeHandle, useState, useRef, forwardRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import CompassIcon from '@components/compass_icon';

import type {ToastProps, ToastRef, ToastState, ShowToast} from '@mm-types/screens/gallery';

const DEFAULT_DURATION = 1000;
const FADE_DURATION = 400;
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        elevation: 999,
        top: 10,
        zIndex: 1000,
    },
    toast: {
        borderRadius: 4,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    text: {
        flex: 1,
        fontFamily: 'Open Sans',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        marginLeft: 7,
    },
});

const Toast = forwardRef<ToastRef, ToastProps>(({theme}: ToastProps, ref) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(false);
    const [state, setState] = useState<ToastState>({});
    const [text, setText] = useState<string>();

    useEffect(() => {
        const unmount = () => {
            if (state.animation) {
                state.animation.stop();
            }
        };

        return unmount;
    }, []);

    useEffect(() => {
        if (visible) {
            state.animation = Animated.timing(opacity, {
                toValue: 1,
                duration: state.duration,
                useNativeDriver: true,
            });
            setState(state);

            state.animation.start(close);
        }
    }, [visible]);

    const close = () => {
        if (!visible) {
            return;
        }

        state.animation = Animated.timing(opacity, {
            toValue: 0,
            delay: DEFAULT_DURATION,
            duration: state.duration,
            useNativeDriver: true,
        });
        setState(state);

        state.animation.start(() => {
            setVisible(false);
            setText(undefined);
            if (typeof state.callback === 'function') {
                state.callback();
            }
        });
    };

    const show: ShowToast = (txt, dur, cb) => {
        state.callback = cb;
        state.duration = dur || FADE_DURATION;
        setState(state);
        setVisible(true);
        setText(txt);
    };

    useImperativeHandle(ref, () => ({
        show,
    }), [visible]);

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            style={[styles.container, {opacity}]}
            pointerEvents='none'
        >
            <View style={[{backgroundColor: theme.onlineIndicator}, styles.toast]}>
                <CompassIcon
                    color={theme.sidebarText}
                    name='check'
                    size={20}
                />
                <View>
                    <Text style={[styles.text, {color: theme.sidebarText}]}>{text}</Text>
                </View>
            </View>
        </Animated.View>
    );
});

Toast.displayName = 'Toast';

export default Toast;
