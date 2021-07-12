// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {Platform, StatusBar, StatusBarStyle, StyleSheet, View} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFetchBlob, {FetchBlobResponse, StatefulPromise} from 'rn-fetch-blob';
import tinyColor from 'tinycolor2';

import ProgressBar from '@components/progress_bar';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {DeviceTypes} from '@constants';
import {getFileUrl} from '@mm-redux/utils/file_utils';
import {alertDownloadDocumentDisabled, alertDownloadFailed, alertFailedToOpenDocument} from '@utils/document';
import {getLocalFilePathFromFile} from '@utils/file';

import FileIcon from './file_icon';

import type {FileInfo} from '@mm-redux/types/files';
import type {Theme} from '@mm-redux/types/preferences';

type DocumentFileRef = {
    handlePreviewPress: () => void;
}

type DocumentFileProps = {
    backgroundColor?: string;
    canDownloadFiles: boolean;
    file: FileInfo;
    intl: typeof intlShape;
    theme: Theme;
}

const {DOCUMENTS_PATH} = DeviceTypes;
const styles = StyleSheet.create({
    progress: {
        justifyContent: 'flex-end',
        height: 48,
        left: 2,
        top: 5,
        width: 44,
    },
});

const DocumentFile = forwardRef<DocumentFileRef, DocumentFileProps>(({backgroundColor, canDownloadFiles, file, intl, theme}: DocumentFileProps, ref) => {
    const [didCancel, setDidCancel] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [preview, setPreview] = useState(false);
    const [progress, setProgress] = useState(0);
    const downloadTask = useRef<StatefulPromise<FetchBlobResponse>>();

    const cancelDownload = () => {
        setDidCancel(true);
        downloadTask.current?.cancel();
    };

    const downloadAndPreviewFile = async () => {
        const path = getLocalFilePathFromFile(DOCUMENTS_PATH, file);
        setDidCancel(false);

        try {
            const isDir = await RNFetchBlob.fs.isDir(DOCUMENTS_PATH);
            if (!isDir) {
                try {
                    await RNFetchBlob.fs.mkdir(DOCUMENTS_PATH);
                } catch (error) {
                    alertDownloadFailed(intl);
                    return;
                }
            }

            const options = {
                session: file.id,
                timeout: 10000,
                indicator: true,
                overwrite: true,
                path,
            };

            const exist = await RNFetchBlob.fs.exists(path!);
            if (exist) {
                openDocument();
            } else {
                setDownloading(true);
                downloadTask.current = RNFetchBlob.config(options).fetch('GET', getFileUrl(file.id));
                downloadTask.current.progress((received, total) => {
                    setProgress(parseFloat((received / total).toFixed(1)));
                });

                await downloadTask.current;
                setProgress(1);
                openDocument();
            }
        } catch (error) {
            RNFetchBlob.fs.unlink(path!);
            setDownloading(false);
            setProgress(0);

            if (error.message !== 'cancelled') {
                alertDownloadFailed(intl);
            }
        }
    };

    const handlePreviewPress = async () => {
        if (!canDownloadFiles) {
            alertDownloadDocumentDisabled(intl);
            return;
        }

        if (downloading && progress < 1) {
            cancelDownload();
        } else if (downloading) {
            setProgress(0);
            setDidCancel(true);
            setDownloading(false);
        } else {
            downloadAndPreviewFile();
        }
    };

    const onDonePreviewingFile = () => {
        setProgress(0);
        setDownloading(false);
        setPreview(false);
        setStatusBarColor();
    };

    const openDocument = () => {
        if (!didCancel && !preview) {
            const path = getLocalFilePathFromFile(DOCUMENTS_PATH, file);
            setPreview(true);
            setStatusBarColor('dark-content');
            FileViewer.open(path!, {
                displayName: file.name,
                onDismiss: onDonePreviewingFile,
                showOpenWithDialog: true,
                showAppsSuggestions: true,
            }).then(() => {
                setDownloading(false);
                setProgress(0);
            }).catch(() => {
                alertFailedToOpenDocument(file, intl);
                onDonePreviewingFile();
                RNFetchBlob.fs.unlink(path!);
            });
        }
    };

    const setStatusBarColor = (style: StatusBarStyle = 'light-content') => {
        if (Platform.OS === 'ios') {
            if (style) {
                StatusBar.setBarStyle(style, true);
            } else {
                const headerColor = tinyColor(theme.sidebarHeaderBg);
                let barStyle: StatusBarStyle = 'light-content';
                if (headerColor.isLight() && Platform.OS === 'ios') {
                    barStyle = 'dark-content';
                }
                StatusBar.setBarStyle(barStyle, true);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        handlePreviewPress,
    }), []);

    const icon = (
        <FileIcon
            backgroundColor={backgroundColor}
            file={file}
            theme={theme}
        />
    );

    let fileAttachmentComponent = icon;
    if (downloading) {
        fileAttachmentComponent = (
            <>
                {icon}
                <View style={[StyleSheet.absoluteFill, styles.progress]}>
                    <ProgressBar
                        progress={progress || 0.1}
                        color={theme.buttonBg}
                    />
                </View>
            </>
        );
    }

    return (
        <TouchableWithFeedback
            onPress={handlePreviewPress}
            type={'opacity'}
        >
            {fileAttachmentComponent}
        </TouchableWithFeedback>
    );
});

export default injectIntl(DocumentFile, {withRef: true});
