// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getStatusForUserId} from '@mm-redux/selectors/entities/users';

import StatusLabel from './status_label';

function mapStateToProps(state, ownProps?) {
    return {
        status: getStatusForUserId(state, ownProps.userId),
        theme: getTheme(state),
    };
}

export default connect(mapStateToProps)(StatusLabel);
