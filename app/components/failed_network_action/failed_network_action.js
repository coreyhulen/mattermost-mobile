// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Text, View} from 'react-native';
import Button from 'react-native-button';

import {INDICATOR_BAR_HEIGHT} from '@constants/view';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import Cloud from './cloud';

export default class FailedNetworkAction extends PureComponent {
    static propTypes = {
        actionText: PropTypes.string,
        errorMessage: PropTypes.string,
        errorTitle: PropTypes.string,
        isLandscape: PropTypes.bool.isRequired,
        onRetry: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    render() {
        const {formatMessage} = this.context.intl;
        const {onRetry, theme} = this.props;
        const style = getStyleFromTheme(theme);

        const actionText = this.props.actionText || formatMessage({
            id: 'mobile.failed_network_action.retry',
            defaultMessage: 'Try again',
        });
        const errorTitle = this.props.errorTitle || formatMessage({
            id: 'mobile.failed_network_action.title',
            defaultMessage: 'No internet connection',
        });
        const errorMessage = this.props.errorMessage || formatMessage({
            id: 'mobile.failed_network_action.shortDescription',
            defaultMessage: 'Messages will load when you have an internet connection.',
        });

        return (
            <View style={style.container}>
                { !this.props.isLandscape &&
                    <Cloud
                        color={changeOpacity(theme.centerChannelColor, 0.15)}
                        height={76}
                        width={76}
                    />
                }
                <Text
                    style={style.title}
                    testID='error_title'
                >
                    {errorTitle}
                </Text>
                <Text
                    style={style.description}
                    testID='error_text'
                >
                    {errorMessage}
                </Text>
                <Button
                    onPress={onRetry}
                    containerStyle={style.buttonContainer}
                >
                    <Text style={style.link}>{actionText}</Text>
                </Button>
            </View>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 15,
            paddingVertical: INDICATOR_BAR_HEIGHT,
            paddingBottom: 15,
        },
        title: {
            color: changeOpacity(theme.centerChannelColor, 0.8),
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 15,
            marginTop: 10,
        },
        description: {
            color: changeOpacity(theme.centerChannelColor, 0.4),
            fontSize: 17,
            lineHeight: 25,
            textAlign: 'center',
        },
        link: {
            color: theme.buttonColor,
            fontSize: 15,
        },
        buttonContainer: {
            backgroundColor: theme.buttonBg,
            borderRadius: 5,
            height: 42,
            justifyContent: 'center',
            marginTop: 20,
            paddingHorizontal: 12,
        },
    };
});
