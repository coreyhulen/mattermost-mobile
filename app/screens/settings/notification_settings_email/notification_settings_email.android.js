// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {intlShape} from 'react-intl';
import {
    Modal,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';

import FormattedText from '@components/formatted_text';
import RadioButtonGroup from '@components/radio_button';
import {Preferences} from '@mm-redux/constants';
import SectionItem from '@screens/settings/section_item';
import {t} from '@utils/i18n';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import NotificationSettingsEmailBase from './notification_settings_email_base';

class NotificationSettingsEmailAndroid extends NotificationSettingsEmailBase {
    static contextTypes = {
        intl: intlShape,
    };

    handleClose = () => {
        this.setState({
            newInterval: this.state.emailInterval,
            showEmailNotificationsModal: false,
        });
    }

    handleSaveEmailNotification = () => {
        this.setState({showEmailNotificationsModal: false});
        this.saveEmailNotifyProps();
    };

    showEmailModal = () => {
        this.setState({showEmailNotificationsModal: true});
    };

    renderEmailSection() {
        const {
            sendEmailNotifications,
            theme,
        } = this.props;
        const {newInterval} = this.state;
        let i18nId;
        let i18nMessage;
        if (sendEmailNotifications) {
            switch (newInterval) {
            case Preferences.INTERVAL_IMMEDIATE.toString():
                i18nId = t('user.settings.notifications.email.immediately');
                i18nMessage = 'Immediately';
                break;
            case Preferences.INTERVAL_HOUR.toString():
                i18nId = t('user.settings.notifications.email.everyHour');
                i18nMessage = 'Every hour';
                break;
            case Preferences.INTERVAL_FIFTEEN_MINUTES.toString():
                i18nId = t('mobile.user.settings.notifications.email.fifteenMinutes');
                i18nMessage = 'Every 15 minutes';
                break;
            case Preferences.INTERVAL_NEVER.toString():
            default:
                i18nId = t('user.settings.notifications.email.never');
                i18nMessage = 'Never';
                break;
            }
        } else {
            i18nId = t('user.settings.notifications.email.disabled');
            i18nMessage = 'Email notifications are not enabled';
        }

        return (
            <SectionItem
                description={(
                    <FormattedText
                        id={i18nId}
                        defaultMessage={i18nMessage}
                    />
                )}
                label={(
                    <FormattedText
                        id='user.settings.notifications.email.send'
                        defaultMessage='Send email notifications'
                    />
                )}
                action={this.showEmailModal}
                actionType='default'
                theme={theme}
                testID='notification_settings_email.send.action'
            />
        );
    }

    renderEmailNotificationsModal(style) {
        const {intl} = this.context;
        const {
            enableEmailBatching,
            sendEmailNotifications,
        } = this.props;
        const {newInterval} = this.state;

        let helpText;
        if (sendEmailNotifications) {
            helpText = (
                <FormattedText
                    id='user.settings.notifications.emailInfo'
                    defaultMessage='Email notifications are sent for mentions and direct messages when you are offline or away for more than 5 minutes.'
                    style={style.modalHelpText}
                />
            );
        }

        const emailOptions = [{
            label: intl.formatMessage({
                id: 'user.settings.notifications.email.immediately',
                defaultMessage: 'Immediately',
            }),
            value: Preferences.INTERVAL_IMMEDIATE.toString(),
            checked: newInterval === Preferences.INTERVAL_IMMEDIATE.toString(),
            testID: 'notification_settings_email.immediately.action',
        }];

        if (enableEmailBatching) {
            emailOptions.push({
                label: intl.formatMessage({
                    id: 'mobile.user.settings.notifications.email.fifteenMinutes',
                    defaultMessage: 'Every 15 minutes',
                }),
                value: Preferences.INTERVAL_FIFTEEN_MINUTES.toString(),
                checked: newInterval === Preferences.INTERVAL_FIFTEEN_MINUTES.toString(),
            }, {
                label: intl.formatMessage({
                    id: 'user.settings.notifications.email.everyHour',
                    defaultMessage: 'Every hour',
                }),
                value: Preferences.INTERVAL_HOUR.toString(),
                checked: newInterval === Preferences.INTERVAL_HOUR.toString(),
            });
        }

        emailOptions.push({
            label: intl.formatMessage({
                id: 'user.settings.notifications.email.never',
                defaultMessage: 'Never',
            }),
            value: Preferences.INTERVAL_NEVER.toString(),
            checked: newInterval === Preferences.INTERVAL_NEVER.toString(),
            testID: 'notification_settings_email.never.action',
        });

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={this.state.showEmailNotificationsModal}
                onRequestClose={this.handleClose}
            >
                <View
                    style={style.modalOverlay}
                    testID='notification_settings_email.send.modal'
                >
                    <View style={style.modal}>
                        <View style={style.modalBody}>
                            <View style={style.modalTitleContainer}>
                                <FormattedText
                                    id='user.settings.notifications.email.send'
                                    defaultMessage='Send email notifications'
                                    style={style.modalTitle}
                                />
                            </View>
                            {!sendEmailNotifications &&
                            <FormattedText
                                id='user.settings.general.emailHelp2'
                                defaultMessage='Email has been disabled by your System Administrator. No notification emails will be sent until it is enabled.'
                                style={style.modalOptionDisabled}
                            />
                            }
                            {sendEmailNotifications &&
                            <RadioButtonGroup
                                name='emailSettings'
                                onSelect={this.setEmailInterval}
                                options={emailOptions}
                            />
                            }
                            {helpText}
                        </View>
                        <View style={style.modalFooter}>
                            <View style={style.divider}/>
                            <View style={style.modalFooterContainer}>
                                <TouchableOpacity
                                    style={style.modalFooterOptionContainer}
                                    onPress={this.handleClose}
                                    testID='notification_settings_email.send_modal_cancel.button'
                                >
                                    <FormattedText
                                        id='mobile.notification_settings.modal_cancel'
                                        defaultMessage='CANCEL'
                                        style={style.modalFooterOption}
                                    />
                                </TouchableOpacity>
                                {sendEmailNotifications &&
                                <View>
                                    <View style={{marginRight: 10}}/>
                                    <TouchableOpacity
                                        style={style.modalFooterOptionContainer}
                                        onPress={this.handleSaveEmailNotification}
                                        testID='notification_settings_email.send_modal_save.button'
                                    >
                                        <FormattedText
                                            id='mobile.notification_settings.modal_save'
                                            defaultMessage='SAVE'
                                            style={style.modalFooterOption}
                                        />
                                    </TouchableOpacity>
                                </View>
                                }
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    render() {
        const {theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <View
                style={style.container}
                testID='notification_settings_email.screen'
            >
                <ScrollView
                    style={style.scrollView}
                    contentContainerStyle={style.scrollViewContent}
                    alwaysBounceVertical={false}
                >
                    {this.renderEmailSection()}
                    <View style={style.separator}/>
                    {this.renderEmailNotificationsModal(style)}
                </ScrollView>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        separator: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
            width: '100%',
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
            width: '100%',
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
        },
        scrollViewContent: {
            paddingVertical: 0,
        },
        modalOverlay: {
            backgroundColor: changeOpacity('#000000', 0.6),
            alignItems: 'center',
            flex: 1,
        },
        modal: {
            backgroundColor: theme.centerChannelBg,
            borderRadius: 4,
            marginTop: 20,
            width: '95%',
        },
        modalBody: {
            paddingHorizontal: 24,
        },
        modalTitleContainer: {
            marginBottom: 30,
            marginTop: 20,
        },
        modalTitle: {
            color: theme.centerChannelColor,
            fontSize: 19,
        },
        modalOptionDisabled: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 17,
        },
        modalHelpText: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 13,
            marginTop: 20,
        },
        modalFooter: {
            alignItems: 'flex-end',
            height: 58,
            marginTop: 40,
            width: '100%',
        },
        modalFooterContainer: {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            paddingRight: 24,
        },
        modalFooterOptionContainer: {
            alignItems: 'center',
            height: 40,
            justifyContent: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
        },
        modalFooterOption: {
            color: theme.linkColor,
            fontSize: 14,
        },
    };
});

export default NotificationSettingsEmailAndroid;
