// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {createSelector} from 'reselect';

import {General} from '@mm-redux/constants';
import {makeGetChannel} from '@mm-redux/selectors/entities/channels';
import {getTeammateNameDisplaySetting, getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentUserId, getUser, makeGetProfilesInChannel} from '@mm-redux/selectors/entities/users';
import {getChannelMembersForDm} from '@selectors/channel';

import ChannelIntro from './channel_intro';

function makeMapStateToProps() {
    const getChannel = makeGetChannel();
    const getProfilesInChannel = makeGetProfilesInChannel();

    const getChannelMembers = createSelector(
        getCurrentUserId,
        (state, channel) => getProfilesInChannel(state, channel.id),
        (currentUserId, profilesInChannel) => {
            const currentChannelMembers = profilesInChannel || [];
            return currentChannelMembers.filter((m) => m.id !== currentUserId);
        },
    );

    return function mapStateToProps(state, ownProps) {
        const currentChannel = getChannel(state, {id: ownProps.channelId}) || {};

        let currentChannelMembers;
        let creator;

        if (currentChannel) {
            if (currentChannel.type === General.DM_CHANNEL) {
                currentChannelMembers = getChannelMembersForDm(state, currentChannel);
            } else {
                currentChannelMembers = getChannelMembers(state, currentChannel);
            }

            creator = getUser(state, currentChannel.creator_id);
        }

        return {
            creator,
            currentChannel,
            currentChannelMembers,
            theme: getTheme(state),
            teammateNameDisplay: getTeammateNameDisplaySetting(state),
        };
    };
}

export default connect(makeMapStateToProps)(ChannelIntro);
