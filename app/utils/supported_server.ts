// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Alert, AlertButton} from 'react-native';

import {ViewTypes} from '@constants';
import {tryOpenURL} from '@utils/url';

interface FormatObjectType {
    id: string;
    defaultMessage: string;
}

interface FormatMessageType {
    (obj: FormatObjectType, values?: any): string;
}

export function unsupportedServer(isSystemAdmin: boolean, formatMessage: FormatMessageType) {
    if (isSystemAdmin) {
        unsupportedServerAdminAlert(formatMessage);
    } else {
        unsupportedServerAlert(formatMessage);
    }
}

function unsupportedServerAdminAlert(formatMessage: FormatMessageType) {
    const title = formatMessage({id: 'mobile.server_upgrade.title', defaultMessage: 'Server upgrade required'});
    const message = formatMessage({
        id: 'mobile.server_upgrade.alert_description',
        defaultMessage: 'This server version is unsupported and users will be exposed to compatibility issues that cause crashes or severe bugs breaking core functionality of the app. Upgrading to server version {serverVersion} or later is required.',
    }, {serverVersion: ViewTypes.RequiredServer.FULL_VERSION});
    const cancel: AlertButton = {
        text: formatMessage({id: 'mobile.server_upgrade.dismiss', defaultMessage: 'Dismiss'}),
        style: 'default',
    };
    const learnMore: AlertButton = {
        text: formatMessage({id: 'mobile.server_upgrade.learn_more', defaultMessage: 'Learn More'}),
        style: 'cancel',
        onPress: () => {
            const url = 'https://docs.mattermost.com/administration/release-lifecycle.html';
            const onError = () => {
                Alert.alert(
                    formatMessage({
                        id: 'mobile.link.error.title',
                        defaultMessage: 'Error',
                    }),
                    formatMessage({
                        id: 'mobile.link.error.text',
                        defaultMessage: 'Unable to open the link.',
                    }),
                );
            };

            tryOpenURL(url, onError);
        },
    };
    const buttons: AlertButton[] = [cancel, learnMore];
    const options = {cancelable: false};

    Alert.alert(title, message, buttons, options);
}

function unsupportedServerAlert(formatMessage: FormatMessageType) {
    const title = formatMessage({id: 'mobile.unsupported_server.title', defaultMessage: 'Unsupported server version'});
    const message = formatMessage({
        id: 'mobile.unsupported_server.message',
        defaultMessage: 'Attachments, link previews, reactions and embed data may not be displayed correctly. If this issue persists contact your System Administrator to upgrade your Mattermost server.',
    });
    const okButton: AlertButton = {
        text: formatMessage({id: 'mobile.unsupported_server.ok', defaultMessage: 'OK'}),
        style: 'default',
    };

    const buttons: AlertButton[] = [okButton];
    const options = {cancelable: false};

    Alert.alert(title, message, buttons, options);
}
