// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

import {Client4} from '@client/rest';
import FileIcon from '@components//post_list/post/body/files/file_icon';
import ImageFile from '@components/post_list/post/body/files/image_file';
import ProgressBar from '@components/progress_bar';
import {analytics} from '@init/analytics.ts';
import {buildFileUploadData, encodeHeaderURIStringToUTF8, isImage} from '@utils/file';
import {emptyFunction} from '@utils/general';
import ImageCacheManager from '@utils/image_cache_manager';
import {changeOpacity} from '@utils/theme';

import mattermostBucket from 'app/mattermost_bucket';

import UploadRemove from './upload_remove';
import UploadRetry from './upload_retry';

export default class UploadItem extends PureComponent {
    static propTypes = {
        channelId: PropTypes.string.isRequired,
        file: PropTypes.object.isRequired,
        handleRemoveFile: PropTypes.func.isRequired,
        onPress: PropTypes.func,
        retryFileUpload: PropTypes.func.isRequired,
        rootId: PropTypes.string,
        theme: PropTypes.object.isRequired,
        uploadComplete: PropTypes.func.isRequired,
        uploadFailed: PropTypes.func.isRequired,
    };

    state = {
        progress: 0,
    };

    componentDidMount() {
        const {file} = this.props;
        if (file.loading) {
            this.downloadAndUploadFile(file);
        }
    }

    componentDidUpdate(prevProps) {
        const {file: prevFile} = prevProps;
        const {file} = this.props;

        if (prevFile.failed !== file.failed && file.loading) {
            this.downloadAndUploadFile(file);
        }
    }

    handlePress = () => {
        this.props.onPress(this.props.file);
    }

    handleRetryFileUpload = (file) => {
        if (!file.failed) {
            return;
        }

        this.props.retryFileUpload(file, this.props.rootId);
    };

    handleRemoveFile = (clientId, channelId, rootId) => {
        const {handleRemoveFile} = this.props;
        if (this.uploadPromise) {
            this.uploadPromise.cancel(() => {
                this.canceled = true;
                handleRemoveFile(clientId, channelId, rootId);
            });
        } else {
            handleRemoveFile(clientId, channelId, rootId);
        }
    };

    handleUploadCompleted = (res) => {
        const {channelId, file, rootId, uploadComplete, uploadFailed} = this.props;
        const response = JSON.parse(res.data);
        if (res.respInfo.status === 200 || res.respInfo.status === 201) {
            const data = response.file_infos.map((f) => {
                return {
                    ...f,
                    clientId: file.clientId,
                };
            });
            uploadComplete(data, channelId, rootId);
        } else {
            uploadFailed([file.clientId], channelId, rootId, response.message);
        }
        this.uploadPromise = null;
    };

    handleUploadError = (error) => {
        const {channelId, file, rootId, uploadFailed} = this.props;
        if (!this.canceled) {
            uploadFailed([file.clientId], channelId, rootId, error);
        }
        this.uploadPromise = null;
    };

    handleUploadProgress = (loaded, total) => {
        const progress = parseFloat((loaded / total).toFixed(1));
        this.setState({progress});
    };

    downloadAndUploadFile = async (file) => {
        const newFile = {...file};
        if (newFile.localPath.startsWith('http')) {
            try {
                newFile.localPath = await ImageCacheManager.cache(newFile.name, newFile.localPath, emptyFunction);
            } catch (e) {
                this.handleUploadError(e);
                return;
            }
        }

        this.uploadFile(newFile);
    }

    uploadFile = async (file) => {
        const {channelId} = this.props;
        const fileData = buildFileUploadData(file);

        const headers = {
            ...Client4.getOptions({method: 'post'}).headers,
            'Content-Type': 'multipart/form-data',
        };

        const fileInfo = {
            name: 'files',
            filename: encodeHeaderURIStringToUTF8(fileData.name),
            data: RNFetchBlob.wrap(file.localPath.replace('file://', '')),
            type: fileData.type,
        };

        const data = [
            {name: 'channel_id', data: channelId},
            {name: 'client_ids', data: file.clientId},
            fileInfo,
        ];

        analytics.trackAPI('api_files_upload');

        const certificate = await mattermostBucket.getPreference('cert');
        const options = {
            timeout: 60000,
            certificate,
        };
        this.uploadPromise = RNFetchBlob.config(options).fetch('POST', Client4.getFilesRoute(), headers, data);
        this.uploadPromise.uploadProgress(this.handleUploadProgress);
        this.uploadPromise.then(this.handleUploadCompleted).catch(this.handleUploadError);
    };

    render() {
        const {
            channelId,
            file,
            rootId,
            theme,
        } = this.props;
        const {progress} = this.state;
        let filePreviewComponent;

        if (isImage(file)) {
            filePreviewComponent = (
                <TouchableOpacity onPress={this.handlePress}>
                    <View style={styles.filePreview}>
                        <ImageFile
                            file={file}
                            theme={theme}
                            resizeMode='cover'
                        />
                    </View>
                </TouchableOpacity>
            );
        } else {
            filePreviewComponent = (
                <TouchableOpacity onPress={this.handlePress}>
                    <View style={styles.filePreview}>
                        <FileIcon
                            backgroundColor={changeOpacity(theme.centerChannelColor, 0.08)}
                            iconSize={60}
                            file={file}
                            theme={theme}
                        />
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View
                key={file.clientId}
                style={styles.preview}
            >
                <View style={styles.previewContainer}>
                    {filePreviewComponent}
                    {file.failed &&
                    <UploadRetry
                        file={file}
                        onPress={this.handleRetryFileUpload}
                    />
                    }
                    {file.loading && !file.failed &&
                    <View style={styles.progress}>
                        <ProgressBar
                            progress={progress}
                            color={this.props.theme.buttonBg}
                        />
                    </View>
                    }
                </View>
                <UploadRemove
                    theme={this.props.theme}
                    channelId={channelId}
                    clientId={file.clientId}
                    onPress={this.handleRemoveFile}
                    rootId={rootId}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    preview: {
        paddingTop: 5,
        marginLeft: 12,
    },
    previewContainer: {
        height: 56,
        width: 56,
        borderRadius: 4,
    },
    progress: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        height: 53,
        width: 53,
        justifyContent: 'flex-end',
        position: 'absolute',
        borderRadius: 4,
        paddingLeft: 3,
    },
    filePreview: {
        width: 56,
        height: 56,
    },
});
