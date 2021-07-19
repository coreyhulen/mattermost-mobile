// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {autocompleteChannelsForSearch} from '@mm-redux/actions/channels';
import {getMyChannelMemberships} from '@mm-redux/selectors/entities/channels';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {
    filterMyChannels,
    filterOtherChannels,
    filterPublicChannels,
    filterPrivateChannels,
    filterDirectAndGroupMessages,
    getMatchTermForChannelMention,
} from '@selectors/autocomplete';

import ChannelMention from './channel_mention';

const appsTakeOverProps = {
    currentTeamId: '',
    requestStatus: '',
    theme: {},
};

function mapStateToProps(state, ownProps) {
    if (ownProps.appsTakeOver) {
        // Return empty values for the required fields.
        return appsTakeOverProps;
    }

    const {cursorPosition, isSearch} = ownProps;

    const value = ownProps.value.substring(0, cursorPosition);
    const matchTerm = getMatchTermForChannelMention(value, isSearch);

    let myChannels;
    let otherChannels;
    let publicChannels;
    let privateChannels;
    let directAndGroupMessages;
    if (isSearch) {
        publicChannels = filterPublicChannels(state, matchTerm);
        privateChannels = filterPrivateChannels(state, matchTerm);
        directAndGroupMessages = filterDirectAndGroupMessages(state, matchTerm);
    } else {
        myChannels = filterMyChannels(state, matchTerm);
        otherChannels = filterOtherChannels(state, matchTerm);
    }

    return {
        myChannels,
        myMembers: getMyChannelMemberships(state),
        otherChannels,
        publicChannels,
        privateChannels,
        directAndGroupMessages,
        currentTeamId: getCurrentTeamId(state),
        matchTerm,
        requestStatus: state.requests.channels.getChannels.status,
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            autocompleteChannelsForSearch,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelMention);
