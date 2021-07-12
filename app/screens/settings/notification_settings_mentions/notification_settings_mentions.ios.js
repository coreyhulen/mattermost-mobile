// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {injectIntl} from 'react-intl';
import {
    ScrollView,
    Text,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {goToScreen} from '@actions/navigation';
import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import Section from '@screens/settings/section';
import SectionItem from '@screens/settings/section_item';
import {t} from '@utils/i18n';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import NotificationSettingsMentionsBase from './notification_settings_mention_base';

class NotificationSettingsMentionsIos extends NotificationSettingsMentionsBase {
    goToNotificationSettingsMentionKeywords = () => {
        const {intl} = this.props;
        this.goingBack = false;

        const screen = 'NotificationSettingsMentionsKeywords';
        const title = intl.formatMessage({id: 'mobile.notification_settings_mentions.keywords', defaultMessage: 'Keywords'});
        const passProps = {
            keywords: this.state.mention_keys,
            onBack: this.updateMentionKeys,
        };

        goToScreen(screen, title, passProps);
    };

    renderMentionSection(style) {
        const {currentUser, theme} = this.props;

        let mentionKeysComponent;
        if (this.state.mention_keys) {
            mentionKeysComponent = (<Text>{this.state.mention_keys}</Text>);
        } else {
            mentionKeysComponent = (
                <FormattedText
                    id='mobile.notification_settings_mentions.keywordsDescription'
                    defaultMessage='Other words that trigger a mention'
                />
            );
        }

        return (
            <Section
                headerId={t('mobile.notification_settings_mentions.wordsTrigger')}
                headerDefaultMessage='WORDS THAT TRIGGER MENTIONS'
                theme={theme}
            >
                {currentUser.first_name?.length > 0 &&
                <View>
                    <SectionItem
                        label={(
                            <Text>
                                {currentUser.first_name}
                            </Text>
                        )}
                        description={(
                            <FormattedText
                                id='mobile.notification_settings.mentions.sensitiveName'
                                defaultMessage='Your case sensitive first name'
                            />
                        )}
                        action={this.toggleFirstNameMention}
                        actionType='toggle'
                        selected={this.state.first_name === 'true'}
                        theme={theme}
                    />
                    <View style={style.separator}/>
                </View>
                }
                <SectionItem
                    label={(
                        <Text>
                            {currentUser.username}
                        </Text>
                    )}
                    description={(
                        <FormattedText
                            id='mobile.notification_settings.mentions.sensitiveUsername'
                            defaultMessage='Your non-case sensitive username'
                        />
                    )}
                    selected={this.state.usernameMention}
                    action={this.toggleUsernameMention}
                    actionType='toggle'
                    theme={theme}
                />
                <View style={style.separator}/>
                <SectionItem
                    label={(
                        <Text>
                            {'@channel, @all, @here'}
                        </Text>
                    )}
                    description={(
                        <FormattedText
                            id='mobile.notification_settings.mentions.channelWide'
                            defaultMessage='Channel-wide mentions'
                        />
                    )}
                    action={this.toggleChannelMentions}
                    actionType='toggle'
                    selected={this.state.channel === 'true'}
                    theme={theme}
                />
                <View style={style.separator}/>
                <SectionItem
                    label={(
                        <FormattedText
                            id='mobile.notification_settings_mentions.keywords'
                            defaultMessage='Keywords'
                        />
                    )}
                    description={mentionKeysComponent}
                    action={this.goToNotificationSettingsMentionKeywords}
                    actionType='arrow'
                    theme={theme}
                />
            </Section>
        );
    }

    renderReplySection(style) {
        const {theme} = this.props;

        return (
            <Section
                headerId={t('mobile.account_notifications.reply.header')}
                headerDefaultMessage='SEND REPLY NOTIFICATIONS FOR'
                theme={theme}
            >
                <SectionItem
                    label={(
                        <FormattedText
                            id='mobile.account_notifications.threads_start_participate'
                            defaultMessage='Threads that I start or participate in'
                        />
                    )}
                    action={this.setReplyNotifications}
                    actionType='select'
                    actionValue='any'
                    selected={this.state.comments === 'any'}
                    theme={theme}
                />
                <View style={style.separator}/>
                <SectionItem
                    label={(
                        <FormattedText
                            id='mobile.account_notifications.threads_start'
                            defaultMessage='Threads that I start'
                        />
                    )}
                    action={this.setReplyNotifications}
                    actionType='select'
                    actionValue='root'
                    selected={this.state.comments === 'root'}
                    theme={theme}
                />
                <View style={style.separator}/>
                <SectionItem
                    label={(
                        <FormattedText
                            id='mobile.account_notifications.threads_mentions'
                            defaultMessage='Mentions in threads'
                        />
                    )}
                    action={this.setReplyNotifications}
                    actionType='select'
                    actionValue='never'
                    selected={this.state.comments === 'never'}
                    theme={theme}
                />
            </Section>
        );
    }

    render() {
        const {theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <SafeAreaView
                edges={['left', 'right']}
                style={style.container}
            >
                <StatusBar/>
                <ScrollView
                    style={style.scrollView}
                    contentContainerStyle={style.scrollViewContent}
                    alwaysBounceVertical={false}
                >
                    {this.renderMentionSection(style)}
                    {this.renderReplySection(style)}
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
        input: {
            color: theme.centerChannelColor,
            fontSize: 12,
            height: 40,
        },
        separator: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            flex: 1,
            height: 1,
            marginLeft: 15,
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
        },
        scrollViewContent: {
            paddingVertical: 35,
        },
    };
});

export default injectIntl(NotificationSettingsMentionsIos);
