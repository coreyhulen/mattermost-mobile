// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Alert,
    BackHandler,
    ScrollView,
    Text,
    View,
    Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import RNFetchBlob from 'rn-fetch-blob';

import FormattedText from '@components/formatted_text';
import {MAX_FILE_COUNT, MAX_FILE_COUNT_WARNING, UPLOAD_FILES, PASTE_FILES} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {getFormattedFileSize} from '@mm-redux/utils/file_utils';
import EphemeralStore from '@store/ephemeral_store';
import {openGalleryAtIndex} from '@utils/gallery';
import {makeStyleSheetFromTheme} from '@utils/theme';

import UploadItem from './upload_item';

const showFiles = {opacity: 1, height: 68};
const hideFiles = {opacity: 0, height: 0};
const showError = {height: 20};
const hideError = {height: 0};

export default class Uploads extends PureComponent {
    static propTypes = {
        canUploadFiles: PropTypes.bool.isRequired,
        channelId: PropTypes.string.isRequired,
        channelIsLoading: PropTypes.bool,
        files: PropTypes.array.isRequired,
        filesUploadingForCurrentChannel: PropTypes.bool.isRequired,
        handleRemoveLastFile: PropTypes.func.isRequired,
        initUploadFiles: PropTypes.func.isRequired,
        maxFileSize: PropTypes.number.isRequired,
        rootId: PropTypes.string,
        screenId: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        files: [],
    };

    static contextTypes = {
        intl: intlShape,
    };

    state = {
        errorVisible: false,
        fileSizeWarning: null,
        showFileMaxWarning: false,
    };

    errorContainerRef = React.createRef();
    containerRef = React.createRef();
    hideErrorTimer = null;

