// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {LayoutChangeEvent, useWindowDimensions, ScrollView, View} from 'react-native';
import Animated from 'react-native-reanimated';

import Markdown from '@components/markdown';
import ShowMoreButton from '@components/post_list/post/body/message/show_more_button';
import {useShowMoreAnimatedStyle} from '@hooks/show_more';
import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {makeStyleSheetFromTheme} from '@utils/theme';

import type {Theme} from '@mm-redux/types/preferences';

type Props = {
    theme: Theme;
    value: string;
}

const SHOW_MORE_HEIGHT = 54;

const getStyles = makeStyleSheetFromTheme((theme: Theme) => ({
    message: {
        color: theme.centerChannelColor,
        fontSize: 15,
        lineHeight: 20,
    },
}));

const EmbedText = ({theme, value}: Props) => {
    const [open, setOpen] = useState(false);
    const [height, setHeight] = useState<number|undefined>();
    const dimensions = useWindowDimensions();
    const maxHeight = Math.round((dimensions.height * 0.4) + SHOW_MORE_HEIGHT);
    const animatedStyle = useShowMoreAnimatedStyle(height, maxHeight, open);
    const blockStyles = getMarkdownBlockStyles(theme);
    const textStyles = getMarkdownTextStyles(theme);
    const style = getStyles(theme);

    const onLayout = useCallback((event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height), []);
    const onPress = () => setOpen(!open);

    return (
        <>
            <Animated.View style={animatedStyle}>
                <ScrollView
                    keyboardShouldPersistTaps={'always'}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <View onLayout={onLayout}>
                        <Markdown
                            baseTextStyle={style.message}
                            textStyles={textStyles}
                            blockStyles={blockStyles}
                            disableGallery={true}
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
        </>
    );
};

export default EmbedText;
