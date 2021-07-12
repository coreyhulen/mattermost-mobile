// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Alert} from 'react-native';

import {ActionResult} from '@mm-redux/types/actions';
import {FormattedMsg} from '@mm-redux/types/general';
import {Theme} from '@mm-redux/types/preferences';
import ChannelInfoRow from '@screens/channel_info/channel_info_row';
import Separator from '@screens/channel_info/separator';
import {alertErrorWithFallback} from '@utils/general';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';

interface ArchiveProps {
    canArchive: boolean;
    canUnarchive: boolean;
    channelId: string;
    close: (redirect: boolean) => void;
    deleteChannel: (channelId: string) => Promise<ActionResult>;
    displayName: string;
    getChannel: (channelId: string) => Promise<ActionResult>;
    handleSelectChannel: (channelId: string) => Promise<ActionResult>;
    isPublic: boolean;
    unarchiveChannel: (channelId: string) => Promise<ActionResult>;
    selectPenultimateChannel: (channelId: string) => Promise<ActionResult>;
    teamId: string;
    testID?: string;
    theme: Theme;
    viewArchivedChannels: boolean;
}

export default class Archive extends PureComponent<ArchiveProps> {
    static contextTypes = {
        intl: intlShape.isRequired,
    };

    alertAndHandleYesAction = (title: FormattedMsg, message: FormattedMsg, onPressAction: () => void) => {
        const {formatMessage} = this.context.intl;
        const {displayName, isPublic} = this.props;

        // eslint-disable-next-line multiline-ternary
        const term = isPublic ? formatMessage({id: 'mobile.channel_info.publicChannel', defaultMessage: 'Public Channel'}) :
            formatMessage({id: 'mobile.channel_info.privateChannel', defaultMessage: 'Private Channel'});

        Alert.alert(
            formatMessage(title, {term}),
            formatMessage(
                message,
                {
                    term: term.toLowerCase(),
                    name: displayName,
                },
            ),
            [{
                text: formatMessage({id: 'mobile.channel_info.alertNo', defaultMessage: 'No'}),
            }, {
                text: formatMessage({id: 'mobile.channel_info.alertYes', defaultMessage: 'Yes'}),
                onPress: onPressAction,
            }],
        );
    }

    handleDelete = preventDoubleTap(() => {
        const {channelId, deleteChannel, displayName, teamId} = this.props;
        const title = {id: t('mobile.channel_info.alertTitleDeleteChannel'), defaultMessage: 'Archive {term}'};
        const message = {
            id: t('mobile.channel_info.alertMessageDeleteChannel'),
            defaultMessage: 'Are you sure you want to archive the {term} {name}?',
        };
        const onPressAction = async () => {
            const result = await deleteChannel(channelId);
            if (result.error) {
                alertErrorWithFallback(
                    this.context.intl,
                    result.error,
                    {
                        id: t('mobile.channel_info.delete_failed'),
                        defaultMessage: "We couldn't archive the channel {displayName}. Please check your connection and try again.",
                    },
                    {
                        displayName,
                    },
                );
                if (result.error.server_error_id === 'api.channel.delete_channel.deleted.app_error') {
                    this.props.getChannel(channelId);
                }
            } else if (this.props.viewArchivedChannels) {
                this.props.handleSelectChannel(channelId);
                this.props.close(false);
            } else {
                this.props.selectPenultimateChannel(teamId);
                this.props.close(false);
            }
        };
        this.alertAndHandleYesAction(title, message, onPressAction);
    });

    handleUnarchive = preventDoubleTap(() => {
        const {channelId, displayName} = this.props;
        const title = {id: t('mobile.channel_info.alertTitleUnarchiveChannel'), defaultMessage: 'Unarchive {term}'};
        const message = {
            id: t('mobile.channel_info.alertMessageUnarchiveChannel'),
            defaultMessage: 'Are you sure you want to unarchive the {term} {name}?',
        };
        const onPressAction = async () => {
            const result = await this.props.unarchiveChannel(channelId);
            if (result.error) {
                alertErrorWithFallback(
                    this.context.intl,
                    result.error,
                    {
                        id: t('mobile.channel_info.unarchive_failed'),
                        defaultMessage: "We couldn't unarchive the channel {displayName}. Please check your connection and try again.",
                    },
                    {
                        displayName,
                    },
                );
                if (result.error.server_error_id === 'api.channel.unarchive_channel.unarchive.app_error') {
                    this.props.getChannel(channelId);
                }
            } else {
                this.props.close(false);
            }
        };
        this.alertAndHandleYesAction(title, message, onPressAction);
    });

    render() {
        const {canArchive, canUnarchive, testID, theme} = this.props;

        if (!canArchive && !canUnarchive) {
            return null;
        }

        let element;
        if (canUnarchive) {
            element = (
                <ChannelInfoRow
                    action={this.handleUnarchive}
                    defaultMessage='Unarchive Channel'
                    icon='archive-arrow-up-outline'
                    rightArrow={false}
                    testID={testID}
                    textId={t('mobile.routes.channelInfo.unarchive_channel')}
                    theme={theme}
                />
            );
        } else {
            element = (
                <ChannelInfoRow
                    action={this.handleDelete}
                    defaultMessage='Archive Channel'
                    iconColor='#CA3B27'
                    icon='archive-outline'
                    rightArrow={false}
                    testID={testID}
                    textId={t('mobile.routes.channelInfo.delete_channel')}
                    textColor='#CA3B27'
                    theme={theme}
                />
            );
        }

        return (
            <>
                <Separator theme={theme}/>
                {element}
            </>
        );
    }
}
