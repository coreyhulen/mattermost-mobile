// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef} from 'react';
import {View} from 'react-native';

import TouchableWithFeedback from '@components/touchable_with_feedback';
import {isDocument, isImage} from '@utils/file';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import DocumentFile from './document_file';
import FileIcon from './file_icon';
import FileInfo from './file_info';
import ImageFile from './image_file';
import ImageFileOverlay from './image_file_overlay';

import type {FileInfo as FileInfoType} from '@mm-redux/types/files';
import type {Theme} from '@mm-redux/types/preferences';

type FileProps = {
    canDownloadFiles: boolean;
    file: FileInfoType;
    index: number;
    inViewPort: boolean;
    isSingleImage: boolean;
    nonVisibleImagesCount: number;
    onPress: (index: number) => void;
    theme: Theme;
    wrapperWidth?: number;
};

type WrappedDocumentRef = {
    getWrappedInstance: () => ({
        handlePreviewPress: () => void;
    });
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        fileWrapper: {
            flex: 1,
            flexDirection: 'row',
            marginTop: 10,
            borderWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.4),
            borderRadius: 5,
        },
        iconWrapper: {
            marginTop: 7.8,
            marginRight: 6,
            marginBottom: 8.2,
            marginLeft: 8,
        },
    };
});

const File = ({
    canDownloadFiles, file, index = 0, inViewPort = false, isSingleImage = false,
    nonVisibleImagesCount = 0, onPress, theme, wrapperWidth = 300,
}: FileProps) => {
    const document = useRef<WrappedDocumentRef>();
    const style = getStyleSheet(theme);

    const handlePress = () => {
        onPress(index);
    };

    const handlePreviewPress = () => {
        if (document.current) {
            document.current.getWrappedInstance().handlePreviewPress();
        } else {
            handlePress();
        }
    };

    if (isImage(file)) {
        return (
            <TouchableWithFeedback
                onPress={handlePreviewPress}
                type={'opacity'}
            >
                <ImageFile
                    file={file}
                    inViewPort={inViewPort}
                    wrapperWidth={wrapperWidth}
                    isSingleImage={isSingleImage}
                    resizeMode={'cover'}
                    theme={theme}
                />
                {Boolean(nonVisibleImagesCount) &&
                <ImageFileOverlay
                    theme={theme}
                    value={nonVisibleImagesCount}
                />
                }
            </TouchableWithFeedback>
        );
    }

    if (isDocument(file)) {
        return (
            <View style={[style.fileWrapper]}>
                <View style={style.iconWrapper}>
                    <DocumentFile
                        ref={document}
                        canDownloadFiles={canDownloadFiles}
                        file={file}
                        theme={theme}
                    />
                </View>
                <FileInfo
                    file={file}
                    onPress={handlePreviewPress}
                    theme={theme}
                />
            </View>
        );
    }

    return (
        <View style={[style.fileWrapper]}>
            <View style={style.iconWrapper}>
                <TouchableWithFeedback
                    onPress={handlePreviewPress}
                    type={'opacity'}
                >
                    <FileIcon
                        file={file}
                        theme={theme}
                    />
                </TouchableWithFeedback>
            </View>
            <FileInfo
                file={file}
                onPress={handlePreviewPress}
                theme={theme}
            />
        </View>
    );
};

export default File;
