// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import deepEqual from 'deep-equal';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl} from 'react-intl';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import FormattedText from '@components/formatted_text';
import RadioButtonGroup from '@components/radio_button';
import StatusBar from '@components/status_bar';
import PushNotifications from '@init/push_notifications';
import {RequestStatus} from '@mm-redux/constants';
import SectionItem from '@screens/settings/section_item';
import {getNotificationProps} from '@utils/notify_props';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import NotificationPreferences from 'app/notification_preferences';

import NotificationSettingsMobileBase from './notification_settings_mobile_base';

class NotificationSettingsMobileAndroid extends NotificationSettingsMobileBase {
    static propTypes = {
        ...NotificationSettingsMobileBase.propTypes,
        updateMeRequest: PropTypes.object.isRequired,
    }

    static defaultProps = {
        currentUser: {},
    }

    cancelMobilePushModal = () => {
        this.setState({
            newPush: this.state.push,
            showMobilePushModal: false,
        });
    };

    cancelMobilePushStatusModal = () => {
        this.setState({
            newPushStatus: this.state.push_status,
            showMobilePushStatusModal: false,
        });
    };

    cancelMobileSoundsModal = () => {
        this.setState({
            newSound: this.state.selectedUri,
            showMobileSoundsModal: false,
        });
    };

    onMobilePushChanged = (value) => {
        this.setState({newPush: value});
    };

    onMobilePushStatusChanged = (value) => {
        this.setState({newPushStatus: value});
    };

    onMobileSoundChanged = (value) => {
        this.setState({newSound: value});

        if (value && value !== 'none') {
            NotificationPreferences.play(value);
        }
    };

    renderMobileBlinkSection(style) {
        const {config, theme} = this.props;
        const {shouldBlink} = this.state;

        const showSection = config.SendPushNotifications === 'true' && this.state.push !== 'none';
        if (!showSection) {
            return null;
        }

        return (
            <View>
                <SectionItem
                    label={(
                        <FormattedText
                            id='mobile.notification_settings_mobile.light'
                            defaultMessage='Light'
                        />
                    )}
                    action={this.toggleBlink}
                    actionType='toggle'
                    selected={shouldBlink}
                    theme={theme}
                />
                <View style={style.separator}/>
            </View>
        );
    }

