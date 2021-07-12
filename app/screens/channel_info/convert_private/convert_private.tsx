// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Alert} from 'react-native';

import {ActionResult} from '@mm-redux/types/actions';
import {Theme} from '@mm-redux/types/preferences';
import ChannelInfoRow from '@screens/channel_info/channel_info_row';
import Separator from '@screens/channel_info/separator';
import {alertErrorWithFallback} from '@utils/general';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';

interface ConvertPrivateProps {
    testID?: string;
    canConvert: boolean;
    channelId: string;
    convertChannelToPrivate: (channelId: string) => Promise<ActionResult>;
    displayName: string;
    theme: Theme;
}

export default class ConvertPrivate extends PureComponent<ConvertPrivateProps> {
    static contextTypes = {
        intl: intlShape.isRequired,
    };

    handleConfirmConvertToPrivate = preventDoubleTap(async () => {
        const {channelId, convertChannelToPrivate, displayName} = this.props;
        const result = await convertChannelToPrivate(channelId);
        const {formatMessage} = this.context.intl;
        if (result.error) {
            alertErrorWithFallback(
                this.context.intl,
                result.error,
                {
                    id: t('mobile.channel_info.convert_failed'),
                    defaultMessage: 'We were unable to convert {displayName} to a private channel.',
                },
                {
                    displayName,
                },
                [{
                    text: formatMessage({id: 'mobile.share_extension.error_close', defaultMessage: 'Close'}),
                }, {
                    text: formatMessage({id: 'mobile.terms_of_service.alert_retry', defaultMessage: 'Try Again'}),
                    onPress: this.handleConfirmConvertToPrivate,
                }],
            );
        } else {
            Alert.alert(
                '',
                formatMessage({id: t('mobile.channel_info.convert_success'), defaultMessage: '{displayName} is now a private channel.'}, {displayName}),
            );
        }
    });

    handleConvertToPrivate = preventDoubleTap(() => {
        const {displayName} = this.props;
        const {formatMessage} = this.context.intl;
        const title = {id: t('mobile.channel_info.alertTitleConvertChannel'), defaultMessage: 'Convert {displayName} to a private channel?'};
        const message = {
            id: t('mobile.channel_info.alertMessageConvertChannel'),
            defaultMessage: 'When you convert {displayName} to a private channel, history and membership are preserved. Publicly shared files remain accessible to anyone with the link. Membership in a private channel is by invitation only.\n\nThe change is permanent and cannot be undone.\n\nAre you sure you want to convert {displayName} to a private channel?',
        };

        Alert.alert(
            formatMessage(title, {displayName}),
            formatMessage(message, {displayName}),
            [{
                text: formatMessage({id: 'mobile.channel_info.alertNo', defaultMessage: 'No'}),
            }, {
                text: formatMessage({id: 'mobile.channel_info.alertYes', defaultMessage: 'Yes'}),
                onPress: this.handleConfirmConvertToPrivate,
            }],
        );
    });

    render() {
        const {canConvert, testID, theme} = this.props;

        if (!canConvert) {
            return null;
        }

        return (
            <>
                <Separator theme={theme}/>
                <ChannelInfoRow
                    testID={testID}
                    action={this.handleConvertToPrivate}
                    defaultMessage='Convert to Private Channel'
                    icon='lock'
                    rightArrow={false}
                    theme={theme}
                    textId={t('mobile.channel_info.convert')}
                />
            </>
        );
    }
}
