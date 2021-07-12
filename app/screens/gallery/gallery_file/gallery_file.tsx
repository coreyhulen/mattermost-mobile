// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {injectIntl} from 'react-intl';
import {Alert, Appearance, Platform, Text, StatusBar, StatusBarStyle, View} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import {TapGestureHandler} from 'react-native-gesture-handler';
import tinyColor from 'tinycolor2';

import FileIcon from '@components//post_list/post/body/files/file_icon';
import Touchable from '@components/touchable_with_feedback';
import {ATTACHMENT_DOWNLOAD} from '@constants/attachment';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {isDocument} from '@utils/file';
import {preventDoubleTap} from '@utils/tap';
import {makeStyleSheetFromTheme} from '@utils/theme';

import type {GalleryItemProps} from '@mm-types/screens/gallery';

interface GalleryFileProps extends GalleryItemProps {
    canDownloadFiles: boolean;
}

const getStyles = makeStyleSheetFromTheme(({deviceHeight, deviceWidth, theme}: GalleryItemProps) => ({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        top: Platform.select({
            android: (deviceWidth > deviceHeight) ? -15 : 0,
        }),
    },
    filename: {
        color: '#FFFFFF',
        fontFamily: 'Open Sans',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        marginVertical: 8,
        paddingHorizontal: 16,
    },
    button: {
        alignItems: 'center',
        backgroundColor: theme?.buttonBg,
        borderRadius: 4,
        height: 48,
        justifyContent: 'center',
        marginTop: 16,
    },
    buttonShape: {
        paddingHorizontal: 20,
    },
    buttonText: {
        color: theme?.buttonColor,
        fontFamily: 'Open Sans',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    unsupported: {
        color: '#FFFFFF',
        fontFamily: 'Open Sans',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 26,
        marginTop: 10,
        paddingHorizontal: 16,
        opacity: 0.64,
    },
}));

const GalleryFile = (props: GalleryFileProps) => {
    const {canDownloadFiles, file, intl, theme} = props;
    const [enabled, setEnabled] = useState(true);
    const styles = getStyles(props);

    const action = useCallback(preventDoubleTap(() => {
        EventEmitter.emit(ATTACHMENT_DOWNLOAD, !isDocument(file), actionCallback);
    }), []);

    const actionCallback = (path?: string) => {
        if (isDocument(file) && path) {
            open(path);
        }

        setEnabled(true);
    };

    const open = (path: string) => {
        statusBar(true);
        FileViewer.open(path, {
            displayName: file.name,
            onDismiss: () => statusBar(),
            showOpenWithDialog: true,
            showAppsSuggestions: true,
        }).catch(() => {
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.document_preview.failed_title',
                    defaultMessage: 'Open Document failed',
                }),
                intl.formatMessage({
                    id: 'mobile.document_preview.failed_description',
                    defaultMessage: 'An error occurred while opening the document. Please make sure you have a {fileType} viewer installed and try again.\n',
                }, {
                    fileType: file.extension.toLowerCase(),
                }),
                [{
                    text: intl.formatMessage({
                        id: 'mobile.server_upgrade.button',
                        defaultMessage: 'OK',
                    }),
                }],
            );
            statusBar();
        });
    };

    const statusBar = (appearance?: boolean) => {
        if (appearance) {
            const style = Appearance.getColorScheme() === 'dark' ? 'light-content' : 'dark-content';
            StatusBar.setBarStyle(style, true);
        } else {
            const headerColor = tinyColor(props.theme?.sidebarHeaderBg);
            let barStyle: StatusBarStyle = 'light-content';
            if (headerColor.isLight()) {
                barStyle = 'dark-content';
            }
            StatusBar.setBarStyle(barStyle, true);
        }
    };

    let option;
    let unsupported;
    if (isDocument(file)) {
        option = intl.formatMessage({id: 'gallery.open_file', defaultMessage: 'Open file'});
    } else {
        option = intl.formatMessage({id: 'gallery.download_file', defaultMessage: 'Download file'});
        unsupported = intl.formatMessage({id: 'gallery.unsuppored', defaultMessage: 'Preview is not supported for this file type'});
    }

    return (
        <TapGestureHandler>
            <View style={styles.container}>
                <FileIcon
                    backgroundColor='transparent'
                    file={file}
                    iconSize={120}
                    iconColor={theme?.buttonBg}
                    theme={theme!}
                />
                <Text
                    numberOfLines={1}
                    style={styles.filename}
                >
                    {file.name}
                </Text>
                {Boolean(unsupported) &&
                <Text style={styles.unsupported}>{unsupported}</Text>
                }
                {canDownloadFiles &&
                <View style={styles.button}>
                    <Touchable
                        disabled={!enabled}
                        onPress={action}
                        type={Platform.OS === 'android' ? 'native' : 'opacity'}
                    >
                        <View style={styles.buttonShape}>
                            <Text style={styles.buttonText}>{option}</Text>
                        </View>
                    </Touchable>
                </View>
                }
            </View>
        </TapGestureHandler>
    );
};

export default injectIntl(GalleryFile);
