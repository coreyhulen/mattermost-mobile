// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getUsersByUsername} from '@mm-redux/selectors/entities/users';

import {getAllUserMentionKeys} from '@mm-redux/selectors/entities/search';

import {getTeammateNameDisplaySetting, getTheme} from '@mm-redux/selectors/entities/preferences';

import {getGroupsByName} from '@mm-redux/selectors/entities/groups';

import AtMention from './at_mention';

function mapStateToProps(state, ownProps) {
    return {
        theme: getTheme(state),
        usersByUsername: getUsersByUsername(state),
        mentionKeys: ownProps.mentionKeys || getAllUserMentionKeys(state),
        teammateNameDisplay: getTeammateNameDisplaySetting(state),
        groupsByName: getGroupsByName(state),
    };
}

export default connect(mapStateToProps)(AtMention);
