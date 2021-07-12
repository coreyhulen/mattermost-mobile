// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef} from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {View} from 'react-native';

import {showModal, showModalOverCurrentContext} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import Reaction from './reaction';

import type {Theme} from '@mm-redux/types/preferences';
import type {Reaction as ReactionType} from '@mm-redux/types/reactions';

type ReactionsProps = {
    addReaction: (postId: string, emojiName: string) => void;
    canAddMoreReactions: boolean;
    canAddReaction: boolean;
    canRemoveReaction: boolean;
    currentUserId: string;
    intl: typeof intlShape;
    postId: string;
    reactions?: Record<string, ReactionType> | null;
    removeReaction: (postId: string, emojiName: string) => void;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        addReaction: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        reaction: {
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            borderColor: changeOpacity(theme.centerChannelColor, 0.3),
            borderWidth: 1,
            flexDirection: 'row',
            height: 30,
            marginRight: 6,
            marginBottom: 5,
            marginTop: 10,
            paddingVertical: 2,
            paddingHorizontal: 6,
            width: 40,
        },
        reactionsContainer: {
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
        },
    };
});

const Reactions = ({
    addReaction, canAddMoreReactions, canAddReaction, canRemoveReaction, currentUserId,
    intl, postId, reactions, removeReaction, theme,
}: ReactionsProps) => {
    if (!reactions) {
        return null;
    }

    const pressed = useRef(false);
    const styles = getStyleSheet(theme);

    const buildReactionsMap = () => {
        const highlightedReactions: string[] = [];

        const reactionsByName: Map<string, ReactionType[]> = Object.values(reactions).reduce((acc, reaction) => {
            if (reaction) {
                if (acc.has(reaction.emoji_name)) {
                    acc.get(reaction.emoji_name)!.push(reaction);
                } else {
                    acc.set(reaction.emoji_name, [reaction]);
                }

                if (reaction.user_id === currentUserId) {
                    highlightedReactions.push(reaction.emoji_name);
                }
            }

            return acc;
        }, new Map<string, ReactionType[]>());

        return {reactionsByName, highlightedReactions};
    };

    const handleAddReactionToPost = (emoji: string) => {
        addReaction(postId, emoji);
    };

    const handleAddReaction = preventDoubleTap(() => {
        const screen = 'AddReaction';
        const title = intl.formatMessage({id: 'mobile.post_info.add_reaction', defaultMessage: 'Add Reaction'});

        const closeButton = CompassIcon.getImageSourceSync('close', 24, theme.sidebarHeaderTextColor);
        const passProps = {
            closeButton,
            onEmojiPress: handleAddReactionToPost,
        };

        showModal(screen, title, passProps);
    });

    const handleReactionPress = (emoji: string, remove: boolean) => {
        pressed.current = true;
        if (remove && canRemoveReaction) {
            removeReaction(postId, emoji);
        } else if (!remove && canAddReaction) {
            addReaction(postId, emoji);
        }

        const tm = setTimeout(() => {
            clearTimeout(tm);
            pressed.current = false;
        }, 300);
    };

    const showReactionList = () => {
        const screen = 'ReactionList';
        const passProps = {
            postId,
        };

        if (!pressed.current) {
            showModalOverCurrentContext(screen, passProps);
        }
    };

    let addMoreReactions = null;
    if (canAddReaction && canAddMoreReactions) {
        addMoreReactions = (
            <TouchableWithFeedback
                key='addReaction'
                onPress={handleAddReaction}
                style={[styles.reaction]}
                type={'opacity'}
            >
                <CompassIcon
                    name='emoticon-plus-outline'
                    size={24}
                    style={styles.addReaction}
                />
            </TouchableWithFeedback>
        );
    }

    const {reactionsByName, highlightedReactions} = buildReactionsMap();
    return (
        <View style={styles.reactionsContainer}>
            {
                Array.from(reactionsByName.keys()).map((r) => {
                    return (
                        <Reaction
                            key={r}
                            count={reactionsByName.get(r)!.length}
                            emojiName={r}
                            highlight={highlightedReactions.includes(r)}
                            onPress={handleReactionPress}
                            onLongPress={showReactionList}
                            theme={theme}
                        />
                    );
                })
            }
            {addMoreReactions}
        </View>
    );
};

export default injectIntl(Reactions);
