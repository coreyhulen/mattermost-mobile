// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {Preferences} from '@mm-redux/constants';
import {getChannel} from '@mm-redux/selectors/entities/channels';
import {getBool} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {getCurrentUser, getUsernamesByUserId} from '@mm-redux/selectors/entities/users';
import {makeGenerateCombinedPost} from '@mm-redux/utils/post_list';
import {canDeletePost} from '@selectors/permissions';

import CombinedUserActivity from './combined_user_activity';

import type {GlobalState} from '@mm-redux/types/store';
import type {UserProfile} from '@mm-redux/types/users';

type OwnProps = {
    postId: string;
};

export function mapStateToProps() {
    const generateCombinedPost = makeGenerateCombinedPost();
    return (state: GlobalState, ownProps: OwnProps) => {
        const currentUser: UserProfile | undefined = getCurrentUser(state);
        const post = generateCombinedPost(state, ownProps.postId);
        const channel = getChannel(state, post?.channel_id);
        const teamId = getCurrentTeamId(state);
        const {allUserIds, allUsernames} = post.props.user_activity!;
        let canDelete = false;

        if (post && channel?.delete_at === 0) {
            canDelete = canDeletePost(state, channel?.team_id || teamId, post?.channel_id, post, false);
        }

        return {
            canDelete,
            currentUserId: currentUser?.id,
            currentUsername: currentUser?.username,
            post,
            showJoinLeave: getBool(state, Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE, true),
            usernamesById: getUsernamesByUserId(state, allUserIds, allUsernames),
        };
    };
}

export default connect(mapStateToProps)(CombinedUserActivity);
