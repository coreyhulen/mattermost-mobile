// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {MM_TABLES} from '@constants/database';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import ChannelIcon from '@components/channel_icon';
import CompassIcon from '@components/compass_icon';
import CustomStatusEmoji from '@components/custom_status/custom_status_emoji';
import FormattedText from '@components/formatted_text';
import {General} from '@constants';
import {useTheme} from '@context/theme';
import {isCustomStatusEnabled} from '@utils/general';
import {isGuest as isTeamMateGuest} from '@utils/user';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {t} from '@utils/i18n';

import type ChannelInfoModel from '@typings/database/models/servers/channel_info';
import type ChannelModel from '@typings/database/models/servers/channel';
import type MyChannelSettingsModel from '@typings/database/models/servers/my_channel_settings';
import type UserModel from '@typings/database/models/servers/user';
import type {Database} from '@nozbe/watermelondb';

const ConnectedChannelTitle = ({channel, config, onPress, canHaveSubtitle, currentUserId, channelInfo, channelSettings, teammateId, teammate}: ChannelTitleProps) => {
    const theme = useTheme();

    const style = getStyle(theme);
    const channelType = channel.type;
    const currentChannelName = channel ? channel.displayName : '';
    const displayName = channel.displayName;
    const hasGuests = channelInfo[0]?.guestCount > 0;
    const isArchived = channel.deleteAt !== 0;
    const isChannelMuted = channelSettings[0]?.notifyProps?.mark_unread === 'mention';
    const isChannelShared = false; // fixme you need to track down this value =>  currentChannel?.shared,

    let isGuest = false;
    let isSelfDMChannel = false;
    let wrapperWidth = 90;

    if (channel.type === General.DM_CHANNEL && teammate) {
        isGuest = isTeamMateGuest(teammate.roles);

        // fixme: channel.teammate_id  where do we get it ?
        isSelfDMChannel = currentUserId === teammateId;
    }

    const renderArchiveIcon = () => {
        let content = null;
        if (isArchived) {
            content = (
                <CompassIcon
                    name='archive-outline'
                    style={[style.archiveIcon]}
                />
            );
        }
        return content;
    };

    const renderHasGuestsText = () => {
        if (!canHaveSubtitle) {
            return null;
        }
        if (!isGuest && !hasGuests) {
            return null;
        }
        if (channelType === General.DM_CHANNEL && !isGuest) {
            return null;
        }

        let messageId;
        let defaultMessage;
        if (channelType === General.DM_CHANNEL) {
            messageId = t('channel.isGuest');
            defaultMessage = 'This person is a guest';
        } else if (channelType === General.GM_CHANNEL) {
            messageId = t('channel.hasGuests');
            defaultMessage = 'This group message has guests';
        } else if (
            channelType === General.OPEN_CHANNEL ||
            channelType === General.PRIVATE_CHANNEL
        ) {
            messageId = t('channel.channelHasGuests');
            defaultMessage = 'This channel has guests';
        } else {
            return null;
        }
        return (
            <View style={style.guestsWrapper}>
                <FormattedText
                    numberOfLines={1}
                    ellipsizeMode='tail'
                    id={messageId}
                    defaultMessage={defaultMessage}
                    style={style.guestsText}
                />
            </View>
        );
    };

    const renderChannelIcon = () => {
        if (isChannelShared) {
            return (
                <ChannelIcon
                    isActive={true}
                    isArchived={false}

                    // isBot={false}
                    size={18}
                    shared={isChannelShared}
                    style={style.channelIconContainer}
                    theme={theme}
                    type={channelType}
                />
            );
        }
        return null;
    };

    const renderChannelDisplayName = () => {
        const channelDisplayName = displayName || currentChannelName;

        if (isSelfDMChannel) {
            const messageId = t('channel_header.directchannel.you');
            const defaultMessage = '{displayname} (you)';
            const values = {displayname: channelDisplayName};

            return (
                <FormattedText
                    id={messageId}
                    defaultMessage={defaultMessage}
                    values={values}
                />
            );
        }

        return channelDisplayName;
    };

    const renderMutedIcon = () => {
        if (isChannelMuted) {
            wrapperWidth -= 10;
            return (
                <CompassIcon
                    style={[style.icon, style.muted]}
                    size={24}
                    name='bell-off-outline'
                />
            );
        }
        return null;
    };

    const renderCustomStatus = () => {
        if (channelType === General.DM_CHANNEL && isCustomStatusEnabled(config)) {
            wrapperWidth -= 10;

            return (
                <CustomStatusEmoji
                    userId={teammateId}
                    emojiSize={16}
                    style={StyleSheet.flatten([...style.icon, ...style.emoji])}
                />
            );
        }
        return null;
    };

    const renderIcon = () => {
        //fixme: is this correct ?
        // if (channelDisplayName) {
        return (
            <CompassIcon
                style={style.icon}
                size={24}
                name='chevron-down'
            />
        );

        // }
        // return null;
    };

    return (
        <TouchableOpacity
            testID={'channel.title.button'}
            style={style.container}
            onPress={onPress}
        >
            <View style={[style.wrapper, {width: `${wrapperWidth}%`}]}>
                {renderArchiveIcon()}
                <Text
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    style={style.text}
                    testID='channel.nav_bar.title'
                >
                    {renderChannelDisplayName()}
                </Text>
                {renderChannelIcon()}
                {renderIcon()}
                {renderCustomStatus()}
                {renderMutedIcon()}
            </View>
            {renderHasGuestsText()}
        </TouchableOpacity>
    );
};

const getStyle = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        wrapper: {
            alignItems: 'center',
            flex: 1,
            position: 'relative',
            top: -1,
            flexDirection: 'row',
            justifyContent: 'flex-start',
        },
        icon: {
            color: theme.sidebarHeaderTextColor,
            marginHorizontal: 1,
        },
        emoji: {
            marginHorizontal: 5,
        },
        text: {
            color: theme.sidebarHeaderTextColor,
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            flex: 0,
            flexShrink: 1,
        },
        channelIconContainer: {
            marginLeft: 3,
            marginRight: 0,
        },
        muted: {
            marginTop: 1,
            opacity: 0.6,
            marginLeft: 0,
        },
        archiveIcon: {
            fontSize: 17,
            color: theme.sidebarHeaderTextColor,
            paddingRight: 7,
        },
        guestsWrapper: {
            alignItems: 'flex-start',
            flex: 1,
            position: 'relative',
            top: -1,
            width: '90%',
        },
        guestsText: {
            color: theme.sidebarHeaderTextColor,
            fontSize: 14,
            opacity: 0.6,
        },
    };
});

type ChannelTitleInputProps = {
    canHaveSubtitle: boolean;
    channel: ChannelModel;
    config: ClientConfig;
    currentUserId: string;
    teammateId?: string;
    onPress: () => void;
};

type ChannelTitleProps = ChannelTitleInputProps & {
    channelInfo: ChannelInfoModel[];
    channelSettings: MyChannelSettingsModel[];
    database: Database;
    teammate?: UserModel;
    teammateId: string;
};

const ChannelTitle: React.FunctionComponent<ChannelTitleInputProps> =
    withDatabase(
        withObservables(['channel', 'teammateId', 'teammateId'], ({channel, teammateId, database}: { channel: ChannelModel; teammateId: string; database: Database }) => {
            return {
                channelInfo: channel.info.observe(),
                channelSettings: channel.settings.observe(),
                ...(teammateId && {teammate: database.collections.get(MM_TABLES.SERVER.USER).findAndObserve(teammateId)}),
            };
        },
        )(ConnectedChannelTitle),
    );

export default ChannelTitle;
