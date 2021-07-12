// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import FileIcon from '@components/post_list/post/body/files/file_icon';
import ProgressiveImage from '@components/progressive_image';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {useDidUpdate} from '@hooks';
import {usePermanentSidebar, useSplitView} from '@hooks/permanent_sidebar';
import {changeOpacity} from '@mm-redux/utils/theme_utils';
import {generateId} from '@utils/file';
import {openGallerWithMockFile} from '@utils/gallery';
import {calculateDimensions, getViewPortWidth, isGifTooLarge} from '@utils/images';
import {isImageLink, isValidUrl} from '@utils/url';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';

type ImagePreviewProps = {
    expandedLink?: string;
    getRedirectLocation: (link: string) => void;
    isReplyPost: boolean;
    link: string;
    post: Post;
    theme: Theme;
}

const styles = StyleSheet.create({
    imageContainer: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginBottom: 6,
        marginTop: 10,
    },
    image: {
        alignItems: 'center',
        borderRadius: 3,
        justifyContent: 'center',
        marginVertical: 1,
    },
});

const ImagePreview = ({expandedLink, getRedirectLocation, isReplyPost, link, post, theme}: ImagePreviewProps) => {
    const [error, setError] = useState(false);
    const fileId = useRef(generateId()).current;
    const [imageUrl, setImageUrl] = useState(expandedLink || link);
    const permanentSidebar = usePermanentSidebar();
    const splitView = useSplitView();
    const hasPemanentSidebar = !splitView && permanentSidebar;
    const imageProps = post.metadata.images[link];
    const dimensions = calculateDimensions(imageProps.height, imageProps.width, getViewPortWidth(isReplyPost, hasPemanentSidebar));

    const onError = useCallback(() => {
        setError(true);
    }, []);

    const onPress = useCallback(() => {
        openGallerWithMockFile(imageUrl, post.id, imageProps.height, imageProps.width, fileId);
    }, [imageUrl]);

    useEffect(() => {
        if (!isImageLink(link) && expandedLink === undefined) {
            getRedirectLocation(link);
        }
    }, [link]);

    useDidUpdate(() => {
        if (expandedLink) {
            setImageUrl(expandedLink);
        } else if (link !== imageUrl) {
            setImageUrl(link);
        }
    }, [link]);

    useEffect(() => {
        if (expandedLink && expandedLink !== imageUrl) {
            setImageUrl(expandedLink);
        }
    }, [expandedLink]);

    if (error || !isValidUrl(expandedLink || link) || isGifTooLarge(imageProps)) {
        return (
            <View style={[styles.imageContainer, {height: dimensions.height, borderWidth: 1, borderColor: changeOpacity(theme.centerChannelColor, 0.2)}]}>
                <View style={[styles.image, {width: dimensions.width, height: dimensions.height}]}>
                    <FileIcon
                        failed={true}
                        theme={theme}
                    />
                </View>
            </View>
        );
    }

    // Note that the onPress prop of TouchableWithoutFeedback only works if its child is a View
    return (
        <TouchableWithFeedback
            onPress={onPress}
            style={[styles.imageContainer, {height: dimensions.height}]}
            type={'none'}
        >
            <View>
                <ProgressiveImage
                    id={fileId}
                    style={[styles.image, {width: dimensions.width, height: dimensions.height}]}
                    imageUri={imageUrl}
                    resizeMode='contain'
                    onError={onError}
                />
            </View>
        </TouchableWithFeedback>
    );
};

export default ImagePreview;
