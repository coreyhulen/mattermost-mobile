// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {injectIntl} from 'react-intl';
import {NativeModules, Platform, StatusBar, StyleSheet} from 'react-native';
import {launchImageLibrary, ImageLibraryOptions} from 'react-native-image-picker';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {NavigationTypes} from '@constants';
import {ICON_SIZE, MAX_FILE_COUNT, MAX_FILE_COUNT_WARNING} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {lookupMimeType} from '@utils/file';
import {hasPhotoPermission} from '@utils/permission';
import {changeOpacity} from '@utils/theme';

import type {QuickActionAttachmentProps} from '@typings/components/post_draft_quick_action';

const ShareExtension = NativeModules.MattermostShare;

const style = StyleSheet.create({
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
});

const ImageQuickAction = ({disabled, fileCount = 0, intl, maxFileCount = MAX_FILE_COUNT, onUploadFiles, testID = '', theme}: QuickActionAttachmentProps) => {
    const attachFileFromLibrary = async () => {
        const selectionLimit = maxFileCount - fileCount;
        const options: ImageLibraryOptions = {
            selectionLimit,
            quality: 0.8,
            mediaType: 'mixed',
            includeBase64: false,
        };

        const hasPermission = await hasPhotoPermission(intl);

        if (hasPermission) {
            launchImageLibrary(options, async (response) => {
                StatusBar.setHidden(false);
                if (response.errorCode || response.didCancel) {
                    return;
                }

                if (response.assets.length > selectionLimit) {
                    EventEmitter.emit(MAX_FILE_COUNT_WARNING);
                    return;
                }

                const files = [];
                for await (const file of response.assets) {
                    if (Platform.OS === 'android') {
                        // For android we need to retrieve the realPath in case the file being imported is from the cloud
                        const uri = (await ShareExtension.getFilePath(file.uri)).filePath;
                        const type = file.type || lookupMimeType(uri);
                        let fileName = file.fileName;

                        if (type.includes('video/')) {
                            fileName = uri.split('\\').pop().split('/').pop();
                        }

                        if (uri) {
                            files.push({...file, fileName, uri, type});
                        }
                    } else {
                        // Decode file uri to get the actual path
                        files.push(file);
                    }
                }

                onUploadFiles(files);
            });
        }
    };

    const handleButtonPress = useCallback(() => {
        if (fileCount === maxFileCount) {
            EventEmitter.emit(MAX_FILE_COUNT_WARNING);
            return;
        }

        EventEmitter.emit(NavigationTypes.BLUR_POST_DRAFT);
        attachFileFromLibrary();
    }, [fileCount, maxFileCount]);

    const actionTestID = disabled ? `${testID}.disabled` : testID;
    const color = disabled ? changeOpacity(theme.centerChannelColor, 0.16) : changeOpacity(theme.centerChannelColor, 0.64);

    return (
        <TouchableWithFeedback
            testID={actionTestID}
            disabled={disabled}
            onPress={handleButtonPress}
            style={style.icon}
            type={'opacity'}
        >
            <CompassIcon
                color={color}
                name='image-outline'
                size={ICON_SIZE}
            />
        </TouchableWithFeedback>
    );
};

export default injectIntl(ImageQuickAction);

