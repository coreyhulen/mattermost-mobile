// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {IntlProvider} from 'react-intl';
import {Navigation, NavigationFunctionComponent} from 'react-native-navigation';
import {Platform, StyleProp, ViewStyle} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';

import {withManagedConfig} from '@mattermost/react-native-emm';

import {Screens} from '@constants';
import {DEFAULT_LOCALE, getTranslations} from '@i18n';

import {withServerDatabase} from '@database/components';

// TODO: Remove this and uncomment screens as they get added
/* eslint-disable */

const withGestures = (screen: NavigationFunctionComponent, styles: StyleProp<ViewStyle>) => {
    if (Platform.OS === 'android') {
        return gestureHandlerRootHOC(screen, styles);
    }

    return screen;
};

const withIntl = (Screen: React.ComponentType) => {
    return function IntlEnabledComponent(props: any) {
        return (
            <IntlProvider
                locale={DEFAULT_LOCALE}
                messages={getTranslations()}
            >
                <Screen {...props}/>
            </IntlProvider>
    );
        }
}

const withSafeAreaInsets = (Screen: React.ComponentType) => {
    return function SafeAreaInsets(props: any){
        return (
            <SafeAreaProvider>
                <Screen {...props} />
            </SafeAreaProvider>
        )
    }
}

