// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {Preferences} from '@mm-redux/constants';
import {makeGetCommentCountForPost} from '@mm-redux/selectors/entities/posts';
import {getBool} from '@mm-redux/selectors/entities/preferences';
import {isTimezoneEnabled} from '@mm-redux/selectors/entities/timezone';
import {getUser, getCurrentUser} from '@mm-redux/selectors/entities/users';
import {getUserCurrentTimezone} from '@mm-redux/utils/timezone_utils';
import {isCustomStatusEnabled} from '@selectors/custom_status';
import {postUserDisplayName} from '@utils/post';
import {isGuest} from '@utils/users';

import Header from './header';

import type {Post} from '@mm-redux/types/posts';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    enablePostUsernameOverride: boolean;
    location: string;
    post: Post;
    rootPostAuthor?: string;
    teammateNameDisplay: string;
};

function mapStateToProps() {
    const getCommentCountForPost = makeGetCommentCountForPost();
    return (state: GlobalState, ownProps: OwnProps) => {
        const {post, enablePostUsernameOverride, teammateNameDisplay} = ownProps;
        const currentUser = getCurrentUser(state);
        const author = post.user_id ? getUser(state, post.user_id) : undefined;
        const enableTimezone = isTimezoneEnabled(state);

        return {
            commentCount: getCommentCountForPost(state, post),
            displayName: postUserDisplayName(post, author, teammateNameDisplay, enablePostUsernameOverride),
            isBot: (author ? author.is_bot : false),
            isGuest: isGuest(author),
            isMilitaryTime: getBool(state, Preferences.CATEGORY_DISPLAY_SETTINGS, 'use_military_time'),
            userTimezone: enableTimezone ? getUserCurrentTimezone(currentUser.timezone) : undefined,
            isCustomStatusEnabled: isCustomStatusEnabled(state),
        };
    };
}

export default connect(mapStateToProps)(Header);
