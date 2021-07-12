// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Clipboard from '@react-native-community/clipboard';

import React, {forwardRef, useEffect, useRef, useState, useImperativeHandle} from 'react';
import {injectIntl} from 'react-intl';
import {Animated, Easing, StyleSheet} from 'react-native';

import {Client4} from '@client/rest';
import {ATTACHMENT_DOWNLOAD} from '@constants/attachment';
import EventEmitter from '@mm-redux/utils/event_emitter';

import PrepareFile from './prepare_file';
import Summary from './summary';
import Toast from './toast';

import type {CallbackFunctionWithoutArguments, PrepareFileRef, FooterProps, FooterRef, ShowToast, ToastRef} from '@mm-types/screens/gallery';

const styles = StyleSheet.create({
    footer: {
        position: 'absolute',
        width: '100%',
        bottom: 0,
    },
});

const Footer = forwardRef<FooterRef, FooterProps>((props: FooterProps, ref) => {
    const [visible, setVisible] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const opacity = useRef(new Animated.Value(1)).current;
    const downloadingOpacitity = useRef(new Animated.Value(0)).current;
    const prepareRef = useRef<PrepareFileRef>(null);
    const toastRef = useRef<ToastRef>(null);

    const animate = (value: Animated.Value, show: boolean, callback?: () => void): Animated.CompositeAnimation => {
        const animation = Animated.timing(value, {
            toValue: show ? 1 : 0,
            duration: 200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
        });

        animation.start(callback);

        return animation;
    };

    const copyPublicLink = async (callback: CallbackFunctionWithoutArguments) => {
        try {
            const {formatMessage} = props.intl;
            const message = formatMessage({id: 'mobile.public_link.copied', defaultMessage: 'Public link copied'});
            const res = await Client4.getFilePublicLink(props.file.id);
            Clipboard.setString(res.link);
            showToast(message, 100, callback);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log('An error occurred, we should show a different toast', e);
            callback();
        }
    };

    const dowloadFile = (callback: CallbackFunctionWithoutArguments) => {
        setDownloading(true);
        callback();
    };

    const isVisible = () => visible;

    const showToast: ShowToast = (text, duration, callback) => {
        toastRef.current?.show(text, duration, callback);
    };

    const openOrShare = (share: boolean, callback: (path?: string) => void) => {
        animate(opacity, false, () => {
            animate(downloadingOpacitity, true, async () => {
                const path = await prepareRef.current?.start(props.file, share);
                animate(opacity, true);
                callback(path);
            });
        });
    };

    const startDownload = async (): Promise<string | undefined> => {
        let path;
        if (prepareRef.current) {
            path = await prepareRef.current.start(props.file);
        }
        setDownloading(false);

        return path;
    };

    const toggle = () => {
        if (!downloading) {
            setVisible(!visible);
            return !visible;
        }

        return false;
    };

    useEffect(() => {
        const animation = animate(opacity, visible);

        return animation.stop;
    }, [visible]);

    useEffect(() => {
        let animation: Animated.CompositeAnimation;
        if (downloading) {
            animate(opacity, false, () => {
                animation = animate(downloadingOpacitity, true, startDownload);
            });
        } else {
            animate(downloadingOpacitity, false, () => {
                animation = animate(opacity, true);
            });
        }

        return () => animation?.stop();
    }, [downloading]);

    useEffect(() => {
        EventEmitter.on(ATTACHMENT_DOWNLOAD, openOrShare);

        return () => {
            EventEmitter.off(ATTACHMENT_DOWNLOAD, openOrShare);
        };
    });

    useImperativeHandle(ref, () => ({
        isVisible,
        setVisible,
        toggle,
    }), [visible]);

    const translateY = opacity.interpolate({
        inputRange: [0, 1],
        outputRange: [99, 0],
    });

    const downloadingY = downloadingOpacitity.interpolate({
        inputRange: [0, 1],
        outputRange: [99, 0],
    });

    return (
        <>
            <Animated.View style={[{transform: [{translateY}], opacity}, styles.footer]}>
                <Summary
                    copyPublicLink={copyPublicLink}
                    dowloadFile={dowloadFile}
                    file={props.file}
                />
                <Toast ref={toastRef}/>
            </Animated.View>
            <Animated.View style={[{transform: [{translateY: downloadingY}], opacity: downloadingOpacitity}, styles.footer]}>
                <PrepareFile
                    ref={prepareRef}
                    intl={props.intl}
                />
            </Animated.View>
        </>
    );
});

Footer.displayName = 'Footer';

export default injectIntl(Footer, {withRef: true});