    componentDidMount() {
        EventEmitter.on(MAX_FILE_COUNT_WARNING, this.handleFileMaxWarning);
        EventEmitter.on(UPLOAD_FILES, this.handleUploadFiles);
        EventEmitter.on(PASTE_FILES, this.handlePasteFiles);

        if (this.props.files.length) {
            this.showOrHideContainer();
        }

        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.handleAndroidBack);
        }
    }

    componentWillUnmount() {
        EventEmitter.off(MAX_FILE_COUNT_WARNING, this.handleFileMaxWarning);
        EventEmitter.off(UPLOAD_FILES, this.handleUploadFiles);
        EventEmitter.off(PASTE_FILES, this.handlePasteFiles);

        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.handleAndroidBack);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.files.length !== prevProps.files.length) {
            if (this.containerRef.current) {
                this.showOrHideContainer();
            }

            if (prevProps.files.length === MAX_FILE_COUNT && this.state.showFileMaxWarning) {
                this.hideError();
            }
        }
    }

    buildFilePreviews = () => {
        return this.props.files.map((file) => {
            return (
                <UploadItem
                    key={file.clientId}
                    channelId={this.props.channelId}
                    file={file}
                    onPress={this.onPress}
                    rootId={this.props.rootId}
                    theme={this.props.theme}
                />
            );
        });
    };

    onPress = (file) => {
        const {files} = this.props;
        const index = files.indexOf(file);
        openGalleryAtIndex(index, files.filter((f) => !f.failed && !f.loading));
    }

    clearErrorsFromState = () => {
        this.setState({
            errorVisible: false,
            showFileMaxWarning: false,
            fileSizeWarning: null,
        });
    }

    handleAndroidBack = () => {
        const {channelId, files, handleRemoveLastFile, rootId} = this.props;
        if (files.length) {
            handleRemoveLastFile(channelId, rootId);
            return true;
        }
        return false;
    };

    handleFileMaxWarning = () => {
        this.setState({showFileMaxWarning: true});
        if (this.errorContainerRef.current) {
            this.showError();
        }
    };

    handleFileSizeWarning = () => {
        if (this.errorContainerRef.current) {
            const {formatMessage} = this.context.intl;
            const message = formatMessage({
                id: 'file_upload.fileAbove',
                defaultMessage: 'Files must be less than {max}',
            }, {
                max: getFormattedFileSize({size: this.props.maxFileSize}),
            });

            this.setState({fileSizeWarning: message});
            this.showError();
        }
    };

    handlePasteFiles = (error, files) => {
        if (this.props.screenId !== EphemeralStore.getNavigationTopComponentId()) {
            return;
        }

        if (error) {
            this.showPasteFilesErrorDialog();
            return;
        }

        const {canUploadFiles, maxFileSize} = this.props;
        const availableCount = MAX_FILE_COUNT - this.props.files.length;

        if (!canUploadFiles) {
            this.handleUploadDisabled();
            return;
        }

        if (files.length > availableCount) {
            this.handleFileMaxWarning();
            return;
        }

        const largeFile = files.find((image) => image.fileSize > maxFileSize);
        if (largeFile) {
            this.handleFileSizeWarning();
            return;
        }

        this.handleUploadFiles(files);
    };

    handleUploadDisabled = () => {
        if (this.errorContainerRef.current) {
            const {formatMessage} = this.context.intl;
            const message = formatMessage({
                id: 'mobile.file_upload.disabled2',
                defaultMessage: 'File uploads from mobile are disabled.',
            }, {
                max: getFormattedFileSize({size: this.props.maxFileSize}),
            });

            this.setState({fileSizeWarning: message});
            this.showError();
        }
    };

    handleUploadFiles = async (files) => {
        if (this.props.screenId !== EphemeralStore.getNavigationTopComponentId()) {
            return;
        }

        let exceed = false;

        const totalFiles = files.length;
        let i = 0;
        while (i < totalFiles) {
            const file = files[i];
            if (!file.fileSize | !file.fileName) {
                const path = (file.path || file.uri).replace('file://', '');
                // eslint-disable-next-line no-await-in-loop
                const fileInfo = await RNFetchBlob.fs.stat(path);
                file.fileSize = fileInfo.size;
                file.fileName = fileInfo.filename;
            }

            if (file.fileSize > this.props.maxFileSize) {
                exceed = true;
                break;
            }

            i++;
        }

        if (exceed) {
            this.handleFileSizeWarning();
        } else {
            this.props.initUploadFiles(files, this.props.rootId);
            this.hideError();
        }
    };

    showError = () => {
        if (this.hideErrorTimer) {
            clearTimeout(this.hideErrorTimer);
        }

        this.makeErrorVisible(true);
        this.hideErrorTimer = setTimeout(this.hideError, 5000);
    }

    hideError = () => this.makeErrorVisible(false);

    makeErrorVisible = (visible) => {
        if (this.errorContainerRef.current) {
            if (visible && !this.state.errorVisible) {
                this.setState({errorVisible: true});
                this.errorContainerRef.current.transition(hideError, showError, 200, 'ease-out');
            } else if (!visible && this.state.errorVisible) {
                this.setState({errorVisible: false});
                this.errorContainerRef.current.transition(showError, hideError, 200, 'ease-in');
                this.clearErrorsFromState();
            }
        }
    }

    showOrHideContainer = () => {
        const {
            channelIsLoading,
            filesUploadingForCurrentChannel,
            files,
        } = this.props;

        if ((channelIsLoading || (!files.length && !filesUploadingForCurrentChannel))) {
            this.containerRef.current.transition(showFiles, hideFiles, 150, 'ease-out');
            this.shown = false;
        } else if (files.length && !this.shown) {
            this.containerRef.current.transition(hideFiles, showFiles, 350, 'ease-in');
            this.shown = true;
        }
    }

    showPasteFilesErrorDialog = () => {
        const {formatMessage} = this.context.intl;
        Alert.alert(
            formatMessage({
                id: 'mobile.files_paste.error_title',
                defaultMessage: 'Paste failed',
            }),
            formatMessage({
                id: 'mobile.files_paste.error_description',
                defaultMessage: 'An error occurred while pasting the file(s). Please try again.',
            }),
            [
                {
                    text: formatMessage({
                        id: 'mobile.files_paste.error_dismiss',
                        defaultMessage: 'Dismiss',
                    }),
                },
            ],
        );
    };

    render() {
        const {fileSizeWarning, showFileMaxWarning} = this.state;
        const {theme, files} = this.props;
        const style = getStyleSheet(theme);
        const fileContainerStyle = {
            paddingBottom: files.length ? 5 : 0,
        };

        return (
            <View style={style.previewContainer}>
                <Animatable.View
                    style={[style.fileContainer, fileContainerStyle]}
                    ref={this.containerRef}
                    isInteraction={true}
                >
                    <ScrollView
                        horizontal={true}
                        style={style.scrollView}
                        contentContainerStyle={style.scrollViewContent}
                        keyboardShouldPersistTaps={'handled'}
                    >
                        {this.buildFilePreviews()}
                    </ScrollView>
                </Animatable.View>
                <Animatable.View
                    ref={this.errorContainerRef}
                    style={style.errorContainer}
                    isInteraction={true}
                >
                    <View style={style.errorTextContainer}>
                        {showFileMaxWarning && (
                            <FormattedText
                                style={style.warning}
                                id='mobile.file_upload.max_warning'
                                defaultMessage='Uploads limited to 5 files maximum.'
                            />
                        )}
                        {Boolean(fileSizeWarning) &&
                            <Text style={style.warning}>
                                {fileSizeWarning}
                            </Text>
                        }
                    </View>
                </Animatable.View>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        previewContainer: {
            display: 'flex',
            flexDirection: 'column',
        },
        fileContainer: {
            display: 'flex',
            flexDirection: 'row',
            height: 0,
        },
        errorContainer: {
            height: 0,
        },
        errorTextContainer: {
            marginTop: Platform.select({
                ios: 4,
                android: 2,
            }),
            marginHorizontal: 12,
            flex: 1,
        },
        scrollView: {
            flex: 1,
        },
        scrollViewContent: {
            alignItems: 'flex-end',
            paddingRight: 12,
        },
        warning: {
            color: theme.errorTextColor,
            flex: 1,
            flexWrap: 'wrap',
        },
    };
});
