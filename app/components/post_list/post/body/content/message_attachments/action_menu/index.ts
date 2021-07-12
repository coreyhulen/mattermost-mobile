// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {selectAttachmentMenuAction} from '@actions/views/post';
import {GlobalState} from '@mm-redux/types/store';

import ActionMenu from './action_menu';

type OwnProps = {
    postId: string;
    id: string;
}

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const actions = state.views.post.submittedMenuActions[ownProps.postId];
    const selected = actions?.[ownProps.id];

    return {
        selected,
    };
}

const mapDispatchToProps = {
    selectAttachmentMenuAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionMenu);
