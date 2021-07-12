// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {popTopScreen} from '@actions/navigation';
import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import TextInputWithLocalizedPlaceholder from '@components/text_input_with_localized_placeholder';
import {General} from '@mm-redux/constants';
import {Theme} from '@mm-redux/types/preferences';
import {UserNotifyProps, UserProfile} from '@mm-redux/types/users';
import Section from '@screens/settings/section';
import SectionItem from '@screens/settings/section_item';
import {t} from '@utils/i18n';
import {getNotificationProps} from '@utils/notify_props';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

interface NotificationSettingsAutoResponderProps {
    currentUser: UserProfile;
    currentUserStatus: string;
    intl: typeof intlShape;
    onBack: (notifyProps: UserNotifyProps) => void;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
        },
        wrapper: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            flex: 1,
            paddingTop: 35,
        },
        inputContainer: {
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
            backgroundColor: theme.centerChannelBg,
        },
        input: {
            color: theme.centerChannelColor,
            fontSize: 15,
            height: 150,
            paddingHorizontal: 15,
            paddingVertical: 10,
        },
        footer: {
            marginHorizontal: 15,
            fontSize: 12,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
    };
});

const NotificationSettingsAutoResponder = ({currentUser, currentUserStatus, intl, onBack, theme} : NotificationSettingsAutoResponderProps) => {
    const autoresponderRef = useRef<TextInputWithLocalizedPlaceholder>(null);
    const [notifyProps, setNotifyProps] = useState<UserNotifyProps>(getNotificationProps(currentUser));
    const style = getStyleSheet(theme);

    const onAutoResponseToggle = (active: boolean) => {
        setNotifyProps({
            ...notifyProps,
            auto_responder_active: active ? 'true' : 'false',
        });
    };

    const onAutoResponseChangeText = (message: string) => {
        setNotifyProps({
            ...notifyProps,
            auto_responder_message: message,
        });
    };

    const onSubmitEditing = () => {
        popTopScreen();
    };

    useEffect(() => {
        const autoResponderDefault = intl.formatMessage({
            id: 'mobile.notification_settings.auto_responder.default_message',
            defaultMessage: 'Hello, I am out of office and unable to respond to messages.',
        });

        setNotifyProps({
            ...notifyProps,
            auto_responder_active: (currentUserStatus === General.OUT_OF_OFFICE && notifyProps.auto_responder_active) ? 'true' : 'false',
            auto_responder_message: notifyProps.auto_responder_message || autoResponderDefault,
        });
    }, []);

    useEffect(() => {
        const autoresponderTimeout = setTimeout(() => {
            autoresponderRef.current?.focus();
        }, 500);

        return () => {
            clearTimeout(autoresponderTimeout);

            onBack({
                ...notifyProps,
                user_id: currentUser.id,
            });
        };
    }, [notifyProps]);

    const autoResponderActiveLabel = (
        <FormattedText
            id='mobile.notification_settings.auto_responder.enabled'
            defaultMessage='Enabled'
        />
    );
    const {
        auto_responder_active: autoResponderActive,
        auto_responder_message: autoResponderMessage,
    } = notifyProps;

    return (
        <SafeAreaView
            edges={['left', 'right']}
            style={style.container}
        >
            <StatusBar/>
            <View style={style.wrapper}>
                <Section
                    disableHeader={true}
                    theme={theme}
                >
                    <SectionItem
                        label={autoResponderActiveLabel}
                        action={onAutoResponseToggle}
                        actionType='toggle'
                        selected={autoResponderActive === 'true'}
                        theme={theme}
                    />
                </Section>
                {autoResponderActive === 'true' && (
                    <Section
                        headerId={t('mobile.notification_settings.auto_responder.message_title')}
                        headerDefaultMessage='CUSTOM MESSAGE'
                        theme={theme}
                    >
                        <View style={style.inputContainer}>
                            <TextInputWithLocalizedPlaceholder
                                ref={autoresponderRef}
                                value={autoResponderMessage}
                                blurOnSubmit={true}
                                onChangeText={onAutoResponseChangeText}
                                onSubmitEditing={onSubmitEditing}
                                multiline={true}
                                style={style.input}
                                autoCapitalize='none'
                                autoCorrect={false}
                                placeholder={{id: t('mobile.notification_settings.auto_responder.message_placeholder'), defaultMessage: 'Message'}}
                                placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.4)}
                                textAlignVertical='top'
                                underlineColorAndroid='transparent'
                                returnKeyType='done'
                                keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                            />
                        </View>
                    </Section>
                )}
                <FormattedText
                    id={'mobile.notification_settings.auto_responder.footer_message'}
                    defaultMessage={'Set a custom message that will be automatically sent in response to Direct Messages. Mentions in Public and Private Channels will not trigger the automated reply. Enabling Automatic Replies sets your status to Out of Office and disables email and push notifications.'}
                    style={style.footer}
                />
            </View>
        </SafeAreaView>
    );
};

export default injectIntl(NotificationSettingsAutoResponder);
