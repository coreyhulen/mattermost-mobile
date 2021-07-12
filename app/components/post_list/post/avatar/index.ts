// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {StyleProp, ViewStyle} from 'react-native';
import {connect} from 'react-redux';

import {getConfig} from '@mm-redux/selectors/entities/general';
import {getUser} from '@mm-redux/selectors/entities/users';

import Avatar from './avatar';

import type {Post} from '@mm-redux/types/posts';
import type {Theme} from '@mm-redux/types/preferences';
import type {GlobalState} from '@mm-redux/types/store';

type OwnProps = {
    pendingPostStyle?: StyleProp<ViewStyle>;
    post: Post;
    theme: Theme;
}

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const {post} = ownProps;
    const config = getConfig(state);
    const user = getUser(state, post.user_id);

    return {
        enablePostIconOverride: config.EnablePostIconOverride === 'true',
        userId: post.user_id,
        isBot: (user ? user.is_bot : false),
    };
}

export default connect(mapStateToProps)(Avatar);