    renderMobilePushModal(style) {
        const {config, intl} = this.props;
        const pushNotificationsEnabled = config.SendPushNotifications === 'true';
        const {newPush} = this.state;

        const options = [{
            testID: 'notification_settings_mobile.all.action',
            label: intl.formatMessage({
                id: 'user.settings.notifications.allActivity',
                defaultMessage: 'For all activity',
            }),
            value: 'all',
            checked: newPush === 'all',
        }, {
            testID: 'notification_settings_mobile.mentions.action',
            label: intl.formatMessage({
                id: 'user.settings.notifications.onlyMentions',
                defaultMessage: 'Only for mentions and direct messages',
            }),
            value: 'mention',
            checked: newPush === 'mention',
        }, {
            testID: 'notification_settings_mobile.never.action',
            label: intl.formatMessage({
                id: 'user.settings.notifications.never',
                defaultMessage: 'Never',
            }),
            value: 'none',
            checked: newPush === 'none',
        }];

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={this.state.showMobilePushModal}
                onRequestClose={this.cancelMobilePushModal}
            >
                <View
                    testID='notification_settings_mobile.push.modal'
                    style={style.modalOverlay}
                >
                    <View style={style.modal}>
                        <View style={style.modalBody}>
                            <View style={style.modalTitleContainer}>
                                <FormattedText
                                    id='mobile.notification_settings_mobile.push_activity_android'
                                    defaultMessage='Send notifications'
                                    style={style.modalTitle}
                                />
                            </View>
                            {pushNotificationsEnabled &&
                            <RadioButtonGroup
                                name='pushSettings'
                                onSelect={this.onMobilePushChanged}
                                options={options}
                            />
                            }
                            {!pushNotificationsEnabled &&
                            <FormattedText
                                id='user.settings.push_notification.disabled_long'
                                defaultMessage='Push notifications for mobile devices have been disabled by your System Administrator.'
                                style={style.modalOptionDisabled}
                            />
                            }
                        </View>
                        <View style={style.modalFooter}>
                            <View style={style.separator}/>
                            <View style={style.modalFooterContainer}>
                                <TouchableOpacity
                                    testID='notification_settings_mobile.push_modal_cancel.button'
                                    style={style.modalFooterOptionContainer}
                                    onPress={this.cancelMobilePushModal}
                                >
                                    <FormattedText
                                        id='mobile.notification_settings.modal_cancel'
                                        defaultMessage='CANCEL'
                                        style={style.modalFooterOption}
                                    />
                                </TouchableOpacity>
                                {pushNotificationsEnabled &&
                                <View>
                                    <View style={{marginRight: 10}}/>
                                    <TouchableOpacity
                                        testID='notification_settings_mobile.push_modal_save.button'
                                        style={style.modalFooterOptionContainer}
                                        onPress={this.saveMobilePushModal}
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

    renderMobilePushStatusModal(style) {
        const {intl} = this.props;
        const {newPushStatus} = this.state;

        const options = [{
            label: intl.formatMessage({
                id: 'user.settings.push_notification.online',
                defaultMessage: 'Online, away or offline',
            }),
            value: 'online',
            checked: newPushStatus === 'online',
        }, {
            label: intl.formatMessage({
                id: 'user.settings.push_notification.away',
                defaultMessage: 'Away or offline',
            }),
            value: 'away',
            checked: newPushStatus === 'away',
        }, {
            label: intl.formatMessage({
                id: 'user.settings.push_notification.offline',
                defaultMessage: 'Offline',
            }),
            value: 'offline',
            checked: newPushStatus === 'offline',
        }];

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={this.state.showMobilePushStatusModal}
                onRequestClose={this.cancelMobilePushStatusModal}
            >
                <View style={style.modalOverlay}>
                    <View style={style.modal}>
                        <View style={style.modalBody}>
                            <View style={style.modalTitleContainer}>
                                <FormattedText
                                    id='mobile.notification_settings_mobile.push_status_android'
                                    defaultMessage='Trigger push notifications when'
                                    style={style.modalTitle}
                                />
                            </View>
                            <RadioButtonGroup
                                name='pushStatusSettings'
                                onSelect={this.onMobilePushStatusChanged}
                                options={options}
                            />
                        </View>
                        <View style={style.modalFooter}>
                            <View style={style.separator}/>
                            <View style={style.modalFooterContainer}>
                                <TouchableOpacity
                                    style={style.modalFooterOptionContainer}
                                    onPress={this.cancelMobilePushStatusModal}
                                >
                                    <FormattedText
                                        id='mobile.notification_settings.modal_cancel'
                                        defaultMessage='CANCEL'
                                        style={style.modalFooterOption}
                                    />
                                </TouchableOpacity>
                                <View style={{marginRight: 10}}/>
                                <TouchableOpacity
                                    style={style.modalFooterOptionContainer}
                                    onPress={this.saveMobilePushStatusModal}
                                >
                                    <FormattedText
                                        id='mobile.notification_settings.modal_save'
                                        defaultMessage='SAVE'
                                        style={style.modalFooterOption}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    renderMobileSoundsModal(style) {
        const {defaultSound, newSound} = this.state;
        const {intl, notificationPreferences} = this.props;
        const {defaultUri, sounds} = notificationPreferences;
        const soundsArray = [{
            label: intl.formatMessage({
                id: 'mobile.notification_settings_mobile.default_sound',
                defaultMessage: 'Default ({sound})',
            }, {sound: defaultSound}),
            value: defaultUri,
            checked: newSound === null,
        }, {
            label: intl.formatMessage({
                id: 'mobile.notification_settings_mobile.no_sound',
                defaultMessage: 'None',
            }),
            value: 'none',
            checked: newSound === 'none',
        }];

        if (sounds && sounds.length) {
            const filteredSounds = sounds.filter((s) => s.uri !== defaultUri).map((s) => {
                return {
                    label: s.name,
                    value: s.uri,
                    checked: s.uri === newSound,
                };
            });
            soundsArray.push(...filteredSounds);
        }

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={this.state.showMobileSoundsModal}
                onRequestClose={this.cancelMobileSoundsModal}
            >
                <View style={style.modalOverlay}>
                    <View style={style.modal}>
                        <View style={style.modalBody}>
                            <View style={style.modalTitleContainer}>
                                <FormattedText
                                    id='mobile.notification_settings_mobile.sounds_title'
                                    defaultMessage='Notification sound'
                                    style={style.modalTitle}
                                />
                            </View>
                            <ScrollView>
                                <RadioButtonGroup
                                    name='soundsSettings'
                                    onSelect={this.onMobileSoundChanged}
                                    options={soundsArray}
                                />
                            </ScrollView>
                        </View>
                        <View style={style.modalFooter}>
                            <View style={style.separator}/>
                            <View style={style.modalFooterContainer}>
                                <TouchableOpacity
                                    style={style.modalFooterOptionContainer}
                                    onPress={this.cancelMobileSoundsModal}
                                >
                                    <FormattedText
                                        id='mobile.notification_settings.modal_cancel'
                                        defaultMessage='CANCEL'
                                        style={style.modalFooterOption}
                                    />
                                </TouchableOpacity>
                                <View style={{marginRight: 10}}/>
                                <TouchableOpacity
                                    style={style.modalFooterOptionContainer}
                                    onPress={this.saveMobileSoundsModal}
                                >
                                    <FormattedText
                                        id='mobile.notification_settings.modal_save'
                                        defaultMessage='SAVE'
                                        style={style.modalFooterOption}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    componentDidUpdate(prevProps) {
        const {updateMeRequest, intl} = this.props;
        if (updateMeRequest !== prevProps.updateMeRequest && updateMeRequest.status === RequestStatus.FAILURE) {
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.notification_settings.save_failed_title',
                    defaultMessage: 'Connection issue',
                }),
                intl.formatMessage({
                    id: 'mobile.notification_settings.save_failed_description',
                    defaultMessage: 'The notification settings failed to save due to a connection issue, please try again.',
                }),
            );
        }
    }

    renderMobilePushSection() {
        const {config, theme} = this.props;

        const pushNotificationsEnabled = config.SendPushNotifications === 'true';

        let i18nId;
        let i18nMessage;
        const props = {};
        if (pushNotificationsEnabled) {
            switch (this.state.push) {
            case 'all':
                i18nId = 'user.settings.notifications.allActivity';
                i18nMessage = 'For all activity';
                break;
            case 'none':
                i18nId = 'user.settings.notifications.never';
                i18nMessage = 'Never';
                break;
            case 'mention':
            default:
                i18nId = 'user.settings.notifications.onlyMentions';
                i18nMessage = 'Only for mentions and direct messages';
                break;
            }
            props.description = (
                <FormattedText
                    id={i18nId}
                    defaultMessage={i18nMessage}
                />
            );
        } else {
            props.description = (
                <FormattedText
                    id='user.settings.push_notification.disabled'
                    defaultMessage='Disabled by System Administrator'
                />
            );
        }

        return (
            <SectionItem
                testID='notification_settings_mobile.push.action'
                {...props}
                label={(
                    <FormattedText
                        id='mobile.notification_settings_mobile.push_activity_android'
                        defaultMessage='Send notifications'
                    />
                )}
                action={this.showMobilePushModal}
                actionType='default'
                theme={theme}
            />
        );
    }

    renderMobilePushStatusSection(style) {
        const {config, theme} = this.props;

        const showSection = config.SendPushNotifications === 'true' && this.state.push !== 'none';
        if (!showSection) {
            return null;
        }

        let i18nId;
        let i18nMessage;
        switch (this.state.push_status) {
        case 'away':
            i18nId = 'user.settings.push_notification.away';
            i18nMessage = 'Away or offline';
            break;
        case 'offline':
            i18nId = 'user.settings.push_notification.offline';
            i18nMessage = 'Offline';
            break;
        case 'online':
        default:
            i18nId = 'user.settings.push_notification.online';
            i18nMessage = 'Online, away or offline';
            break;
        }

        return (
            <View>
                <SectionItem
                    description={(
                        <FormattedText
                            id={i18nId}
                            defaultMessage={i18nMessage}
                        />
                    )}
                    label={(
                        <FormattedText
                            id='mobile.notification_settings_mobile.push_status_android'
                            defaultMessage='Trigger push notifications when'
                        />
                    )}
                    action={this.showMobilePushStatusModal}
                    actionType='default'
                    theme={theme}
                />
                <View style={style.separator}/>
            </View>
        );
    }

    renderMobileSoundSection(style) {
        const {config, theme} = this.props;
        const {defaultSound, sound} = this.state;

        const showSection = config.SendPushNotifications === 'true' && this.state.push !== 'none';
        if (!showSection) {
            return null;
        }

        let description;
        if (sound === 'none') {
            description = (
                <FormattedText
                    id='mobile.notification_settings_mobile.no_sound'
                    defaultMessage='None'
                />
            );
        } else if (sound) {
            description = (
                <Text>
                    {sound}
                </Text>
            );
        } else {
            description = (
                <FormattedText
                    id='mobile.notification_settings_mobile.default_sound'
                    defaultMessage='Default ({sound})'
                    values={{
                        sound: defaultSound,
                    }}
                />
            );
        }

        return (
            <View>
                <SectionItem
                    description={description}
                    label={(
                        <FormattedText
                            id='mobile.notification_settings_mobile.sound'
                            defaultMessage='Sound'
                        />
                    )}
                    action={this.showMobileSoundsModal}
                    actionType='default'
                    theme={theme}
                />
                <View style={style.separator}/>
            </View>
        );
    }

    renderMobileTestSection(style) {
        const {config, theme} = this.props;

        const showSection = config.SendPushNotifications === 'true' && this.state.push !== 'none';
        if (!showSection) {
            return null;
        }

        return (
            <View>
                <SectionItem
                    label={(
                        <FormattedText
                            id='mobile.notification_settings_mobile.test'
                            defaultMessage='Send me a test notification'
                        />
                    )}
                    action={this.sendTestNotification}
                    actionType='default'
                    theme={theme}
                />
                <View style={style.separator}/>
            </View>
        );
    }

    renderMobileVibrateSection(style) {
        const {config, theme} = this.props;
        const {shouldVibrate} = this.state;

        const showSection = config.SendPushNotifications === 'true' && this.state.push !== 'none';
        if (!showSection) {
            return null;
        }

        return (
            <View>
                <SectionItem
                    label={(
                        <FormattedText
                            id='mobile.notification_settings_mobile.vibrate'
                            defaultMessage='Vibrate'
                        />
                    )}
                    action={this.toggleVibrate}
                    actionType='toggle'
                    selected={shouldVibrate}
                    theme={theme}
                />
                <View style={style.separator}/>
            </View>
        );
    }

    renderNotificationOptions(style) {
        if (Platform.Version >= 26) {
            return null;
        }

        return (
            <React.Fragment>
                {this.renderMobileSoundSection(style)}
                {this.renderMobileVibrateSection(style)}
                {this.renderMobileBlinkSection(style)}
            </React.Fragment>
        );
    }

    saveMobilePushModal = () => {
        this.setState({showMobilePushModal: false});
        this.setMobilePush(this.state.newPush, this.saveNotificationProps);
    };

    saveMobilePushStatusModal = () => {
        this.setState({showMobilePushStatusModal: false});
        this.setMobilePushStatus(this.state.newPushStatus, this.saveNotificationProps);
    };

    saveNotificationProps = () => {
        const {
            channel,
            comments,
            desktop,
            email,
            first_name: firstName,
            mention_keys: mentionKeys,
            push,
            push_status: pushStatus,
        } = this.state;

        const {currentUser} = this.props;

        const notifyProps = {
            channel,
            comments,
            desktop,
            email,
            first_name: firstName,
            mention_keys: mentionKeys,
            push,
            push_status: pushStatus,
            user_id: currentUser.id,
        };

        const {user_id: userId} = notifyProps;
        const previousProps = {
            ...getNotificationProps(currentUser),
            user_id: userId,
        };

        if (!deepEqual(previousProps, notifyProps)) {
            this.props.actions.updateMe({notify_props: notifyProps});
        }
    };

    saveMobileSoundsModal = () => {
        const {defaultSound, newSound} = this.state;
        const {intl, notificationPreferences} = this.props;
        const {defaultUri, sounds} = notificationPreferences;

        let sound;
        let selectedUri = null;
        if (newSound === defaultUri) {
            sound = defaultSound;
        } else if (newSound === 'none') {
            selectedUri = 'none';
            sound = intl.formatMessage({
                id: 'mobile.notification_settings_mobile.no_sound',
                defaultMessage: 'None',
            });
        } else {
            selectedUri = newSound;
            const selected = sounds.find((s) => s.uri === selectedUri);
            sound = selected ? selected.name : 'none';
        }

        NotificationPreferences.setNotificationSound(selectedUri);
        this.setState({selectedUri, sound, showMobileSoundsModal: false});
    };

    sendTestNotification = () => {
        const {intl} = this.props;

        PushNotifications.localNotification({
            body: intl.formatMessage({
                id: 'mobile.notification_settings_mobile.test_push',
                defaultMessage: 'This is a test push notification',
            }),
            userInfo: {
                local: true,
                test: true,
            },
        });
    };

    showMobilePushModal = () => {
        this.setState({showMobilePushModal: true});
    };

    showMobilePushStatusModal = () => {
        this.setState({showMobilePushStatusModal: true});
    };

    showMobileSoundsModal = () => {
        this.setState({showMobileSoundsModal: true});
    };

    toggleBlink = () => {
        NotificationPreferences.setShouldBlink(!this.state.shouldBlink);
        this.setState({shouldBlink: !this.state.shouldBlink});
    };

    toggleVibrate = () => {
        NotificationPreferences.setShouldVibrate(!this.state.shouldVibrate);
        this.setState({shouldVibrate: !this.state.shouldVibrate});
    };

    render() {
        const {theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <View
                testID='notification_settings_mobile.screen'
                style={style.container}
            >
                <StatusBar/>
                <ScrollView
                    style={style.scrollView}
                    contentContainerStyle={style.scrollViewContent}
                    alwaysBounceVertical={false}
                >
                    {this.renderMobilePushSection()}
                    <View style={style.separator}/>
                    {this.renderMobilePushStatusSection(style)}
                    {this.renderNotificationOptions(style)}
                    {this.renderMobileTestSection(style)}
                </ScrollView>
                {this.renderMobilePushModal(style)}
                {this.renderMobilePushStatusModal(style)}
                {this.renderMobileSoundsModal(style)}
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        input: {
            color: theme.centerChannelColor,
            fontSize: 12,
            height: 40,
        },
        separator: {
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
            maxHeight: '80%',
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

export default injectIntl(NotificationSettingsMobileAndroid);
