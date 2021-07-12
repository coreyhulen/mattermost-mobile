// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ALL_EMOJIS} from '@constants/emoji';

export function generateUserProfilesById(userProfiles = []) {
    return userProfiles.reduce((acc, userProfile) => {
        acc[userProfile.id] = userProfile;

        return acc;
    }, []);
}

export function getMissingUserIds(userProfilesById = {}, allUserIds = []) {
    return allUserIds.reduce((acc, userId) => {
        if (!userProfilesById[userId]) {
            acc.push(userId);
        }

        return acc;
    }, []);
}

export function compareReactions(a, b) {
    if (a.count !== b.count) {
        return b.count - a.count;
    }

    return a.name.localeCompare(b.name);
}

export function getReactionsByName(reactions = {}) {
    return Object.values(reactions).reduce((acc, reaction) => {
        const byName = acc[reaction.emoji_name] || [];
        acc[reaction.emoji_name] = [...byName, reaction];

        return acc;
    }, {});
}

export function sortReactionsByName(reactionsByName = {}) {
    return Object.entries(reactionsByName).
        map(([name, reactions]) => ({name, reactions, count: reactions.length})).
        sort(compareReactions);
}

export function sortReactions(reactionsByName = {}) {
    return sortReactionsByName(reactionsByName).
        reduce((acc, {reactions}) => {
            reactions.forEach((r) => acc.push(r));
            return acc;
        }, []);
}

export function getSortedReactionsForHeader(reactionsByName = {}) {
    const sortedReactionsForHeader = sortReactionsByName(reactionsByName);

    const totalCount = sortedReactionsForHeader.reduce((acc, reaction) => {
        return acc + reaction.count;
    }, 0);

    return [{name: ALL_EMOJIS, count: totalCount}, ...sortedReactionsForHeader];
}

export function getUniqueUserIds(reactions = {}) {
    return Object.values(reactions).map((reaction) => reaction.user_id).filter((id, index, arr) => arr.indexOf(id) === index);
}
