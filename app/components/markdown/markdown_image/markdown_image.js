// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Clipboard from '@react-native-community/clipboard';

import PropTypes from 'prop-types';
import React from 'react';
import {intlShape} from 'react-intl';
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import parseUrl from 'url-parse';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import ImageViewPort from '@components/image_viewport';
import ProgressiveImage from '@components/progressive_image';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import mattermostManaged from '@mattermost-managed';
import EphemeralStore from '@store/ephemeral_store';
import BottomSheet from '@utils/bottom_sheet';
import {generateId} from '@utils/file';
import {openGalleryAtIndex} from '@utils/gallery';
import {calculateDimensions, getViewPortWidth, isGifTooLarge} from '@utils/images';
import {normalizeProtocol, tryOpenURL} from '@utils/url';

const ANDROID_MAX_HEIGHT = 4096;
const ANDROID_MAX_WIDTH = 4096;

export default class MarkdownImage extends ImageViewPort {
    static propTypes = {
        children: PropTypes.node,
        disable: PropTypes.bool,
        errorTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        imagesMetadata: PropTypes.object,
        isReplyPost: PropTypes.bool,
        linkDestination: PropTypes.string,
        postId: PropTypes.string,
        source: PropTypes.string.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);

        const metadata = props.imagesMetadata?.[props.source] || Object.values(props.imagesMetadata || {})[0];
        this.fileId = generateId();
        this.state = {
            originalHeight: metadata?.height || 0,
            originalWidth: metadata?.width || 0,
            failed: isGifTooLarge(metadata),
            uri: null,
        };
    }

    getFileInfo = () => {
        const {originalHeight, originalWidth} = this.state;
        const link = decodeURIComponent(this.getSource());
        let filename = parseUrl(link.substr(link.lastIndexOf('/'))).pathname.replace('/', '');
        let extension = filename.split('.').pop();

        if (extension === filename) {
            const ext = filename.indexOf('.') === -1 ? '.png' : filename.substring(filename.lastIndexOf('.'));
            filename = `${filename}${ext}`;
            extension = ext;
        }

        return {
            id: this.fileId,
            name: filename,
            extension,
            has_preview_image: true,
            post_id: this.props.postId,
            uri: link,
            width: originalWidth,
            height: originalHeight,
        };
    };

    getSource = () => {
        let uri = this.props.source;

        if (uri.startsWith('/')) {
            uri = EphemeralStore.currentServerUrl + uri;
        }

        return uri;
    };

    handleSizeReceived = (width, height) => {
        if (!this.mounted) {
            return;
        }

        if (!width || !height) {
            this.setState({failed: true});
            return;
        }

        this.setState({
            failed: false,
            originalHeight: height,
            originalWidth: width,
        });
    };

    handleSizeFailed = () => {
        if (!this.mounted) {
            return;
        }

        this.setState({
            failed: true,
        });
    };

    handleLinkPress = () => {
        const url = normalizeProtocol(this.props.linkDestination);
        const {intl} = this.context;

        const onError = () => {
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.link.error.title',
                    defaultMessage: 'Error',
                }),
                intl.formatMessage({
                    id: 'mobile.link.error.text',
                    defaultMessage: 'Unable to open the link.',
                }),
            );
        };

        tryOpenURL(url, onError);
    };

    handleLinkLongPress = async () => {
        const {formatMessage} = this.context.intl;

        const config = mattermostManaged.getCachedConfig();

        if (config?.copyAndPasteProtection !== 'true') {
            const cancelText = formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'});
            const actionText = formatMessage({id: 'mobile.markdown.link.copy_url', defaultMessage: 'Copy URL'});
            BottomSheet.showBottomSheetWithOptions({
                options: [actionText, cancelText],
                cancelButtonIndex: 1,
            }, (value) => {
                if (value !== 1) {
                    this.handleLinkCopy();
                }
            });
        }
    };

    handleLinkCopy = () => {
        Clipboard.setString(this.props.linkDestination || this.props.source);
    };

    handlePreviewImage = () => {
        if (this.props.disable) {
            return;
        }

        const files = [this.getFileInfo()];
        openGalleryAtIndex(0, files);
    };

    render() {
        let image = null;
        const fileInfo = this.getFileInfo();
        const {height, width} = calculateDimensions(fileInfo.height, fileInfo.width, getViewPortWidth(this.props.isReplyPost, this.hasPermanentSidebar()));

        if (this.state.failed) {
            image = (
                <CompassIcon
                    name='jumbo-attachment-image-broken'
                    size={24}
                />
            );
        } else if (width && height) {
            if (Platform.OS === 'android' && (width > ANDROID_MAX_WIDTH || height > ANDROID_MAX_HEIGHT)) {
                // Android has a cap on the max image size that can be displayed

                image = (
                    <Text style={this.props.errorTextStyle}>
                        <FormattedText
                            id='mobile.markdown.image.too_large'
                            defaultMessage='Image exceeds max dimensions of {maxWidth} by {maxHeight}:'
                            values={{
                                maxWidth: ANDROID_MAX_WIDTH,
                                maxHeight: ANDROID_MAX_HEIGHT,
                            }}
                        />
                        {' '}
                        {this.props.children}
                    </Text>
                );
            } else {
                // React Native complains if we try to pass resizeMode as a style
                let source = null;
                if (fileInfo.uri) {
                    source = {uri: fileInfo.uri};
                }

                image = (
                    <TouchableWithFeedback
                        onLongPress={this.handleLinkLongPress}
                        onPress={this.handlePreviewImage}
                        style={{width, height}}
                    >
                        <ProgressiveImage
                            id={fileInfo.id}
                            defaultSource={source}
                            resizeMode='contain'
                            style={{width, height}}
                        />
                    </TouchableWithFeedback>
                );
            }
        }

        if (image && this.props.linkDestination) {
            image = (
                <TouchableWithFeedback
                    onPress={this.handleLinkPress}
                    onLongPress={this.handleLinkLongPress}
                >
                    {image}
                </TouchableWithFeedback>
            );
        }

        return (
            <View
                style={style.container}
                testID='markdown_image'
            >
                {image}
            </View>
        );
    }
}

const style = StyleSheet.create({
    container: {
        marginBottom: 5,
    },
    brokenImageIcon: {
        width: 24,
        height: 24,
    },
});
