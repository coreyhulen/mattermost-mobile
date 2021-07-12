// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {MAX_MESSAGE_LENGTH_FALLBACK} from '@constants/post_draft';
import {editPost} from '@mm-redux/actions/posts';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getDimensions} from '@selectors/device';

import EditPost from './edit_post';

function mapStateToProps(state, ownProps) {
    const config = getConfig(state);

    return {
        ...getDimensions(state),
        maxMessageLength: (config && parseInt(config.MaxPostSize || 0, 10)) || MAX_MESSAGE_LENGTH_FALLBACK,
        post: ownProps.post,
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            editPost,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditPost);
