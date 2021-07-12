// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useNetInfo} from '@react-native-community/netinfo';

import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, AppState, AppStateStatus, Platform, StyleSheet, View} from 'react-native';
import Animated, {Easing, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {SafeAreaView} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {ViewTypes} from '@constants';
import PushNotifications from '@init/push_notifications';
import {debounce} from '@mm-redux/actions/helpers';
import {RequestStatus} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {t} from '@utils/i18n';
import networkConnectionListener, {checkConnection} from '@utils/network';

type Props = {
    channelId?: string;
    closeWebSocket: (shouldReconnect?: boolean) => void;
    errorCount: number | null;
    initWebSocket: (additionalOptions: {forceConnection: boolean}) => void;
    markChannelViewedAndReadOnReconnect: (channelId: string) => void;
    setCurrentUserStatusOffline: () => void;
    startPeriodicStatusUpdates: (forceStatusUpdate: boolean) => void;
    status: string;
    stopPeriodicStatusUpdates: () => void;
}

type AppStateCallBack = (appState: AppStateStatus) => Promise<void>;

type ConnectionChangedEvent = {
    hasInternet: boolean;
    serverReachable: boolean;
};

const MAX_WEBSOCKET_RETRIES = 3;
const CONNECTION_RETRY_SECONDS = 5;
const CONNECTION_RETRY_TIMEOUT = 1000 * CONNECTION_RETRY_SECONDS; // 5 seconds

const styles = StyleSheet.create({
    container: {
        height: ViewTypes.INDICATOR_BAR_HEIGHT,
        width: '100%',
        position: 'absolute',
        ...Platform.select({
            android: {
                elevation: 9,
            },
            ios: {
                zIndex: 9,
            },
        }),
    },
    wrapper: {
        alignItems: 'center',
        flex: 1,
        height: ViewTypes.INDICATOR_BAR_HEIGHT,
        flexDirection: 'row',
        paddingLeft: 12,
        paddingRight: 5,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    actionContainer: {
        alignItems: 'flex-end',
        height: 24,
        justifyContent: 'center',
        paddingRight: 10,
        width: 60,
    },
});

const colors = ['#939393', '#629a41'];
const stateChange = (callback: AppStateCallBack) => (Platform.OS === 'android' ? callback : debounce(callback, 300));

// For Gekidou the WS handler should be implemented with events instead.
// We should have a central place where we manage the WebSocket connections for each server
// and emit events so this component can React to them.
const NetworkIndicator = ({
    channelId, closeWebSocket, errorCount, initWebSocket, markChannelViewedAndReadOnReconnect,
    setCurrentUserStatusOffline, startPeriodicStatusUpdates, status, stopPeriodicStatusUpdates,
}: Props) => {
    const netinfo = useNetInfo();
    const firstRun = useRef(true);
    const clearNotificationTimeout = useRef<NodeJS.Timeout>();
    const retryTimeout = useRef<NodeJS.Timeout>();
    const bgColor = useSharedValue(0);
    const [connected, setConnected] = useState(true);
    const [translateY, setTranslateY] = useState(0);

    let i18nId;
    let defaultMessage;
    let action;

    const clearNotifications = () => {
        if (channelId) {
            PushNotifications.clearChannelNotifications(channelId);
            markChannelViewedAndReadOnReconnect(channelId);
        }
    };

    const hanleAnimationFinished = () => {
        EventEmitter.emit(ViewTypes.INDICATOR_BAR_VISIBLE, !connected);
    };

    const handleConnectionChange = ({hasInternet}: ConnectionChangedEvent) => {
        if (!firstRun.current) {
            if (!hasInternet) {
                setConnected(false);
            }
            handleWebSocket(hasInternet);
        }
    };

    const handleReconnect = () => {
        if (retryTimeout.current) {
            clearTimeout(retryTimeout.current);
        }

        retryTimeout.current = setTimeout(async () => {
            if (status !== RequestStatus.STARTED || status !== RequestStatus.SUCCESS) {
                const {serverReachable} = await checkConnection(netinfo.isInternetReachable);
                handleWebSocket(serverReachable);

                if (!serverReachable) {
                    handleReconnect();
                }
            }
        }, CONNECTION_RETRY_TIMEOUT);
    };

    const handleWebSocket = (connect: boolean) => {
        if (connect) {
            initWebSocket({forceConnection: true});
            startPeriodicStatusUpdates(true);
        } else {
            closeWebSocket(true);
            stopPeriodicStatusUpdates();
            setCurrentUserStatusOffline();
        }
    };

    useEffect(() => {
        handleWebSocket(true);
        firstRun.current = false;
    }, []);

    useEffect(() => {
        const networkListener = networkConnectionListener(handleConnectionChange);
        return () => networkListener.removeEventListener();
    }, []);

    useEffect(() => {
        return () => {
            handleWebSocket(false);
            if (retryTimeout.current) {
                clearTimeout(retryTimeout.current);
                retryTimeout.current = undefined;
            }
        };
    }, []);

    useEffect(() => {
        const handleAppStateChange = stateChange(async (appState: AppStateStatus) => {
            const active = appState === 'active';
            handleWebSocket(active);

            if (active) {
                // Clear the notifications for the current channel after one second
                // this is done so we can cancel it in case the app is brought to the
                // foreground by tapping a notification from another channel
                clearNotificationTimeout.current = setTimeout(clearNotifications, 1000);
            }
        });

        AppState.addEventListener('change', handleAppStateChange);

        return () => {
            AppState.removeEventListener('change', handleAppStateChange);
        };
    }, [netinfo.isInternetReachable]);

    useEffect(() => {
        if (clearNotificationTimeout.current) {
            clearTimeout(clearNotificationTimeout.current);
            clearNotificationTimeout.current = undefined;
        }
    }, [channelId]);

    useEffect(() => {
        if (status !== RequestStatus.SUCCESS && errorCount! >= 2) {
            setConnected(false);
        } else if (status === RequestStatus.SUCCESS) {
            setConnected(true);
        }
    }, [status, errorCount]);

    useEffect(() => {
        if (errorCount! > MAX_WEBSOCKET_RETRIES) {
            handleWebSocket(false);
            handleReconnect();
        }
    }, [errorCount]);

    useEffect(() => {
        const navbarChanged = (height: number) => {
            setTranslateY(height);
        };

        EventEmitter.on(ViewTypes.CHANNEL_NAV_BAR_CHANGED, navbarChanged);
        return () => EventEmitter.off(ViewTypes.CHANNEL_NAV_BAR_CHANGED, navbarChanged);
    }, [translateY]);

    const animatedStyle = useAnimatedStyle(() => {
        const onAnimation = (isFinished: boolean) => {
            if (isFinished) {
                runOnJS(hanleAnimationFinished)();
            }
        };

        bgColor.value = withTiming(connected ? 1 : 0, {duration: 100, easing: Easing.linear});
        return {
            backgroundColor: interpolateColor(
                bgColor.value,
                [0, 1],
                colors,
            ),
            transform: [{translateY: withTiming(connected ? 0 : translateY, {duration: 300}, onAnimation)}],
        };
    }, [connected, translateY]);

    if (netinfo.isInternetReachable) {
        if (connected) {
            i18nId = t('mobile.offlineIndicator.connected');
            defaultMessage = 'Connected';
            action = (
                <View style={styles.actionContainer}>
                    <CompassIcon
                        color='#FFFFFF'
                        name='check'
                        size={20}
                    />
                </View>
            );
        } else {
            i18nId = t('mobile.offlineIndicator.connecting');
            defaultMessage = 'Connecting...';
            action = (
                <View style={styles.actionContainer}>
                    <ActivityIndicator
                        color='#FFFFFF'
                        size='small'
                    />
                </View>
            );
        }
    } else {
        i18nId = t('mobile.offlineIndicator.offline');
        defaultMessage = 'No internet connection';
    }

    return (
        <Animated.View
            pointerEvents='none'
            style={[styles.container, animatedStyle]}
        >
            <SafeAreaView
                edges={['left', 'right']}
                style={styles.wrapper}
            >
                {Boolean(i18nId) &&
                <FormattedText
                    defaultMessage={defaultMessage}
                    id={i18nId}
                    style={styles.message}
                    testID='network_indicator.message'
                />
                }
                {action}
            </SafeAreaView>
        </Animated.View>
    );
};

export default NetworkIndicator;
