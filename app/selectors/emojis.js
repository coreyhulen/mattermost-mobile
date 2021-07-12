// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {Preferences} from '@mm-redux/constants';
import {getCustomEmojisByName as selectCustomEmojisByName} from '@mm-redux/selectors/entities/emojis';
import {get} from '@mm-redux/selectors/entities/preferences';
import {createIdsSelector} from '@mm-redux/utils/helpers';
import {CategoryNames, CategoryTranslations, Emojis, EmojiIndicesByAlias, EmojiIndicesByCategory, CategoryMessage} from '@utils/emojis';

const icons = {
    recent: 'clock-outline',
    'smileys-emotion': 'emoticon-happy-outline',
    'people-body': 'eye-outline',
    'animals-nature': 'leaf-outline',
    'food-drink': 'food-apple',
    'travel-places': 'airplane-variant',
    activities: 'basketball',
    objects: 'lightbulb-outline',
    symbols: 'heart-outline',
    flags: 'flag-outline',
    custom: 'emoticon-custom-outline',
};

const categoryToI18n = {};
CategoryNames.forEach((name) => {
    categoryToI18n[name] = {
        id: CategoryTranslations.get(name),
        defaultMessage: CategoryMessage.get(name),
        icon: icons[name],
    };
});

function fillEmoji(indice) {
    const emoji = Emojis[indice];
    return {
        name: 'short_name' in emoji ? emoji.short_name : emoji.name,
        aliases: 'short_names' in emoji ? emoji.short_names : [],
    };
}

// if an emoji
// - has `skin_variations` then it uses the default skin (yellow)
// - has `skins` it's first value is considered the skin version (it can contain more values)
// - any other case it doesn't have variations or is a custom emoji.
function getSkin(emoji) {
    if ('skin_variations' in emoji) {
        return 'default';
    }
    if ('skins' in emoji) {
        return emoji.skins && emoji.skins[0];
    }
    return null;
}

export const selectEmojisByName = createIdsSelector(
    selectCustomEmojisByName,
    getUserSkinTone,
    (customEmojis, skinTone) => {
        const emoticons = new Set();
        for (const [key, index] of EmojiIndicesByAlias.entries()) {
            const skin = getSkin(Emojis[index]);
            if (!skin || skin === skinTone) {
                emoticons.add(key);
            }
        }
        for (const [key] of customEmojis.entries()) {
            emoticons.add(key);
        }
        return Array.from(emoticons);
    },
);

export function getUserSkinTone(state) {
    return get(state, Preferences.CATEGORY_EMOJI, Preferences.EMOJI_SKINTONE, 'default');
}

export const selectEmojisBySection = createSelector(
    selectCustomEmojisByName,
    (state) => state.views.recentEmojis,
    getUserSkinTone,
    (customEmojis, recentEmojis, skinTone) => {
        const customEmojiItems = [];
        for (const [key] of customEmojis) {
            customEmojiItems.push({
                name: key,
            });
        }
        const recentItems = recentEmojis.map((emoji) => ({name: emoji}));
        const filteredCategories = CategoryNames.filter((category) => category !== 'recent' || recentItems.length > 0);

        const emoticons = filteredCategories.map((category) => {
            const items = EmojiIndicesByCategory.get(skinTone).get(category).map(fillEmoji);
            const data = items;
            if (category === 'custom') {
                data.push(...customEmojiItems);
            } else if (category === 'recent') {
                data.push(...recentItems);
            }
            const section = {
                ...categoryToI18n[category],
                key: category,
                data,
            };

            return section;
        });

        return emoticons;
    },
);

export const selectEmojisCountFromReactions = createSelector(
    (reactions) => reactions,
    (reactions) => {
        if (reactions) {
            const names = Object.values(reactions).map((r) => r.emoji_name);
            const diff = new Set(names);
            return diff.size;
        }

        return 0;
    },
);
