// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import deepEqual from 'deep-equal';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Alert,
    Platform,
    ScrollView,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {goToScreen} from '@actions/navigation';
import StatusBar from '@components/status_bar';
import {General, RequestStatus} from '@mm-redux/constants';
import SettingsItem from '@screens/settings/settings_item';
import {t} from '@utils/i18n';
import {getNotificationProps} from '@utils/notify_props';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import NotificationPreferences from 'app/notification_preferences';

export default class NotificationSettings extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            updateMe: PropTypes.func.isRequired,
        }),
        currentUser: PropTypes.object.isRequired,
        theme: PropTypes.object.isRequired,
        updateMeRequest: PropTypes.object.isRequired,
        currentUserStatus: PropTypes.string.isRequired,
        enableAutoResponder: PropTypes.bool.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    componentDidUpdate(prevProps) {
        const {updateMeRequest} = this.props;
        const {intl} = this.context;
        if (prevProps.updateMeRequest.status !== updateMeRequest.status && updateMeRequest.status === RequestStatus.FAILURE) {
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

    handlePress = preventDoubleTap((action) => {
        action();
    });

    goToNotificationSettingsAutoResponder = () => {
        const {currentUser} = this.props;
        const {intl} = this.context;
        const screen = 'NotificationSettingsAutoResponder';
        const title = intl.formatMessage({
            id: 'mobile.notification_settings.auto_responder_short',
            defaultMessage: 'Automatic Replies',
        });
        const passProps = {
            currentUser,
            onBack: this.saveAutoResponder,
        };

        goToScreen(screen, title, passProps);
    };

    goToNotificationSettingsEmail = () => {
        const {intl} = this.context;
        const screen = 'NotificationSettingsEmail';
        const title = intl.formatMessage({
            id: 'mobile.notification_settings.email_title',
            defaultMessage: 'Email Notifications',
        });

        goToScreen(screen, title);
    };

    goToNotificationSettingsMentions = () => {
        const {currentUser} = this.props;
        const {intl} = this.context;
        const screen = 'NotificationSettingsMentions';
        const title = intl.formatMessage({
            id: 'mobile.notification_settings.mentions_replies',
            defaultMessage: 'Mentions and Replies',
        });
        const passProps = {
            currentUser,
            onBack: this.saveNotificationProps,
        };

        goToScreen(screen, title, passProps);
    };

    goToNotificationSettingsMobile = () => {
        const {currentUser} = this.props;
        const {intl} = this.context;
        const screen = 'NotificationSettingsMobile';
        const title = intl.formatMessage({
            id: 'mobile.notification_settings.mobile_title',
            defaultMessage: 'Mobile Notifications',
        });

        NotificationPreferences.getPreferences().then((notificationPreferences) => {
            const passProps = {
                currentUser,
                onBack: this.saveNotificationProps,
                notificationPreferences,
            };
            requestAnimationFrame(() => {
                goToScreen(screen, title, passProps);
            });
        }).catch((e) => {
            Alert.alert('There was a problem getting the device preferences', e.message);
        });
    };

    saveAutoResponder = (notifyProps) => {
        const {intl} = this.context;

        if (!notifyProps.auto_responder_message) {
            notifyProps.auto_responder_message = intl.formatMessage({
                id: 'mobile.notification_settings.auto_responder.default_message',
                defaultMessage: 'Hello, I am out of office and unable to respond to messages.',
            });
        }

        if (this.shouldSaveAutoResponder(notifyProps)) {
            const notify_props = this.sanitizeNotificationProps(notifyProps);
            this.props.actions.updateMe({notify_props});
        }
    };

    saveNotificationProps = (notifyProps) => {
        const {currentUser} = this.props;
        const prevProps = getNotificationProps(currentUser);
        const updatedProps = {
            ...prevProps,
            ...notifyProps,
        };

        if (!deepEqual(prevProps, notifyProps)) {
            const notify_props = this.sanitizeNotificationProps(updatedProps);
            this.props.actions.updateMe({notify_props});
        }
    };

    sanitizeNotificationProps = (notifyProps) => {
        const sanitized = {...notifyProps};
        Reflect.deleteProperty(sanitized, 'showKeywordsModal');
        Reflect.deleteProperty(sanitized, 'showReplyModal');
        Reflect.deleteProperty(sanitized, 'androidKeywords');
        Reflect.deleteProperty(sanitized, 'newReplyValue');
        Reflect.deleteProperty(sanitized, 'user_id');

        return sanitized;
    }

    /**
     * shouldSaveAutoResponder
     *
     * Necessary in order to properly update the notifyProps when
     * enabling/disabling the Auto Responder.
     *
     * Reason being, on mobile when the AutoResponder is disabled on the server
     * for some reason the update does not get received on mobile, it does for web
     */
    shouldSaveAutoResponder = (notifyProps) => {
        const {currentUser, currentUserStatus} = this.props;
        const {auto_responder_active: autoResponderActive} = notifyProps;
        const prevProps = getNotificationProps(currentUser);

        const enabling = currentUserStatus !== General.OUT_OF_OFFICE && autoResponderActive === 'true';
        const disabling = currentUserStatus === General.OUT_OF_OFFICE && autoResponderActive === 'false';
        const updatedMsg = prevProps.auto_responder_message !== notifyProps.auto_responder_message;

        return enabling || disabling || updatedMsg;
    };

    render() {
        const {theme, enableAutoResponder} = this.props;
        const style = getStyleSheet(theme);
        const showArrow = Platform.OS === 'ios';

        const showEmailSeparator = enableAutoResponder;
        let autoResponder;
        if (enableAutoResponder) {
            autoResponder = (
                <SettingsItem
                    defaultMessage='Automatic Direct Message Replies'
                    i18nId={t('mobile.notification_settings.ooo_auto_responder')}
                    iconName='reply-outline'
                    onPress={() => this.handlePress(this.goToNotificationSettingsAutoResponder)}
                    separator={false}
                    showArrow={showArrow}
                    theme={theme}
                />
            );
        }

        return (
            <SafeAreaView
                edges={['left', 'right']}
                testID='notification_settings.screen'
                style={style.container}
            >
                <StatusBar/>
                <ScrollView
                    contentContainerStyle={style.wrapper}
                    alwaysBounceVertical={false}
                >
                    <View style={style.divider}/>
                    <SettingsItem
                        defaultMessage='Mentions and Replies'
                        i18nId={t('mobile.notification_settings.mentions_replies')}
                        iconName='at'
                        onPress={() => this.handlePress(this.goToNotificationSettingsMentions)}
                        separator={true}
                        showArrow={showArrow}
                        theme={theme}
                        testID='notification_settings.mentions_replies.action'
                    />
                    <SettingsItem
                        defaultMessage='Mobile'
                        i18nId={t('mobile.notification_settings.mobile')}
                        iconName='cellphone'
                        onPress={() => this.handlePress(this.goToNotificationSettingsMobile)}
                        separator={true}
                        showArrow={showArrow}
                        theme={theme}
                        testID='notification_settings.mobile.action'
                    />
                    <SettingsItem
                        defaultMessage='Email'
                        i18nId={t('mobile.notification_settings.email')}
                        iconName='email-outline'
                        onPress={() => this.handlePress(this.goToNotificationSettingsEmail)}
                        separator={showEmailSeparator}
                        showArrow={showArrow}
                        theme={theme}
                        testID='notification_settings.email.action'
                    />
                    {autoResponder}
                    <View style={style.divider}/>
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
        },
        wrapper: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            ...Platform.select({
                ios: {
                    flex: 1,
                    paddingTop: 35,
                },
            }),
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
            width: '100%',
        },
    };
});
