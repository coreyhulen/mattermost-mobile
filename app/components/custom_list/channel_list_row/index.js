// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {makeGetChannel} from '@mm-redux/selectors/entities/channels';
import {getTheme} from '@mm-redux/selectors/entities/preferences';

import ChannelListRow from './channel_list_row';

function makeMapStateToProps() {
    const getChannel = makeGetChannel();

    return (state, ownProps) => {
        return {
            theme: getTheme(state),
            channel: getChannel(state, ownProps),
        };
    };
}

export default connect(makeMapStateToProps)(ChannelListRow);
