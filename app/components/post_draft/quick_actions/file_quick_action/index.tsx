// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {injectIntl} from 'react-intl';
import {NativeModules, Platform, StyleSheet} from 'react-native';
import DocumentPicker from 'react-native-document-picker';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {NavigationTypes} from '@constants';
import {ICON_SIZE, MAX_FILE_COUNT, MAX_FILE_COUNT_WARNING} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {hasStoragePermission} from '@utils/permission';
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

const FileQuickAction = ({disabled, fileCount = 0, intl, maxFileCount = MAX_FILE_COUNT, onUploadFiles, testID = '', theme}: QuickActionAttachmentProps) => {
    const attachFileFromFiles = async () => {
        const hasPermission = await hasStoragePermission(intl);
        const browseFileTypes = DocumentPicker.types.allFiles;

        if (hasPermission) {
            try {
                const res = await DocumentPicker.pickMultiple({type: [browseFileTypes]});
                const files = [];
                for await (const file of res) {
                    if (Platform.OS === 'android') {
                        // For android we need to retrieve the realPath in case the file being imported is from the cloud
                        const newUri = await ShareExtension.getFilePath(file.uri);
                        if (newUri) {
                            files.push({uri: newUri.filePath});
                        }
                    } else {
                        // Decode file uri to get the actual path
                        files.push({uri: decodeURIComponent(file.uri)});
                    }
                }

                if ((fileCount + files.length) > maxFileCount) {
                    EventEmitter.emit(MAX_FILE_COUNT_WARNING);
                    return;
                }

                onUploadFiles(files);
            } catch (error) {
                // Do nothing
            }
        }
    };

    const handleButtonPress = useCallback(() => {
        if (fileCount === maxFileCount) {
            EventEmitter.emit(MAX_FILE_COUNT_WARNING);
            return;
        }

        EventEmitter.emit(NavigationTypes.BLUR_POST_DRAFT);
        attachFileFromFiles();
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
                name='file-document-outline'
                size={ICON_SIZE}
            />
        </TouchableWithFeedback>
    );
};

export default injectIntl(FileQuickAction);
