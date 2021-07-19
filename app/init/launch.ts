// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setupChannelMockData} from '@test/mock_database_data';
import {Linking} from 'react-native';
import {Notifications} from 'react-native-notifications';

import {Screens} from '@constants';
import {getActiveServerUrl, getServerCredentials} from '@init/credentials';
import {goToScreen, resetToChannel, resetToSelectServer} from '@screens/navigation';
import {parseDeepLink} from '@utils/url';

import {DeepLinkChannel, DeepLinkDM, DeepLinkGM, DeepLinkPermalink, DeepLinkType, DeepLinkWithData, LaunchProps, LaunchType} from '@typings/launch';

export const initialLaunch = async () => {
    const deepLinkUrl = await Linking.getInitialURL();
    if (deepLinkUrl) {
        launchAppFromDeepLink(deepLinkUrl);
        return;
    }

    const notification = await Notifications.getInitialNotification();
    if (notification && notification.payload?.type === 'message') {
        launchAppFromNotification(notification);
        return;
    }

    launchApp({launchType: LaunchType.Normal});
};

const launchAppFromDeepLink = (deepLinkUrl: string) => {
    const props = getLaunchPropsFromDeepLink(deepLinkUrl);
    launchApp(props);
};

const launchAppFromNotification = (notification: NotificationWithData) => {
    const props = getLaunchPropsFromNotification(notification);
    launchApp(props);
};

const launchApp = async (props: LaunchProps, resetNavigation = true) => {
    let serverUrl;
    switch (props?.launchType) {
        case LaunchType.DeepLink:
            if (props.extra?.type !== DeepLinkType.Invalid) {
                const extra = props.extra as DeepLinkWithData;
                serverUrl = extra.data?.serverUrl;
            }
            break;
        case LaunchType.Notification: {
            const extra = props.extra as NotificationWithData;
            serverUrl = extra.payload?.server_url;
            break;
        }
    }
    serverUrl = await getActiveServerUrl();

    if (serverUrl) {
        const credentials = await getServerCredentials(serverUrl);
        await setupChannelMockData();
        if (credentials) {
            launchToChannel({...props, serverUrl}, resetNavigation);
            return;
        }
    }

    launchToServer(props, resetNavigation);
};

const launchToChannel = (props: LaunchProps, resetNavigation: Boolean) => {
    // TODO: Use LaunchProps to fetch posts for channel and then load user profile, etc...

    const passProps = {
        skipMetrics: true,
        ...props,
    };

    if (resetNavigation) {
        // eslint-disable-next-line no-console
        console.log('Launch app in Channel screen');
        resetToChannel(passProps);
        return;
    }

    const title = '';
    goToScreen(Screens.CHANNEL, title, passProps);
};

const launchToServer = (props: LaunchProps, resetNavigation: Boolean) => {
    if (resetNavigation) {
        resetToSelectServer(props);
        return;
    }

    const title = '';
    goToScreen(Screens.SERVER, title, {...props});
};

export const relaunchApp = (props: LaunchProps, resetNavigation = false) => {
    launchApp(props, resetNavigation);
};

export const getLaunchPropsFromDeepLink = (deepLinkUrl: string): LaunchProps => {
    const parsed = parseDeepLink(deepLinkUrl);
    const launchProps: LaunchProps = {
        launchType: LaunchType.DeepLink,
    };

    switch (parsed.type) {
        case DeepLinkType.Invalid:
            launchProps.launchError = true;
            break;
        case DeepLinkType.Channel: {
            const parsedData = parsed.data as DeepLinkChannel;
            (launchProps.extra as DeepLinkWithData).data = parsedData;
            break;
        }
        case DeepLinkType.DirectMessage: {
            const parsedData = parsed.data as DeepLinkDM;
            (launchProps.extra as DeepLinkWithData).data = parsedData;
            break;
        }
        case DeepLinkType.GroupMessage: {
            const parsedData = parsed.data as DeepLinkGM;
            (launchProps.extra as DeepLinkWithData).data = parsedData;
            break;
        }
        case DeepLinkType.Permalink: {
            const parsedData = parsed.data as DeepLinkPermalink;
            (launchProps.extra as DeepLinkWithData).data = parsedData;
            break;
        }
    }

    return launchProps;
};

export const getLaunchPropsFromNotification = (notification: NotificationWithData): LaunchProps => {
    const {payload} = notification;
    const launchProps: LaunchProps = {
        launchType: LaunchType.Notification,
    };

    if (payload?.server_url) {
        (launchProps.extra as NotificationWithData) = notification;
    } else {
        launchProps.launchError = true;
    }

    return launchProps;
};
