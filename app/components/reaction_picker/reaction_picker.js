// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {View, TouchableWithoutFeedback, useWindowDimensions} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {
    REACTION_PICKER_HEIGHT,
    DEFAULT_EMOJIS,
    SMALL_ICON_BREAKPOINT,
    SMALL_CONTAINER_SIZE,
    LARGE_CONTAINER_SIZE,
    SMALL_ICON_SIZE,
    LARGE_ICON_SIZE,
} from '@constants/reaction_picker';
import {EmojiIndicesByAlias} from '@utils/emojis';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ReactionButton from './reaction_button';

const ReactionPicker = (props) => {
    const {theme} = props;
    const style = getStyleSheet(theme);
    const {width} = useWindowDimensions();
    const isSmallDevice = width < SMALL_ICON_BREAKPOINT;

    const handlePress = (emoji) => {
        props.addReaction(emoji);
    };

    let containerSize = LARGE_CONTAINER_SIZE;
    let iconSize = LARGE_ICON_SIZE;

    if (isSmallDevice) {
        containerSize = SMALL_CONTAINER_SIZE;
        iconSize = SMALL_ICON_SIZE;
    }

    const recentEmojisIndices = props.recentEmojis.map((recentEmoji) => EmojiIndicesByAlias.get(recentEmoji));
    const emojis = props.recentEmojis.
        concat(DEFAULT_EMOJIS.filter((defaultEmoji) => !recentEmojisIndices.includes(EmojiIndicesByAlias.get(defaultEmoji)))).
        splice(0, 6);

    const list = emojis.map((emoji) => {
        return (
            <ReactionButton
                key={emoji}
                theme={theme}
                addReaction={handlePress}
                emoji={emoji}
                iconSize={iconSize}
                containerSize={containerSize}
            />
        );
    });

    return (
        <View style={style.reactionListContainer}>
            {list}
            <TouchableWithoutFeedback
                onPress={props.openReactionScreen}
                testID='open.add_reaction.button'
            >
                <View
                    style={[
                        style.reactionContainer,
                        {
                            width: containerSize,
                            height: containerSize,
                        },
                    ]}
                >
                    <CompassIcon
                        name='emoticon-plus-outline'
                        size={31.2}
                        style={style.icon}
                    />
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
};

ReactionPicker.propTypes = {
    addReaction: PropTypes.func.isRequired,
    openReactionScreen: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
    recentEmojis: PropTypes.array,
};

export default ReactionPicker;

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        icon: {
            color: theme.centerChannelColor,
        },
        reactionListContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            height: REACTION_PICKER_HEIGHT,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
        },
        reactionContainer: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
        },
    };
});
