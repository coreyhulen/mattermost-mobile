// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {sendPasswordResetEmail} from '@mm-redux/actions/users';

import ForgotPassword from './forgot_password';

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            sendPasswordResetEmail,
        }, dispatch),
    };
}

export default connect(null, mapDispatchToProps)(ForgotPassword);
