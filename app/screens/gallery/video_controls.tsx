// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Animated, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Slider from 'react-native-slider';

import CompassIcon from '@components/compass_icon';
import {CallbackFunctionWithoutArguments} from '@mm-types/screens/gallery';
import {makeStyleSheetFromTheme} from '@utils/theme';

interface VideoControlsProps {
    isLandscape: boolean;
    mainColor?: string;
    paused: boolean;
    onPlayPause(): void;
    onSeek(value: number): void;
    showHideHeaderFooter?(display: boolean): void;
}

export interface VideoControlsRef {
    showControls(playing: boolean): void;
    videoDuration(duration: number): void;
    videoProgress(progress: number): void;
}

const getStyles = makeStyleSheetFromTheme((isLandscape: boolean) => ({
    controlsRow: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 72,
        height: 72,
    },
    controlIcon: {
        height: 32,
    },
    progressContainer: {
        position: 'absolute',
        flexDirection: 'row',
        bottom: Platform.select({
            android: isLandscape ? 79 : 69,
            ios: isLandscape ? 64 : 92,
        }),
        marginHorizontal: 16,
    },
    progressColumnContainer: {
        flex: 1,
    },
    timerLabelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: -7,
    },
    timerLabel: {
        fontSize: 12,
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 10,
    },
    thumb: {
        width: 16,
        height: 16,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.24,
        shadowRadius: 14,
        elevation: 5,
    },
}));

const getControlIconName = (paused: boolean) => {
    if (!paused) {
        return 'pause';
    }

    return 'play';
};

const humanizeVideoDuration = (seconds: number) => {
    const [begin, end] = seconds >= 3600 ? [11, 8] : [14, 5];
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(begin, end);
};

let animation: Animated.CompositeAnimation;

const VideoControls = forwardRef<VideoControlsRef, VideoControlsProps>((props: VideoControlsProps, ref) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(true);
    const styles = getStyles(props.isLandscape);

    const fadeControls = (toValue: number, delay = 0, callback?: CallbackFunctionWithoutArguments) => {
        if (animation) {
            animation.stop();
        }
        animation = Animated.timing(opacity, {
            toValue,
            duration: 250,
            delay,
            useNativeDriver: true,
        });

        animation.start((result: Animated.EndResult) => {
            if (callback && result.finished) {
                callback();
            }
        });
    };

    useEffect(() => {
        opacity.setValue(1);
    }, []);

    useImperativeHandle(ref, () => ({
        showControls,
        videoDuration,
        videoProgress,
    }), []);

    const display = (show: boolean) => {
        setVisible(show);
        if (props.showHideHeaderFooter) {
            props.showHideHeaderFooter(show);
        }
    };

    const showControls = (playing: boolean) => {
        display(true);
        if (playing) {
            fadeControls(1, 0, () => {
                fadeControls(0, 1000, () => display(false));
            });
        } else {
            fadeControls(1, 0);
        }
    };

    const playPause = () => {
        if (props.paused) {
            fadeControls(0, 250, () => display(false));
        } else {
            fadeControls(1, 250, () => display(true));
        }

        props.onPlayPause();
    };

    const seekEnd = (value: number) => {
        props.onSeek(value);
        setProgress(value);
        if (!props.paused) {
            fadeControls(0, 1000, () => display(false));
        }
    };

    const seeking = (value: number) => {
        setProgress(value);
    };

    const seekStart = () => {
        opacity.stopAnimation();
        display(true);
    };

    const videoDuration = (value: number) => {
        setDuration(value);
    };

    const videoProgress = (value: number) => {
        setProgress(value);
    };

    if (!visible) {
        return null;
    }

    const iconName = getControlIconName(props.paused);
    return (
        <Animated.View
            pointerEvents='box-none'
            style={[StyleSheet.absoluteFill, {opacity, backgroundColor: 'rgba(0, 0, 0, 0.3)'}]}
        >
            <View style={[styles.controlsRow, StyleSheet.absoluteFill]}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={playPause}
                >
                    <CompassIcon
                        name={iconName}
                        size={72}
                        color='#fff'
                    />
                </TouchableOpacity>
            </View>
            <SafeAreaView
                edges={['left', 'right']}
                mode='margin'
                pointerEvents='box-none'
                style={styles.progressColumnContainer}
            >
                <View style={[styles.controlsRow, styles.progressContainer]}>
                    <View style={styles.progressColumnContainer}>
                        <View style={[styles.timerLabelsContainer]}>
                            <Text style={styles.timerLabel}>
                                {humanizeVideoDuration(progress)}
                            </Text>
                            <Text style={styles.timerLabel}>
                                {humanizeVideoDuration(duration)}
                            </Text>
                        </View>
                        <Slider
                            onSlidingComplete={seekEnd}
                            onValueChange={seeking}
                            onSlidingStart={seekStart}
                            maximumValue={Math.floor(duration)}
                            value={Math.floor(progress)}
                            thumbStyle={[styles.thumb]}
                            minimumTrackTintColor={props.mainColor}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
});

VideoControls.displayName = 'VideoControls';

export default VideoControls;
