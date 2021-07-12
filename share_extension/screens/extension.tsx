// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Alert, NativeModules, View} from 'react-native';

import FormattedText from '@components/formatted_text';
import {captureException, initializeSentry, LOGGER_EXTENSION} from '@utils/sentry';

import Navigation from './navigation';

const NativeShareExtension = NativeModules.MattermostShare;

export default class ShareExtension extends PureComponent {
    static contextTypes = {
        intl: intlShape,
    };

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI.
        return {hasError: error};
    }

    state = {
        hasError: undefined,
    };

    componentDidMount() {
        initializeSentry();
    }

    componentDidCatch(error: Error) {
        const {intl, store} = this.context;
        const {formatMessage} = intl;

        captureException(error, LOGGER_EXTENSION, store);

        Alert.alert(
            formatMessage({
                id: 'mobile.share_extension.error_title',
                defaultMessage: 'Extension Error',
            }),
            formatMessage({
                id: 'mobile.share_extension.error_message',
                defaultMessage: 'An error has occurred while using the share extension.',
            }),
            [
                {
                    text: formatMessage({
                        id: 'mobile.share_extension.error_close',
                        defaultMessage: 'Close',
                    }),
                    onPress: this.close,
                },
            ],
        );
    }

    close = () => NativeShareExtension.close(null)

    render() {
        if (this.state.hasError) {
            return (
                <View>
                    <FormattedText
                        defaultMessage='Something went wrong'
                        id='mobile.failed_network_action.teams_title'
                    />
                </View>
            );
        }

        return <Navigation/>;
    }
}