Navigation.setLazyComponentRegistrator((screenName) => {
    let screen: any|undefined;
    let extraStyles: StyleProp<ViewStyle>;
    switch (screenName) {
    // case 'About':
    //     screen = require('@screens/about').default;
    //     break;
    // case 'AddReaction':
    //     screen = require('@screens/add_reaction').default;
    //     break;
    // case 'AdvancedSettings':
    //     screen = require('@screens/settings/advanced_settings').default;
    //     break;
    // case 'ChannelAddMembers':
    //     screen = require('@screens/channel_add_members').default;
    //     break;
    // case 'ChannelInfo':
    //     screen = require('@screens/channel_info').default;
    //     break;
    // case 'ChannelMembers':
    //     screen = require('@screens/channel_members').default;
    //     break;
    // case 'ChannelNotificationPreference':
    //     screen = require('@screens/channel_notification_preference').default;
    //     break;
    // case 'ClientUpgrade':
    //     screen = require('@screens/client_upgrade').default;
    //     break;
    // case 'ClockDisplaySettings':
    //     screen = require('@screens/settings/clock_display').default;
    //     break;
    // case 'Code':
    //     screen = require('@screens/code').default;
    //     break;
    // case 'CreateChannel':
    //     screen = require('@screens/create_channel').default;
    //     break;
    // case 'DisplaySettings':
    //     screen = require('@screens/settings/display_settings').default;
    //     break;
    // case 'EditChannel':
    //     screen = require('@screens/edit_channel').default;
    //     break;
    // case 'EditPost':
    //     screen = require('@screens/edit_post').default;
    //     break;
    // case 'EditProfile':
    //     screen = require('@screens/edit_profile').default;
    //     break;
    // case 'ErrorTeamsList':
    //     screen = require('@screens/error_teams_list').default;
    //     break;
    // case 'ExpandedAnnouncementBanner':
    //     screen = require('@screens/expanded_announcement_banner').default;
    //     break;
    // case 'FlaggedPosts':
    //     screen = require('@screens/flagged_posts').default;
    //     break;
    case 'ForgotPassword':
        screen = require('@screens/forgot_password').default;
        break;
    // case 'Gallery':
    //     screen = require('@screens/gallery').default;
    //     break;
    // case 'InteractiveDialog':
    //     screen = require('@screens/interactive_dialog').default;
    //     break;
    case 'Login':
        screen = require('@screens/login').default;
        break;
    case 'LoginOptions':
        screen = require('@screens/login_options').default;
        break;
    // case 'LongPost':
    //     screen = require('@screens/long_post').default;
    //     break;
    // case 'MainSidebar':
    //     screen = require('app/components/sidebars/main').default;
    //     break;
    case 'MFA':
        screen = require('@screens/mfa').default;
        break;
    // case 'MoreChannels':
    //     screen = require('@screens/more_channels').default;
    //     break;
    // case 'MoreDirectMessages':
    //     screen = require('@screens/more_dms').default;
    //     break;
    // case 'Notification':
    //     extraStyles = Platform.select({android: {flex: undefined, height: 100}});
    //     screen = require('@screens/notification/index.tsx').default;
    //     break;
    // case 'NotificationSettings':
    //     screen = require('@screens/settings/notification_settings').default;
    //     break;
    // case 'NotificationSettingsAutoResponder':
    //     screen = require('@screens/settings/notification_settings_auto_responder').default;
    //     break;
    // case 'NotificationSettingsEmail':
    //     screen = require('@screens/settings/notification_settings_email').default;
    //     break;
    // case 'NotificationSettingsMentions':
    //     screen = require('@screens/settings/notification_settings_mentions').default;
    //     break;
    // case 'NotificationSettingsMentionsKeywords':
    //     screen = require('@screens/settings/notification_settings_mentions_keywords').default;
    //     break;
    // case 'NotificationSettingsMobile':
    //     screen = require('@screens/settings/notification_settings_mobile').default;
    //     break;
    // case 'OptionsModal':
    //     screen = require('@screens/options_modal').default;
    //     break;
    // case 'Permalink':
    //     screen = require('@screens/permalink').default;
    //     break;
    // case 'PinnedPosts':
    //     screen = require('@screens/pinned_posts').default;
    //     break;
    // case 'PostOptions':
    //     screen = require('@screens/post_options').default;
    //     break;
    // case 'ReactionList':
    //     screen = require('@screens/reaction_list').default;
    //     break;
    // case 'RecentMentions':
    //     screen = require('@screens/recent_mentions').default;
    //     break;
    // case 'Search':
    //     screen = require('@screens/search').default;
    //     break;
    // case 'SelectorScreen':
    //     screen = require('@screens/selector_screen').default;
    //     break;
    // case 'SelectTeam':
    //     screen = require('@screens/select_team').default;
    //     break;
    // case 'SelectTimezone':
    //     screen = require('@screens/settings/timezone/select_timezone').default;
    //     break;
    // case 'Settings':
    //     screen = require('@screens/settings/general').default;
    //     break;
    // case 'SettingsSidebar':
    //     screen = require('app/components/sidebars/settings').default;
    //     break;
    // case 'SidebarSettings':
    //     screen = require('@screens/settings/sidebar').default;
    //     break;
    case 'SSO':
        screen = require('@screens/sso').default;
        break;
    // case 'Table':
    //     screen = require('@screens/table').default;
    //     break;
    // case 'TermsOfService':
    //     screen = require('@screens/terms_of_service').default;
    //     break;
    // case 'ThemeSettings':
    //     screen = require('@screens/settings/theme').default;
    //     break;
    // case 'Thread':
    //     screen = require('@screens/thread').default;
    //     break;
    // case 'TimezoneSettings':
    //     screen = require('@screens/settings/timezone').default;
    //     break;
    // case 'UserProfile':
    //     screen = require('@screens/user_profile').default;
    //     break;
    }

    if (screen) {
        Navigation.registerComponent(screenName, () => withGestures(withIntl(withManagedConfig(screen)), extraStyles));
    }
});

export function registerScreens() {
    const channelScreen = require('@screens/channel').default;
    const serverScreen = require('@screens/server').default;

    Navigation.registerComponent(Screens.CHANNEL, () => withSafeAreaInsets(withIntl(withServerDatabase(withManagedConfig(channelScreen)))));
    Navigation.registerComponent(Screens.SERVER, () => withIntl(withManagedConfig(serverScreen)));
}
