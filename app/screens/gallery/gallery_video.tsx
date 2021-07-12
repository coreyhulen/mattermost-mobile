// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {injectIntl} from 'react-intl';
import {Alert, Platform, View} from 'react-native';
import {TapGestureHandler, State, TapGestureHandlerStateChangeEvent} from 'react-native-gesture-handler';
import Video, {OnLoadData, OnProgressData} from 'react-native-video';
import RNFetchBlob from 'rn-fetch-blob';

import {Client4} from '@client/rest';
import {DeviceTypes} from '@constants';
import {GalleryItemProps} from '@mm-types/screens/gallery';
import {getLocalPath} from '@utils/file';

import VideoControls, {VideoControlsRef} from './video_controls';

const GalleryVideo = ({file, deviceHeight, deviceWidth, intl, isActive, showHideHeaderFooter, theme}: GalleryItemProps) => {
    const statusBar = DeviceTypes.IS_IPHONE_WITH_INSETS ? 0 : 20;
    const width = deviceWidth;
    const height = deviceHeight - statusBar;

    const [uri, setUri] = useState(file.localPath);
    const [paused, setPaused] = useState(true);
    const videoRef = useRef<Video>(null);
    const controlsRef = useRef<VideoControlsRef>(null);
    const onPlayPause = () => {
        setPaused(!paused);
    };

    const onSeek = (seek: number) => {
        videoRef.current?.seek(seek);
        controlsRef.current?.showControls(!paused);
    };

    const singleTap = (e: TapGestureHandlerStateChangeEvent) => {
        if (e.nativeEvent.state === State.ACTIVE) {
            controlsRef.current?.showControls(!paused);
        }
    };

    const videoEnded = () => {
        setPaused(true);
        controlsRef.current?.showControls(false);
        const requested = requestAnimationFrame(() => {
            videoRef.current?.seek(0);
            cancelAnimationFrame(requested);
        });
    };

    const videoError = useCallback(() => {
        Alert.alert(
            intl.formatMessage({
                id: 'mobile.video_playback.failed_title',
                defaultMessage: 'Video playback failed',
            }),
            intl.formatMessage({
                id: 'mobile.video_playback.failed_description',
                defaultMessage: 'An error occurred while trying to play the video.\n',
            }),
            [{
                text: intl.formatMessage({
                    id: 'mobile.server_upgrade.button',
                    defaultMessage: 'OK',
                }),
            }],
        );
    }, []);

    const videoLoaded = (data: OnLoadData) => {
        controlsRef.current?.videoDuration(data.duration);
    };

    const videoProgress = (data: OnProgressData | number) => {
        let progress: number;
        if (typeof data === 'object') {
            progress = data.currentTime;
        } else {
            progress = data;
        }
        controlsRef.current?.videoProgress(progress);
    };

    useEffect(() => {
        const getUriFromFile = async () => {
            if (!uri) {
                const localPath = getLocalPath(file);
                const prefix = Platform.OS === 'android' ? 'file:/' : '';
                const exist = await RNFetchBlob.fs.exists(`${prefix}${localPath}`);
                setUri(exist ? localPath : Client4.getFileUrl(file.id, Date.now()));
            }
        };

        getUriFromFile();
    }, []);

    useEffect(() => {
        if (!isActive) {
            setPaused(true);
        }
    }, [isActive]);

    if (!uri || !isActive) {
        return null;
    }

    return (
        <>
            <TapGestureHandler
                numberOfTaps={1}
                onHandlerStateChange={singleTap}
            >
                <View>
                    <Video
                        ref={videoRef}
                        style={{width, height}}
                        resizeMode='contain'
                        source={{uri}}
                        volume={1.0}
                        paused={paused}
                        controls={false}
                        onEnd={videoEnded}
                        onLoad={videoLoaded}
                        onProgress={videoProgress}
                        onError={videoError}
                    />
                </View>
            </TapGestureHandler>
            <VideoControls
                ref={controlsRef}
                mainColor={theme?.buttonBg}
                isLandscape={width > height}
                paused={paused}
                onPlayPause={onPlayPause}
                onSeek={onSeek}
                showHideHeaderFooter={showHideHeaderFooter}
            />
        </>
    );
};

export default injectIntl(GalleryVideo);
