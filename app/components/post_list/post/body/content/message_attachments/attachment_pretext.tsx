// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native';

import Markdown from '@components/markdown';
import {PostMetadata} from '@mm-redux/types/posts';

type Props = {
    baseTextStyle: StyleProp<TextStyle>;
        blockStyles?: StyleProp<ViewStyle>[];
        metadata?: PostMetadata;
        textStyles?: StyleProp<TextStyle>[];
        value?: string;
}
export default function AttachmentPreText(props: Props) {
    const {
        baseTextStyle,
        blockStyles,
        metadata,
        value,
        textStyles,
    } = props;

    if (!value) {
        return null;
    }

    return (
        <View style={style.container}>
            <Markdown
                baseTextStyle={baseTextStyle as never}
                textStyles={textStyles}
                blockStyles={blockStyles}
                disableGallery={true}
                imagesMetadata={metadata?.images}
                value={value}
            />
        </View>
    );
}

const style = StyleSheet.create({
    container: {
        marginTop: 5,
    },
});
