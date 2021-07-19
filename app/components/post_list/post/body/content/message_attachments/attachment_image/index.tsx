// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef, useState} from 'react';
import {View} from 'react-native';

import FileIcon from '@components/post_list/post/body/files/file_icon';
import ProgressiveImage from '@components/progressive_image';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {usePermanentSidebar, useSplitView} from '@hooks/permanent_sidebar';
import {generateId} from '@utils/file';
import {isGifTooLarge, calculateDimensions, getViewPortWidth} from '@utils/images';
import {openGallerWithMockFile} from '@utils/gallery';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {isSVGLink, isValidUrl} from '@utils/url';

import type {Theme} from '@mm-redux/types/preferences';
import type {PostImage} from '@mm-redux/types/posts';
import {SVG_DEFAULT_HEIGHT, SVG_DEFAULT_WIDTH} from '@constants/image';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        attachmentMargin: {
            marginTop: 2.5,
            marginLeft: 2.5,
            marginBottom: 5,
            marginRight: 5,
        },
        container: {marginTop: 5},
        imageContainer: {
            borderColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderWidth: 1,
            borderRadius: 2,
            flex: 1,
        },
        image: {
            alignItems: 'center',
            borderRadius: 3,
            justifyContent: 'center',
            marginVertical: 1,
        },
    };
});

export type Props = {
    imageMetadata?: PostImage;
    imageUrl: string;
    postId: string;
    theme: Theme;
}

const AttachmentImage = ({imageUrl, imageMetadata = {width: 0, height: 0}, postId, theme}: Props) => {
    const [error, setError] = useState(false);
    const fileId = useRef(generateId()).current;
    const permanentSidebar = usePermanentSidebar();
    const splitView = useSplitView();
    const hasPemanentSidebar = !splitView && permanentSidebar;
    const {height, width} = calculateDimensions(imageMetadata.height, imageMetadata.width, getViewPortWidth(false, hasPemanentSidebar));
    const style = getStyleSheet(theme);

    const onError = useCallback(() => {
        setError(true);
    }, []);

    const onPress = useCallback(() => {
        openGallerWithMockFile(imageUrl, postId, imageMetadata.height, imageMetadata.width);
    }, [imageUrl]);

    if (error || !isValidUrl(imageUrl) || isGifTooLarge(imageMetadata)) {
        return (
            <View style={[style.imageContainer, {height, borderWidth: 1, borderColor: changeOpacity(theme.centerChannelColor, 0.2)}]}>
                <View style={[style.image, {width, height}]}>
                    <FileIcon
                        failed={true}
                        theme={theme}
                    />
                </View>
            </View>
        );
    }

    if (isSVGLink(imageUrl)) {
        const svgWidth = width || SVG_DEFAULT_WIDTH;
        const svgHeight = height || SVG_DEFAULT_HEIGHT;

        return (
            <TouchableWithFeedback
                onPress={onPress}
                style={[style.container, {width: svgWidth}]}
                type={'none'}
            >
                <View
                    style={[style.imageContainer, {width: svgWidth, height: svgHeight}]}
                >
                    <ProgressiveImage
                        id={fileId}
                        imageStyle={style.attachmentMargin}
                        imageUri={imageUrl}
                        onError={onError}
                        resizeMode='contain'
                        style={{height: svgHeight, width: svgWidth}}
                    />
                </View>
            </TouchableWithFeedback>
        );
    }

    return (
        <TouchableWithFeedback
            onPress={onPress}
            style={[style.container, {width}]}
            type={'none'}
        >
            <View
                style={[style.imageContainer, {width, height}]}
            >
                <ProgressiveImage
                    id={fileId}
                    imageStyle={style.attachmentMargin}
                    imageUri={imageUrl}
                    onError={onError}
                    resizeMode='contain'
                    style={{height, width}}
                />
            </View>
        </TouchableWithFeedback>
    );
};

export default AttachmentImage;
