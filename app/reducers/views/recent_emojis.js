// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';

const MAXIMUM_RECENT_EMOJI = 27;

export default function recentEmojis(state = [], action) {
    switch (action.type) {
    case ViewTypes.ADD_RECENT_EMOJI: {
        const nextState = [...state];

        const index = nextState.indexOf(action.emoji);
        if (index !== -1) {
            nextState.splice(index, 1);
        }

        nextState.unshift(action.emoji);
        if (nextState.length > MAXIMUM_RECENT_EMOJI) {
            nextState.splice(MAXIMUM_RECENT_EMOJI);
        }
        return nextState;
    }
    case ViewTypes.ADD_RECENT_EMOJI_ARRAY: {
        const nextRecentEmojis = action.emojis.reduce((currentState, emoji) => {
            return [emoji, ...currentState.filter((currentEmoji) => currentEmoji !== emoji)];
        }, state);
        if (nextRecentEmojis.length > MAXIMUM_RECENT_EMOJI) {
            nextRecentEmojis.splice(MAXIMUM_RECENT_EMOJI);
        }
        return nextRecentEmojis;
    }

    default:
        return state;
    }
}
