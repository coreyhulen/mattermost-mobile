// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {doPostActionWithCookie} from '@mm-redux/actions/posts';

import ActionButton from './action_button';

const mapDispatchToProps = {
    doPostActionWithCookie,
};

export default connect(null, mapDispatchToProps)(ActionButton);
