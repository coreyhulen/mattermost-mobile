// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {PanGestureHandler} from 'react-native-gesture-handler';
import {Navigation} from 'react-native-navigation';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch} from 'react-redux';

import {popToRoot, dismissAllModals, dismissOverlay} from '@actions/navigation';
import {loadFromPushNotification} from '@actions/views/root';
import {NavigationTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {changeOpacity} from '@utils/theme';

import NotificationIcon from './notification_icon';
import NotificationTitle from './notification_title';

interface NotificationProps {
    componentId: string;
    notification: NotificationWithData;
}

interface SlideAnimation extends Animatable.CustomAnimation {
    from: {
        translateY: number;
    };
    to: {
        translateY: number;
    };
}

const AUTO_DISMISS_TIME_MILLIS = 5000;

const initialAnimation: SlideAnimation = {
    from: {
        translateY: -100,
    },
    to: {
        translateY: 0,
    },
};

const Notification = ({componentId, notification}: NotificationProps) => {
    const [animation, setAnimation] = useState<SlideAnimation>(initialAnimation);
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
    const tapped = useRef<boolean>(false);

    const animateDismissOverlay = () => {
        cancelDismissTimer();
        setAnimation({
            from: {
                translateY: 0,
            },
            to: {
                translateY: -100,
            },
        });
        dismissTimerRef.current = setTimeout(dismiss, 1000);
    };

    const cancelDismissTimer = () => {
        if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
        }
    };

    const dismiss = () => {
        cancelDismissTimer();
        dismissOverlay(componentId);
    };

    const notificationTapped = () => {
        tapped.current = true;
        EventEmitter.emit(NavigationTypes.CLOSE_MAIN_SIDEBAR);
        EventEmitter.emit(NavigationTypes.CLOSE_SETTINGS_SIDEBAR);
        dismiss();

        if (!notification.payload?.userInfo?.local) {
            dispatch(loadFromPushNotification(notification));
        }
    };

    useEffect(() => {
        dismissTimerRef.current = setTimeout(() => {
            if (!tapped.current) {
                animateDismissOverlay();
            }
        }, AUTO_DISMISS_TIME_MILLIS);

        return cancelDismissTimer;
    }, []);

    useEffect(() => {
        const didDismissListener = Navigation.events().registerComponentDidDisappearListener(async ({componentId: screen}) => {
            if (componentId === screen && tapped.current) {
                await dismissAllModals();
                await popToRoot();
            }
        });

        return () => {
            didDismissListener.remove();
        };
    }, []);

    useEffect(() => {
        EventEmitter.on(NavigationTypes.NAVIGATION_SHOW_OVERLAY, dismiss);

        return () => EventEmitter.off(NavigationTypes.NAVIGATION_SHOW_OVERLAY, dismiss);
    }, []);

    const message = notification.payload?.body || notification.payload?.message;

    return (
        <PanGestureHandler
            onGestureEvent={animateDismissOverlay}
            minOffsetY={-20}
        >
            <Animatable.View
                duration={250}
                style={[styles.container, {height: (styles.container.height || 0) + (insets.top / 2), paddingTop: (insets.top / 2)}]}
                useNativeDriver={true}
                animation={animation}
                testID='in_app_notification.screen'
            >
                <View style={styles.flex}>
                    <TouchableOpacity
                        style={styles.touchable}
                        onPress={notificationTapped}
                        activeOpacity={1}
                    >
                        <NotificationIcon
                            fromWebhook={notification.payload?.from_webhook === 'true'}
                            senderId={notification.payload?.sender_id || ''}
                            useUserIcon={notification.payload?.use_user_icon === 'true'}
                            overrideIconUrl={notification.payload?.override_icon_url}
                        />
                        <View style={styles.titleContainer}>
                            <NotificationTitle channelName={notification.payload?.channel_name || ''}/>
                            <View style={styles.flex}>
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode='tail'
                                    style={styles.message}
                                    testID='in_app_notification.message'
                                >
                                    {message}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </Animatable.View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-start',
        backgroundColor: changeOpacity('#000', 1),
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 10,
        width: '100%',
        ...Platform.select({
            android: {
                height: 68,
            },
            ios: {
                height: 88,
            },
        }),
    },
    flex: {
        flex: 1,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
        alignItems: 'flex-start',
        marginLeft: 10,
        ...Platform.select({
            android: {
                marginTop: 5,
                height: 50,
            },
            ios: {
                paddingTop: 37,
            },
        }),
    },
    touchable: {
        flex: 1,
        flexDirection: 'row',
    },
});

export default Notification;
