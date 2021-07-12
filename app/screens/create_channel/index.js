// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {handleCreateChannel} from '@actions/views/create_channel';
import {getTheme} from '@mm-redux/selectors/entities/preferences';

import CreateChannel from './create_channel';

function mapStateToProps(state) {
    const {createChannel: createChannelRequest} = state.requests.channels;

    return {
        createChannelRequest,
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            handleCreateChannel,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateChannel);
