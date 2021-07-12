// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {sendAddToChannelEphemeralPost} from '@actions/views/post';
import {addChannelMember} from '@mm-redux/actions/channels';
import {removePost} from '@mm-redux/actions/posts';
import {getChannel} from '@mm-redux/selectors/entities/channels';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';

import AddMembers from './add_members';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    post: Post;
    theme: Theme;
}

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const {post} = ownProps;
    let channelType = '';
    if (post.channel_id) {
        const channel = getChannel(state, post.channel_id);
        if (channel?.type) {
            channelType = channel.type;
        }
    }

    return {
        channelType,
        currentUser: getCurrentUser(state),
        post,
    };
}

const mapDispatchToProps = {
    addChannelMember,
    removePost,
    sendAddToChannelEphemeralPost,
};

export default connect(mapStateToProps, mapDispatchToProps)(AddMembers);
