// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getConnection} from '@selectors/device';

import RefreshList from './refresh_list';

function mapStateToProps(state) {
    const networkOnline = getConnection(state);
    let {refreshing} = state.views.channel;

    if (!networkOnline) {
        refreshing = false;
    }

    return {
        refreshing,
    };
}

export default connect(mapStateToProps)(RefreshList);
