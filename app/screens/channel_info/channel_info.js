// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {intlShape} from 'react-intl';
import {
    ScrollView,
    View,
} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {dismissModal} from '@actions/navigation';
import StatusBar from '@components/status_bar';
import {alertErrorWithFallback} from '@utils/general';
import {t} from '@utils/i18n';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import AddMembers from './add_members';
import NotificationPreference from './notification_preference';
import Archive from './archive';
import ChannelInfoHeader from './channel_info_header';
import ConvertPrivate from './convert_private';
import EditChannel from './edit_channel';
import Favorite from './favorite';
import IgnoreMentions from './ignore_mentions';
import Leave from './leave';
import ManageMembers from './manage_members';
import Mute from './mute';
import Pinned from './pinned';
import Separator from './separator';
import Bindings from './bindings';

export default class ChannelInfo extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            getChannelStats: PropTypes.func.isRequired,
            getCustomEmojisInText: PropTypes.func.isRequired,
            setChannelDisplayName: PropTypes.func.isRequired,
        }),
        currentChannel: PropTypes.object.isRequired,
        currentChannelCreatorName: PropTypes.string,
        currentChannelGuestCount: PropTypes.number,
        currentChannelMemberCount: PropTypes.number,
        currentUserId: PropTypes.string,
        isTeammateGuest: PropTypes.bool.isRequired,
        isDirectMessage: PropTypes.bool.isRequired,
        teammateId: PropTypes.string,
        theme: PropTypes.object.isRequired,
        customStatus: PropTypes.object,
        isCustomStatusEnabled: PropTypes.bool.isRequired,
        isCustomStatusExpired: PropTypes.bool.isRequired,
        isCustomStatusExpirySupported: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        currentChannelGuestCount: 0,
    }

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
        this.props.actions.getChannelStats(this.props.currentChannel.id);
        this.props.actions.getCustomEmojisInText(this.props.currentChannel.header);
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === 'close-info') {
            dismissModal();
        }
    }

    close = (redirect = true) => {
        const {actions} = this.props;

        if (redirect) {
            actions.setChannelDisplayName('');
        }

        dismissModal();
    };

    permalinkBadTeam = () => {
        const {intl} = this.context;
        const message = {
            id: t('mobile.server_link.unreachable_team.error'),
            defaultMessage: 'This link belongs to a deleted team or to a team to which you do not have access.',
        };

        alertErrorWithFallback(intl, {}, message);
    };

    actionsRows = (channelIsArchived) => {
        const {currentChannel, currentUserId, isDirectMessage, theme} = this.props;

        if (channelIsArchived) {
            return (
                <ManageMembers
                    theme={theme}
                    separator={false}
                />);
        }

        return (
            <>
                <Favorite
                    testID='channel_info.favorite.action'
                    channelId={currentChannel.id}
                    theme={theme}
                />
                <Separator theme={theme}/>
                <Mute
                    testID='channel_info.mute.action'
                    channelId={currentChannel.id}
                    userId={currentUserId}
                    theme={theme}
                />
                <Separator theme={theme}/>
                <IgnoreMentions
                    testID='channel_info.ignore_mentions.action'
                    channelId={currentChannel.id}
                    theme={theme}
                />
                <Separator theme={theme}/>
                {!isDirectMessage &&
                <>
                    <NotificationPreference
                        testID='channel_info.notification_preference.action'
                        theme={theme}
                    />
                    <Separator theme={theme}/>
                </>
                }
                <Pinned
                    testID='channel_info.pinned_messages.action'
                    channelId={currentChannel.id}
                    theme={theme}
                />
                <ManageMembers
                    testID='channel_info.manage_members.action'
                    theme={theme}
                />
                <AddMembers
                    testID='channel_info.add_members.action'
                    theme={theme}
                />
                <ConvertPrivate
                    testID='channel_info.convert_private.action'
                    theme={theme}
                />
                <EditChannel
                    testID='channel_info.edit_channel.action'
                    theme={theme}
                />
                <Bindings
                    theme={theme}
                />
            </>
        );
    };

    render() {
        const {
            currentChannel,
            currentChannelCreatorName,
            currentChannelMemberCount,
            currentChannelGuestCount,
            teammateId,
            theme,
            isTeammateGuest,
            customStatus,
            isCustomStatusEnabled,
            isCustomStatusExpired,
            isCustomStatusExpirySupported,
        } = this.props;

        const style = getStyleSheet(theme);
        const channelIsArchived = currentChannel.delete_at !== 0;

        return (
            <SafeAreaView
                testID='channel_info.screen'
                style={style.container}
                edges={['bottom', 'left', 'right']}
            >
                <StatusBar/>
                <ScrollView
                    style={style.scrollView}
                    testID='channel_info.scroll_view'
                >
                    {Boolean(currentChannel?.id) &&
                    <ChannelInfoHeader
                        createAt={currentChannel.create_at}
                        creator={currentChannelCreatorName}
                        displayName={currentChannel.display_name}
                        header={currentChannel.header}
                        memberCount={currentChannelMemberCount}
                        purpose={currentChannel.purpose}
                        shared={currentChannel.shared}
                        teammateId={teammateId}
                        theme={theme}
                        type={currentChannel.type}
                        isArchived={channelIsArchived}
                        isTeammateGuest={isTeammateGuest}
                        hasGuests={currentChannelGuestCount > 0}
                        isGroupConstrained={currentChannel.group_constrained}
                        testID='channel_info.header'
                        customStatus={customStatus}
                        isCustomStatusEnabled={isCustomStatusEnabled}
                        isCustomStatusExpired={isCustomStatusExpired}
                        isCustomStatusExpirySupported={isCustomStatusExpirySupported}
                    />
                    }
                    <View style={style.rowsContainer}>
                        {this.actionsRows(channelIsArchived)}
                    </View>
                    <View style={style.footer}>
                        <Leave
                            close={this.close}
                            testID='channel_info.leave.action'
                            theme={theme}
                        />
                        <Archive
                            close={this.close}
                            testID='channel_info.archive.action'
                            theme={theme}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
        },
        footer: {
            marginTop: 40,
        },
        rowsContainer: {
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
            backgroundColor: theme.centerChannelBg,
        },
    };
});
