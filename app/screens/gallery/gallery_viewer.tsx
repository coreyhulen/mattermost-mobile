// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {PanGestureHandler, PinchGestureHandler, State, TapGestureHandler, TapGestureHandlerStateChangeEvent} from 'react-native-gesture-handler';
import Animated, {abs, add, and, call, clockRunning, cond, divide, eq, greaterOrEq, greaterThan, multiply, neq, not, onChange, set, sub, useCode, EasingNode, ceil} from 'react-native-reanimated';
import {clamp, snapPoint, timing, useClock, usePanGestureHandler, usePinchGestureHandler, useTapGestureHandler, useValue, vec} from 'react-native-redash/lib/module/v1';

import {isImage, isVideo} from '@utils/file';
import {calculateDimensions} from '@utils/images';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import {usePinch} from './animation_helper';
import GalleryFile from './gallery_file';
import GalleryImage from './gallery_image';
import GalleryVideo from './gallery_video';

import type {GalleryProps} from '@mm-types/screens/gallery';

const itemTopStyle = (props: GalleryProps): number => {
    if (Platform.OS === 'android') {
        if (props.footerVisible) {
            return props.isLandscape ? -64 : -99;
        }

        return props.isLandscape ? -6 : -41;
    }

    return 0;
};

const getStyles = makeStyleSheetFromTheme((props: GalleryProps) => ({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    items: {
        width: (props.width * props.files.length),
        height: props.height,
        flexDirection: 'row',
        alignItems: 'center',
    },
    item: {
        alignItems: 'center',
        height: props.height,
        justifyContent: 'center',
        overflow: 'hidden',
        width: props.width,
    },
    center: {
        justifyContent: 'center',
    },
}));

