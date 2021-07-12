// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {createSelector} from 'reselect';

import {getCurrentChannelId, getUsers} from '@mm-redux/selectors/entities/common';
import {getTeammateNameDisplaySetting} from '@mm-redux/selectors/entities/preferences';
import {GlobalState} from '@mm-redux/types/store';
import {Typing} from '@mm-redux/types/typing';
import {UserProfile} from '@mm-redux/types/users';
import {IDMappedObjects} from '@mm-redux/types/utilities';
import {displayUsername} from '@mm-redux/utils/user_utils';

const getUsersTypingImpl = (profiles: IDMappedObjects<UserProfile>, teammateNameDisplay: string, channelId: string, parentPostId: string, typing: Typing): Array<string> => {
    const id = channelId + parentPostId;

    if (typing[id]) {
        const users = Object.keys(typing[id]);

        if (users.length) {
            return users.map((userId) => {
                return displayUsername(profiles[userId], teammateNameDisplay);
            });
        }
    }

    return [];
};

export const makeGetUsersTypingByChannelAndPost = () => {
    return (createSelector(getUsers, getTeammateNameDisplaySetting, (state: GlobalState, options: {
        channelId: string;
        postId: string;
    }): string => options.channelId, (state: GlobalState, options: {
        channelId: string;
        postId: string;
    }): string => options.postId, (state: GlobalState): Typing => state.entities.typing, getUsersTypingImpl) as (state: GlobalState, a: {
        channelId: string;
        postId: string;
    }) => Array<string>);
};

export const getUsersTyping: (state: GlobalState) => Array<string> = createSelector(
    getUsers,
    getTeammateNameDisplaySetting,
    getCurrentChannelId,
    (state) => state.entities.posts.selectedPostId,
    (state) => state.entities.typing,
    getUsersTypingImpl,
);
