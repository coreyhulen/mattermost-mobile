// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {handleSelectChannel} from '@actions/views/channel';
import {closePermalink} from '@actions/views/permalink';
import {getPostsAround, getPostThread} from '@actions/views/post';
import {handleTeamChange} from '@actions/views/select_team';
import {getChannel as getChannelAction, joinChannel} from '@mm-redux/actions/channels';
import {selectPost} from '@mm-redux/actions/posts';
import {addUserToTeam, getTeamByName, removeUserFromTeam} from '@mm-redux/actions/teams';
import {makeGetChannel, getMyChannelMemberships} from '@mm-redux/selectors/entities/channels';
import {makeGetPostIdsAroundPost, getPost} from '@mm-redux/selectors/entities/posts';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId, getTeamByName as selectTeamByName, getTeamMemberships} from '@mm-redux/selectors/entities/teams';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';

import Permalink from './permalink';

function makeMapStateToProps() {
    const getPostIdsAroundPost = makeGetPostIdsAroundPost();
    const getChannel = makeGetChannel();

    return function mapStateToProps(state, props) {
        const {currentFocusedPostId} = state.entities.posts;
        const post = getPost(state, currentFocusedPostId);

        let channel;
        let postIds;

        if (post) {
            channel = getChannel(state, {id: post.channel_id});
            postIds = getPostIdsAroundPost(state, currentFocusedPostId, post.channel_id, {
                postsBeforeCount: 10,
                postsAfterCount: 10,
            });
        }

        return {
            channelId: channel ? channel.id : '',
            channelIsArchived: channel ? channel.delete_at !== 0 : false,
            channelName: channel ? channel.display_name : '',
            channelTeamId: channel ? channel.team_id : '',
            currentTeamId: getCurrentTeamId(state),
            currentUserId: getCurrentUserId(state),
            focusedPostId: currentFocusedPostId,
            myChannelMemberships: getMyChannelMemberships(state),
            myTeamMemberships: getTeamMemberships(state),
            postIds,
            team: selectTeamByName(state, props.teamName),
            theme: getTheme(state),
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            addUserToTeam,
            closePermalink,
            getPostsAround,
            getPostThread,
            getChannel: getChannelAction,
            getTeamByName,
            handleSelectChannel,
            handleTeamChange,
            joinChannel,
            removeUserFromTeam,
            selectPost,
        }, dispatch),
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps, null, {forwardRef: true})(Permalink);