const GalleryViewer = (props: GalleryProps) => {
    const {files, height, initialIndex, width} = props;
    const [enabled, setEnabled] = useState(false);
    const [tapEnabled, setTapEnabled] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const styles = getStyles(props);
    const topValue = itemTopStyle(props);
    const top = useRef(useValue(topValue)).current;

    const canvas = useMemo(() => vec.create(width, height), [width]);
    const center = useMemo(() => vec.divide(canvas, 2), [canvas]);
    const snapPoints = useMemo(() => files.map((_, i) => {
        return (i * -width);
    }), []);

    const pinchRef = useRef<PinchGestureHandler>(null);
    const panRef = useRef<PanGestureHandler>(null);
    const doubleTapRef = useRef<TapGestureHandler>(null);

    const pan = useRef(usePanGestureHandler()).current;
    const pinch = useRef(usePinchGestureHandler()).current;
    const doubleTap = useRef(useTapGestureHandler()).current;

    const scale = useRef(useValue(1)).current;
    const translate = useRef(vec.createValue(0, 0)).current;

    const clock = useRef(useClock()).current;
    const zoomClock = useRef(useClock()).current;

    const index = useRef(useValue(initialIndex)).current;
    const offsetX = useRef(useValue(snapPoints[initialIndex])).current;
    const translationX = useRef(useValue(snapPoints[initialIndex])).current;
    const translateX = useRef(useValue(snapPoints[initialIndex])).current;
    const translationY = useRef(useValue(0)).current;
    const translateY = useRef(useValue(0)).current;
    const zoomed = useRef(useValue(0)).current;

    const minVec = vec.min(vec.multiply(-0.5, canvas, sub(scale, 1)), 0);
    const maxVec = vec.max(vec.minus(minVec), 0);

    const currentFile = files[currentIndex];
    const imgHeight = currentFile.height || height;
    const imgWidth = currentFile.width || width;
    const calculatedDimensions = calculateDimensions(imgHeight, imgWidth, width, height);
    const imgCanvas = vec.create(calculatedDimensions.width || 0, calculatedDimensions.height || 0);
    const minImgVec = vec.min(vec.multiply(-0.5, imgCanvas, sub(scale, 1)), 0);
    const maxImgVec = vec.max(vec.minus(minImgVec), 0);

    const snapTo = useMemo(() => clamp(
        snapPoint(translateX, pan.velocity.x, snapPoints),
        multiply(add(index, 1), -width),
        multiply(sub(index, 1), -width),
    ), [width]);

    let previousIndex = currentIndex;
    const indexChanged = ([idx]: readonly number[]) => {
        if (idx !== previousIndex) {
            shouldEnableGestures([idx]);
            setCurrentIndex(idx);
            props.onPageSelected(idx);
            previousIndex = idx;
        }
    };

    let previousEnabled = enabled;
    const shouldEnableGestures = ([idx]: readonly number[]) => {
        const gestrues = isImage(files[idx]);

        if (gestrues !== previousEnabled) {
            setEnabled(gestrues);
            previousEnabled = gestrues;
        }

        if (isVideo(files[idx])) {
            setTapEnabled(false);
        } else {
            setTapEnabled(true);
        }
    };

    const renderItems = files.map((file, i) => {
        const isActive = eq(index, i);
        const itemProps = {
            file,
            deviceWidth: width,
            deviceHeight: height,
            theme: props.theme,
        };

        if (isImage(file)) {
            return (
                <View
                    key={file.id}
                    style={styles.item}
                >
                    <GalleryImage
                        style={{
                            backgroundColor: changeOpacity(props.theme.centerChannelColor, 0.08),
                            transform: [
                                {translateX: cond(isActive, translate.x, 0)},
                                {translateY: cond(isActive, translate.y, 0)},
                                {scale: cond(isActive, scale, 1)},
                            ],
                        }}
                        {...itemProps}
                    />
                </View>
            );
        } else if (isVideo(file)) {
            return (
                <View
                    key={file.id}
                    style={styles.item}
                >
                    <GalleryVideo
                        isActive={currentIndex === i}
                        showHideHeaderFooter={props.onTap}
                        {...itemProps}
                    />
                </View>
            );
        }

        return (
            <View
                key={file.id}
                style={styles.item}
            >
                <GalleryFile {...itemProps}/>
            </View>
        );
    });

    const handleTapGesture = (event: TapGestureHandlerStateChangeEvent) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            props.onTap();
        }
    };

    useEffect(() => {
        shouldEnableGestures([initialIndex]);
    }, []);

    usePinch({center, pan, pinch, translate, scale, minVec, maxVec, minImgVec, maxImgVec, translationX, translationY});

    useCode(
        () => [
            onChange(
                translationX,
                cond(eq(pan.state, State.ACTIVE), [
                    set(translateX, add(offsetX, translationX)),
                ]),
            ),
            onChange(
                translationY,
                cond(and(eq(pan.state, State.ACTIVE), neq(pan.translation.y, 0)), [
                    set(translateY, translationY),
                ]),
            ),
            cond(and(eq(pan.state, State.END), neq(translateY, 0)), [
                cond(greaterOrEq(abs(translateY), 50), [
                    cond(not(clockRunning(clock)), call([], props.onClose)),
                ], set(translateY, timing({from: translateY, to: 0}))),
            ]),
            cond(and(eq(pan.state, State.END), neq(translationX, 0)), [
                set(translateX, timing({clock, from: translateX, to: snapTo, duration: 250, easing: EasingNode.out(EasingNode.quad)})),
                set(offsetX, translateX),
                cond(not(clockRunning(clock)), [
                    vec.set(translate, 0),
                    set(index, ceil(divide(translateX, -width))),
                    call([abs(index)], indexChanged),
                ]),
            ]),
        ],
        [index],
    );

    useCode(() => [
        cond(eq(doubleTap.state, State.BEGAN), [
            set(zoomed, greaterThan(scale, 1)),
        ]),
        cond(eq(doubleTap.state, State.END), [
            cond(eq(zoomed, 1), [
                set(scale, timing({clock: zoomClock, from: scale, to: 1})),
                cond(not(clockRunning(zoomClock)), [
                    vec.set(translate, 0),
                    set(doubleTap.state, 0),
                ]),
            ]),
            cond(eq(zoomed, 0), [
                set(scale, timing({clock: zoomClock, from: scale, to: 3})),
                cond(not(clockRunning(zoomClock)), [
                    vec.set(translate, 0),
                    set(doubleTap.state, 0),
                ]),
            ]),
        ]),
    ], []);

    useCode(() => [
        set(top, timing({from: top, to: topValue})),
    ], [topValue]);

    return (
        <PinchGestureHandler
            ref={pinchRef}
            simultaneousHandlers={panRef}
            {...pinch.gestureHandler}
            enabled={enabled}
        >
            <Animated.View style={StyleSheet.absoluteFill}>
                <PanGestureHandler
                    ref={panRef}
                    minDist={5}
                    avgTouches={true}
                    simultaneousHandlers={pinchRef}
                    {...pan.gestureHandler}
                >
                    <Animated.View style={styles.container}>
                        <TapGestureHandler
                            maxDist={10}
                            numberOfTaps={1}
                            onHandlerStateChange={handleTapGesture}
                            simultaneousHandlers={[panRef, pinchRef]}
                            waitFor={doubleTapRef}
                            enabled={tapEnabled}
                        >
                            <View>
                                <TapGestureHandler
                                    numberOfTaps={2}
                                    simultaneousHandlers={[panRef, pinchRef]}
                                    {...doubleTap.gestureHandler}
                                    shouldCancelWhenOutside={true}
                                    ref={doubleTapRef}
                                    enabled={enabled}
                                    maxDist={10}
                                    maxDelayMs={200}
                                >
                                    <Animated.View
                                        style={[styles.items, {transform: [{translateX}, {translateY}], top}]}
                                    >
                                        {renderItems}
                                    </Animated.View>
                                </TapGestureHandler>
                            </View>
                        </TapGestureHandler>
                    </Animated.View>
                </PanGestureHandler>
            </Animated.View>
        </PinchGestureHandler>
    );
};

export default GalleryViewer;
