// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {LayoutChangeEvent, useWindowDimensions, ScrollView, StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native';
import Animated from 'react-native-reanimated';

import Markdown from '@components/markdown';
import ShowMoreButton from '@components/post_list/post/body/message/show_more_button';
import {useShowMoreAnimatedStyle} from '@hooks/show_more';
import {PostMetadata} from '@mm-redux/types/posts';
import {Theme} from '@mm-redux/types/preferences';

type Props = {
    baseTextStyle: StyleProp<TextStyle>;
    blockStyles?: StyleProp<ViewStyle>[];
    hasThumbnail?: boolean;
    metadata?: PostMetadata;
    textStyles?: StyleProp<TextStyle>[];
    theme: Theme;
    value?: string;
}

const SHOW_MORE_HEIGHT = 54;
const style = StyleSheet.create({
    container: {
        paddingRight: 12,
    },
});

const AttachmentText = ({baseTextStyle, blockStyles, hasThumbnail, metadata, textStyles, theme, value}: Props) => {
    const [open, setOpen] = useState(false);
    const [height, setHeight] = useState<number|undefined>();
    const dimensions = useWindowDimensions();
    const maxHeight = Math.round((dimensions.height * 0.4) + SHOW_MORE_HEIGHT);
    const animatedStyle = useShowMoreAnimatedStyle(height, maxHeight, open);

    const onLayout = useCallback((event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height), []);
    const onPress = () => setOpen(!open);

    return (
        <View style={hasThumbnail && style.container}>
            <Animated.View style={animatedStyle}>
                <ScrollView
                    keyboardShouldPersistTaps={'always'}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <View onLayout={onLayout}>
                        <Markdown
                            baseTextStyle={baseTextStyle as never}
                            textStyles={textStyles}
                            blockStyles={blockStyles}
                            disableGallery={true}
                            imagesMetadata={metadata?.images}
                            value={value}
                        />
                    </View>
                </ScrollView>
            </Animated.View>
            {(height || 0) > maxHeight &&
            <ShowMoreButton
                highlight={false}
                theme={theme}
                showMore={!open}
                onPress={onPress}
            />
            }
        </View>
    );
};

export default AttachmentText;
