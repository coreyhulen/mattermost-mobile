// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {injectIntl} from 'react-intl';
import {Dimensions, StatusBar, StyleSheet} from 'react-native';
import {launchCamera, CameraOptions} from 'react-native-image-picker';

import {showModalOverCurrentContext} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {NavigationTypes} from '@constants';
import {ICON_SIZE, MAX_FILE_COUNT_WARNING} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {hasCameraPermission} from '@utils/permission';
import {changeOpacity} from '@utils/theme';

import CameraType from './camera_type';

import type {QuickActionAttachmentProps} from '@typings/components/post_draft_quick_action';

const style = StyleSheet.create({
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
});

const CameraQuickAction = ({disabled, fileCount, intl, maxFileCount, onUploadFiles, testID, theme}: QuickActionAttachmentProps) => {
    const attachFileFromCamera = async (options: CameraOptions) => {
        EventEmitter.emit(NavigationTypes.CLOSE_SLIDE_UP);
        const hasPermission = await hasCameraPermission(intl);

        if (hasPermission) {
            launchCamera(options, (response) => {
                StatusBar.setHidden(false);
                if (response.errorCode || response.didCancel) {
                    return;
                }

                onUploadFiles(response.assets);
            });
        }
    };

    const handleButtonPress = useCallback(() => {
        if (fileCount === maxFileCount) {
            EventEmitter.emit(MAX_FILE_COUNT_WARNING);
            return;
        }

        EventEmitter.emit(NavigationTypes.BLUR_POST_DRAFT);

        const passProps = {
            allowStayMiddle: false,
            children: (
                <CameraType
                    onPress={attachFileFromCamera}
                    theme={theme}
                />
            ),
            marginFromTop: Dimensions.get('window').height - 210,
            theme,
        };

        showModalOverCurrentContext('SlideUp', passProps);
    }, [fileCount, maxFileCount]);

    const actionTestID = disabled ? `${testID}.disabled` : testID;
    const color = disabled ? changeOpacity(theme.centerChannelColor, 0.16) : changeOpacity(theme.centerChannelColor, 0.64);

    return (
        <>
            <TouchableWithFeedback
                testID={actionTestID}
                disabled={disabled}
                onPress={handleButtonPress}
                style={style.icon}
                type={'opacity'}
            >
                <CompassIcon
                    color={color}
                    name='camera-outline'
                    size={ICON_SIZE}
                />
            </TouchableWithFeedback>
        </>
    );
};

export default injectIntl(CameraQuickAction);

