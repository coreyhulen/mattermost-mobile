// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Database} from '@nozbe/watermelondb';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React, {useEffect} from 'react';
import {useIntl} from 'react-intl';
import {SafeAreaView} from 'react-native-safe-area-context';

import StatusBar from '@components/status_bar';
import ViewTypes from '@constants/view';
import {MM_TABLES} from '@constants/database';
import {isMinimumServerVersion} from '@utils/helpers';
import {isSystemAdmin as checkIsSystemAdmin} from '@utils/user';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {unsupportedServer} from '@utils/supported_server/supported_server';

import ChannelNavBar from './channel_nav_bar';

import type ChannelModel from '@typings/database/models/servers/channel';
import type SystemModel from '@typings/database/models/servers/system';
import type UserModel from '@typings/database/models/servers/user';
import type {LaunchType} from '@typings/launch';
import {useTheme} from '@context/theme';

const {SERVER: {CHANNEL, SYSTEM, USER}} = MM_TABLES;

const Channel = ({launchType, channelRecord: channel, userRecord: user, configRecord: config, currentUserIdRecord}: ChannelProps) => {
    // TODO: If we have LaunchProps, ensure we load the correct channel/post/modal.
    // TODO: If LaunchProps.error is true, use the LaunchProps.launchType to determine which
    // error message to display. For example:
    // if (props.launchError) {
    //     let erroMessage;
    //     if (props.launchType === LaunchType.DeepLink) {
    //         errorMessage = intl.formatMessage({id: 'mobile.launchError.deepLink', defaultMessage: 'Did not find a server for this deep link'});
    //     } else if (props.launchType === LaunchType.Notification) {
    //         errorMessage = intl.formatMessage({id: 'mobile.launchError.notification', defaultMessage: 'Did not find a server for this notification'});
    //     }
    // }

    //todo: Read Messages  - Do we need KeyboardLayout component ?
    //todo: Read Messages  - Implement goToChannelInfo
    //todo: Read Messages  - handleLeaveTeam, runTypingAnimations, handleRemovedFromChannel, clearChannelNotifications, registerTypingAnimation, runTypingAnimations, loadChannels??, showTermsOfServiceModal,

    //todo: Read Messages - renderLoadingOrFailedChannel, MainSideBar, SettingsSideBar

    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    useEffect(() => {
        const serverVersion = (config.value?.Version) || '';
        const isSystemAdmin = checkIsSystemAdmin(user.roles);

        if (serverVersion) {
            const {RequiredServer: {MAJOR_VERSION, MIN_VERSION, PATCH_VERSION}} = ViewTypes;
            const isSupportedServer = isMinimumServerVersion(serverVersion, MAJOR_VERSION, MIN_VERSION, PATCH_VERSION);

            if (!isSupportedServer) {
            // Only display the Alert if the TOS does not need to show first
                unsupportedServer(isSystemAdmin, intl.formatMessage);
            }
        }
    }, [config.value?.Version, intl.formatMessage, user.roles]);

    return (
        <SafeAreaView
            style={styles.flex}
            mode='margin'
            edges={['left', 'right', 'bottom']}
        >
            <StatusBar theme={theme}/>
            <ChannelNavBar
                currentUserId={currentUserIdRecord.value}
                channel={channel}
                onPress={() => null}
                config={config.value}
            />
            <ChannelPostList registerTypingAnimation={registerTypingAnimation}/>
        </SafeAreaView>
    );
};

const getStyleSheet = makeStyleSheetFromTheme(() => ({
    flex: {
        flex: 1,

    },
}));

// TODO: Move as helper methods
type WithDatabaseArgs = { database: Database }
type WithChannelAndThemeArgs = WithDatabaseArgs & {
    currentChannelIdRecord: SystemModel;
    currentUserIdRecord: SystemModel;
}
type ChannelProps = WithDatabaseArgs & {
    channelRecord: ChannelModel;
    configRecord: SystemModel;
    launchType: LaunchType;
    userRecord: UserModel;
    currentUserIdRecord: SystemModel;
};

export const withSystemIds = withObservables([], ({database}: WithDatabaseArgs) => ({
    currentChannelIdRecord: database.collections.get(SYSTEM).findAndObserve('currentChannelId'),
    currentUserIdRecord: database.collections.get(SYSTEM).findAndObserve('currentUserId'),
    configRecord: database.collections.get(SYSTEM).findAndObserve('config'),
}));

const withChannelAndTheme = withObservables(['currentChannelIdRecord'], ({currentChannelIdRecord, currentUserIdRecord, database}: WithChannelAndThemeArgs) => ({
    channelRecord: database.collections.get(CHANNEL).findAndObserve(currentChannelIdRecord.value),
    userRecord: database.collections.get(USER).findAndObserve(currentUserIdRecord.value),
}));

export default withDatabase(withSystemIds(withChannelAndTheme(Channel)));
