// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {intlShape} from 'react-intl';
import {Text} from 'react-native';

import {popToRoot, dismissAllModals} from '@actions/navigation';
import {alertErrorWithFallback} from '@utils/general';
import {t} from '@utils/i18n';

import {getChannelFromChannelName} from './channel_link_utils';

export default class ChannelLink extends React.PureComponent {
    static propTypes = {
        channelName: PropTypes.string.isRequired,
        channelMentions: PropTypes.object,
        currentTeamId: PropTypes.string.isRequired,
        currentUserId: PropTypes.string.isRequired,
        linkStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        onChannelLinkPress: PropTypes.func,
        textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        channelsByName: PropTypes.object.isRequired,
        actions: PropTypes.shape({
            handleSelectChannel: PropTypes.func.isRequired,
            joinChannel: PropTypes.func.isRequired,
        }).isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            channel: getChannelFromChannelName(props.channelName, props.channelsByName),
        };
    }

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextChannel = getChannelFromChannelName(nextProps.channelName, nextProps.channelsByName);
        if (nextChannel !== prevState.channel) {
            return {channel: nextChannel};
        }

        return null;
    }

    handlePress = async () => {
        let {channel} = this.state;

        if (!channel.id && channel.display_name) {
            const {
                actions,
                channelName,
                currentTeamId,
                currentUserId,
            } = this.props;

            const result = await actions.joinChannel(currentUserId, currentTeamId, null, channelName);
            if (result.error || !result.data || !result.data.channel) {
                const joinFailedMessage = {
                    id: t('mobile.join_channel.error'),
                    defaultMessage: "We couldn't join the channel {displayName}. Please check your connection and try again.",
                };
                alertErrorWithFallback(this.context.intl, result.error || {}, joinFailedMessage, channel.display_name);
            } else if (result?.data?.channel) {
                channel = result.data.channel;
            }
        }

        if (channel.id) {
            const {handleSelectChannel} = this.props.actions;
            handleSelectChannel(channel.id);

            await dismissAllModals();
            await popToRoot();

            if (this.props.onChannelLinkPress) {
                this.props.onChannelLinkPress(channel);
            }
        }
    }

    render() {
        const channel = this.state.channel;

        if (!channel) {
            return <Text style={this.props.textStyle}>{`~${this.props.channelName}`}</Text>;
        }

        let suffix;
        if (channel.name) {
            suffix = this.props.channelName.substring(channel.name.length);
        }

        return (
            <Text style={this.props.textStyle}>
                <Text
                    style={this.props.linkStyle}
                    onPress={this.handlePress}
                >
                    {`~${channel.display_name}`}
                </Text>
                {suffix}
            </Text>
        );
    }
}
