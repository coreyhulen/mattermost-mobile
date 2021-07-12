// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import emojiRegex from 'emoji-regex';
import {batchActions} from 'redux-batched-actions';

import {Client4} from '@client/rest';
import {ViewTypes} from '@constants';
import {EmojiTypes} from '@mm-redux/action_types';
import {addReaction as serviceAddReaction, getNeededCustomEmojis} from '@mm-redux/actions/posts';
import {getPostIdsInCurrentChannel, makeGetPostIdsForThread} from '@mm-redux/selectors/entities/posts';
import {EmojiIndicesByAlias, EmojiIndicesByUnicode, Emojis} from '@utils/emojis';

const getPostIdsForThread = makeGetPostIdsForThread();

export function addReaction(postId, emoji) {
    return (dispatch) => {
        dispatch(serviceAddReaction(postId, emoji));
        dispatch(addRecentEmoji(emoji));
    };
}

export function addReactionToLatestPost(emoji, rootId) {
    return async (dispatch, getState) => {
        const state = getState();
        const postIds = rootId ? getPostIdsForThread(state, rootId) : getPostIdsInCurrentChannel(state);
        const lastPostId = postIds[0];

        dispatch(serviceAddReaction(lastPostId, emoji));
        dispatch(addRecentEmoji(emoji));
    };
}

export function addRecentEmoji(emoji) {
    return {
        type: ViewTypes.ADD_RECENT_EMOJI,
        emoji,
    };
}

export function incrementEmojiPickerPage() {
    return async (dispatch) => {
        dispatch({
            type: ViewTypes.INCREMENT_EMOJI_PICKER_PAGE,
        });

        return {data: true};
    };
}

export function getEmojisInPosts(posts) {
    return async (dispatch, getState) => {
        const state = getState();

        // Do not wait for this as they need to be loaded one by one
        const emojisToLoad = getNeededCustomEmojis(state, posts);

        if (emojisToLoad?.size > 0) {
            const promises = Array.from(emojisToLoad).map((name) => getCustomEmojiByName(name));
            const result = await Promise.all(promises);
            const actions = [];
            const data = [];

            result.forEach((emoji, index) => {
                const name = emojisToLoad[index];

                if (emoji) {
                    switch (emoji) {
                    case 404:
                        actions.push({type: EmojiTypes.CUSTOM_EMOJI_DOES_NOT_EXIST, data: name});
                        break;
                    default:
                        data.push(emoji);
                    }
                }
            });

            if (data.length) {
                actions.push({type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS, data});
            }

            if (actions.length) {
                dispatch(batchActions(actions, 'BATCH_GET_EMOJIS_FOR_POSTS'));
            }
        }
    };
}

async function getCustomEmojiByName(name) {
    try {
        const data = await Client4.getCustomEmojiByName(name);

        return data;
    } catch (error) {
        if (error.status_code === 404) {
            return 404;
        }
    }

    return null;
}

export function addRecentUsedEmojisInMessage(message) {
    return (dispatch) => {
        const RE_UNICODE_EMOJI = emojiRegex();
        const RE_NAMED_EMOJI = /(:([a-zA-Z0-9_-]+):)/g;
        const emojis = message.match(RE_UNICODE_EMOJI);
        const namedEmojis = message.match(RE_NAMED_EMOJI);
        function emojiUnicode(input) {
            const emoji = [];
            for (const i of input) {
                emoji.push(i.codePointAt(0).toString(16));
            }
            return emoji.join('-');
        }
        const emojisAvailableWithMattermost = [];
        if (emojis) {
            for (const emoji of emojis) {
                const unicode = emojiUnicode(emoji);
                const index = EmojiIndicesByUnicode.get(unicode || '');
                if (index) {
                    const name = 'short_name' in Emojis[index] ? Emojis[index].short_name : Emojis[index].name;
                    emojisAvailableWithMattermost.push(name);
                }
            }
        }
        if (namedEmojis) {
            for (const emoji of namedEmojis) {
                const index = EmojiIndicesByAlias.get(emoji.slice(1, -1));
                if (index) {
                    const name = 'short_name' in Emojis[index] ? Emojis[index].short_name : Emojis[index].name;
                    emojisAvailableWithMattermost.push(name);
                }
            }
        }
        dispatch({
            type: ViewTypes.ADD_RECENT_EMOJI_ARRAY,
            emojis: emojisAvailableWithMattermost,
        });
    };
}
