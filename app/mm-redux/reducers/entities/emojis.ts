// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {EmojiTypes, PostTypes} from '@mm-redux/action_types';
import * as types from '@mm-redux/types';
import {EmojisState, CustomEmoji} from '@mm-redux/types/emojis';

export function customEmoji(state: types.utilities.IDMappedObjects<CustomEmoji> = {}, action: types.actions.GenericAction): types.utilities.IDMappedObjects<CustomEmoji> {
    switch (action.type) {
    case EmojiTypes.RECEIVED_CUSTOM_EMOJI: {
        const nextState = {...state};
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case EmojiTypes.RECEIVED_CUSTOM_EMOJIS: {
        const nextState = {...state};
        for (const emoji of action.data) {
            nextState[emoji.id] = emoji;
        }
        return nextState;
    }
    case EmojiTypes.DELETED_CUSTOM_EMOJI: {
        const nextState = {...state};
        Reflect.deleteProperty(nextState, action.data.id);
        return nextState;
    }
    case EmojiTypes.CLEAR_CUSTOM_EMOJIS:
        return {};

    case PostTypes.RECEIVED_NEW_POST:
    case PostTypes.RECEIVED_POST: {
        const post: types.posts.Post = action.data;

        return storeEmojisForPost(state, post);
    }
    case PostTypes.RECEIVED_POSTS: {
        const posts = Object.values(action.data.posts);
        return (posts as any).reduce(storeEmojisForPost, state); // Cast to any to avoid typing problems caused by Object.values
    }

    default:
        return state;
    }
}

function storeEmojisForPost(state: types.utilities.IDMappedObjects<CustomEmoji>, post: types.posts.Post): types.utilities.IDMappedObjects<CustomEmoji> {
    if (!post.metadata || !post.metadata.emojis) {
        return state;
    }

    return post.metadata.emojis.reduce((nextState, emoji) => {
        if (nextState[emoji.id]) {
            // Emoji is already in the store
            return nextState;
        }

        return {
            ...nextState,
            [emoji.id]: emoji,
        };
    }, state);
}

function nonExistentEmoji(state: Set<string> = new Set(), action: types.actions.GenericAction): Set<string> {
    switch (action.type) {
    case EmojiTypes.CUSTOM_EMOJI_DOES_NOT_EXIST: {
        if (!state.has(action.data)) {
            const nextState = new Set(state);
            nextState.add(action.data);
            return nextState;
        }
        return state;
    }
    case EmojiTypes.RECEIVED_CUSTOM_EMOJI: {
        if (action.data && state.has(action.data.name)) {
            const nextState = new Set(state);
            nextState.delete(action.data.name);
            return nextState;
        }
        return state;
    }
    case EmojiTypes.RECEIVED_CUSTOM_EMOJIS: {
        const data = action.data || [];
        const nextState = new Set(state);

        let changed = false;
        for (const emoji of data) {
            if (emoji && nextState.has(emoji.name)) {
                nextState.delete(emoji.name);
                changed = true;
            }
        }
        return changed ? nextState : state;
    }
    case EmojiTypes.CLEAR_CUSTOM_EMOJIS:
        return new Set();

    default:
        return state;
    }
}

export default (combineReducers({

    // object where every key is the custom emoji id and has an object with the custom emoji details
    customEmoji,

    // set containing custom emoji names that do not exist
    nonExistentEmoji,
}) as (b: EmojisState, a: types.actions.GenericAction) => EmojisState);
