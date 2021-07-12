// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Dimensions} from 'react-native';

import {DeviceTypes} from '@constants';
import {
    IMAGE_MAX_HEIGHT,
    IMAGE_MIN_DIMENSION,
    MAX_GIF_SIZE,
    VIEWPORT_IMAGE_OFFSET,
    VIEWPORT_IMAGE_REPLY_OFFSET,
} from '@constants/image';
import {PostImage} from '@mm-redux/types/posts';

export const calculateDimensions = (height: number, width: number, viewPortWidth = 0, viewPortHeight = 0) => {
    if (!height || !width) {
        return {
            height: 0,
            width: 0,
        };
    }

    const ratio = height / width;
    const heightRatio = width / height;

    let imageWidth = width;
    let imageHeight = height;

    if (width > viewPortWidth) {
        imageWidth = viewPortWidth;
        imageHeight = imageWidth * ratio;
    } else if (width < IMAGE_MIN_DIMENSION) {
        imageWidth = IMAGE_MIN_DIMENSION;
        imageHeight = imageWidth * ratio;
    }

    if (
        (
            imageHeight > IMAGE_MAX_HEIGHT ||
            (viewPortHeight && imageHeight > viewPortHeight)
        ) && viewPortHeight <= IMAGE_MAX_HEIGHT
    ) {
        imageHeight = viewPortHeight || IMAGE_MAX_HEIGHT;
        imageWidth = imageHeight * heightRatio;
    } else if (
        imageHeight < IMAGE_MIN_DIMENSION &&
        IMAGE_MIN_DIMENSION * heightRatio <= viewPortWidth
    ) {
        imageHeight = IMAGE_MIN_DIMENSION;
        imageWidth = imageHeight * heightRatio;
    } else if (viewPortHeight && imageHeight > viewPortHeight) {
        imageHeight = viewPortHeight;
        imageWidth = imageHeight * heightRatio;
    }

    return {
        height: imageHeight,
        width: imageWidth,
    };
};

export function getViewPortWidth(isReplyPost: boolean, permanentSidebar = false) {
    const {width, height} = Dimensions.get('window');
    let portraitPostWidth = Math.min(width, height) - VIEWPORT_IMAGE_OFFSET;

    if (permanentSidebar) {
        portraitPostWidth -= DeviceTypes.TABLET_WIDTH;
    }

    if (isReplyPost) {
        portraitPostWidth -= VIEWPORT_IMAGE_REPLY_OFFSET;
    }

    return portraitPostWidth;
}

// isGifTooLarge returns true if we think that the GIF may cause the device to run out of memory when rendered
// based on the image's dimensions and frame count.
export function isGifTooLarge(imageMetadata?: PostImage) {
    if (imageMetadata?.format !== 'gif') {
        // Not a gif or from an older server that doesn't count frames
        return false;
    }

    const {frame_count: frameCount, height, width} = imageMetadata;

    // Try to estimate the in-memory size of the gif to prevent the device out of memory
    return width * height * (frameCount || 1) > MAX_GIF_SIZE;
}
