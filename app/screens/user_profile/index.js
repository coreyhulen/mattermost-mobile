// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {setChannelDisplayName} from '@actions/views/channel';
import {unsetCustomStatus} from '@actions/views/custom_status';
import {makeDirectChannel} from '@actions/views/more_dms';
import {loadBot} from '@mm-redux/actions/bots';
import {getRemoteClusterInfo} from '@mm-redux/actions/remote_cluster';
import Preferences from '@mm-redux/constants/preferences';
import {getBotAccounts} from '@mm-redux/selectors/entities/bots';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTeammateNameDisplaySetting, getTheme, getBool} from '@mm-redux/selectors/entities/preferences';
import {isTimezoneEnabled} from '@mm-redux/selectors/entities/timezone';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {makeGetCustomStatus, isCustomStatusEnabled} from '@selectors/custom_status';

import UserProfile from './user_profile';

function makeMapStateToProps() {
    const getCustomStatus = makeGetCustomStatus();
    return (state, ownProps) => {
        const config = getConfig(state);
        const {createChannel: createChannelRequest} = state.requests.channels;
        const isMilitaryTime = getBool(state, Preferences.CATEGORY_DISPLAY_SETTINGS, 'use_military_time');
        const enableTimezone = isTimezoneEnabled(state);
        const user = state.entities.users.profiles[ownProps.userId];

        const customStatus = isCustomStatusEnabled(state) ? getCustomStatus(state, user?.id) : undefined;
        return {
            config,
            createChannelRequest,
            currentDisplayName: state.views.channel.displayName,
            user,
            bot: getBotAccounts(state)[ownProps.userId],
            teammateNameDisplay: getTeammateNameDisplaySetting(state),
            enableTimezone,
            isMilitaryTime,
            theme: getTheme(state),
            isMyUser: getCurrentUserId(state) === ownProps.userId,
            remoteClusterInfo: state.entities.remoteCluster.info[user?.remote_id],
            customStatus,
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            makeDirectChannel,
            setChannelDisplayName,
            loadBot,
            getRemoteClusterInfo,
            unsetCustomStatus,
        }, dispatch),
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps)(UserProfile);
