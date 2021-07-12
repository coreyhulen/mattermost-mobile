// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Alert,
    ScrollView,
    Text,
    View,
} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
    goToScreen,
    dismissModal,
    setButtons,
    dismissAllModalsAndPopToRoot,
} from '@actions/navigation';
import Config from '@assets/config';
import ChannelIcon from '@components/channel_icon';
import ClearButton from '@components/custom_status/clear_button';
import Emoji from '@components/emoji';
import FormattedText from '@components/formatted_text';
import FormattedTime from '@components/formatted_time';
import ProfilePicture from '@components/profile_picture';
import StatusBar from '@components/status_bar';
import {BotTag, GuestTag} from '@components/tag';
import {General} from '@mm-redux/constants';
import {getUserCurrentTimezone} from '@mm-redux/utils/timezone_utils';
import {displayUsername} from '@mm-redux/utils/user_utils';
import {alertErrorWithFallback} from '@utils/general';
import {t} from '@utils/i18n';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {tryOpenURL} from '@utils/url';
import {isGuest} from '@utils/users';

import UserProfileRow from './user_profile_row';

export default class UserProfile extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            makeDirectChannel: PropTypes.func.isRequired,
            setChannelDisplayName: PropTypes.func.isRequired,
            loadBot: PropTypes.func.isRequired,
            getRemoteClusterInfo: PropTypes.func.isRequired,
            unsetCustomStatus: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string,
        config: PropTypes.object.isRequired,
        currentDisplayName: PropTypes.string,
        teammateNameDisplay: PropTypes.string,
        theme: PropTypes.object.isRequired,
        user: PropTypes.object.isRequired,
        bot: PropTypes.object,
        isMilitaryTime: PropTypes.bool.isRequired,
        enableTimezone: PropTypes.bool.isRequired,
        isMyUser: PropTypes.bool.isRequired,
        remoteClusterInfo: PropTypes.object,
        customStatus: PropTypes.object,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    rightButton = {
        id: 'edit-profile',
        showAsAction: 'always',
        testID: 'user_profile.edit.button',
    };

    constructor(props, context) {
        super(props);

        if (props.isMyUser) {
            this.rightButton.color = props.theme.sidebarHeaderTextColor;
            this.rightButton.text = context.intl.formatMessage({id: 'mobile.routes.user_profile.edit', defaultMessage: 'Edit'});

            const buttons = {
                rightButtons: [this.rightButton],
            };

            setButtons(props.componentId, buttons);
        }
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        const {user} = this.props;
        if (user) {
            if (user.is_bot) {
                this.props.actions.loadBot(user.id);
            }
            if (user.remote_id) {
                this.props.actions.getRemoteClusterInfo(user.remote_id);
            }
        }
    }

    componentWillUnmount() {
        if (this.navigationEventListener) {
            this.navigationEventListener.remove();
        }
    }

    navigationButtonPressed({buttonId}) {
        switch (buttonId) {
        case this.rightButton.id:
            this.goToEditProfile();
            break;
        case 'close-settings':
            this.close();
            break;
        }
    }

    close = async () => {
        dismissModal();
    };

    getDisplayName = () => {
        const {config, theme, teammateNameDisplay, user} = this.props;
        const style = createStyleSheet(theme);

        const displayName = displayUsername(user, teammateNameDisplay);
        const showGuest = isGuest(user);

        if (displayName && (config.ShowFullName === 'true' || user.is_bot || showGuest)) {
            return (
                <View style={style.indicatorContainer}>
                    <Text
                        style={style.displayName}
                        testID='user_profile.display_name'
                    >
                        {displayName}
                    </Text>
                    <BotTag
                        show={Boolean(user.is_bot)}
                        testID='user_profile.bot_tag'
                        theme={theme}
                    />
                    <GuestTag
                        show={showGuest}
                        testID='user_profile.guest_tag'
                        theme={theme}
                    />
                </View>
            );
        }

        return null;
    };

    buildDisplayBlock = (property) => {
        const {formatMessage} = this.context.intl;
        const {theme, user} = this.props;
        const style = createStyleSheet(theme);
        let label;

        if (Object.prototype.hasOwnProperty.call(user, property) && user[property].length > 0) {
            switch (property) {
            case 'first_name':
                label = formatMessage({id: 'user.settings.general.firstName', defaultMessage: 'First Name'});
                break;
            case 'last_name':
                label = formatMessage({id: 'user.settings.general.lastName', defaultMessage: 'Last Name'});
                break;
            case 'email':
                label = formatMessage({id: 'user.settings.general.email', defaultMessage: 'Email'});
                break;
            case 'nickname':
                label = formatMessage({id: 'user.settings.general.nickname', defaultMessage: 'Nickname'});
                break;
            case 'position':
                label = formatMessage({id: 'user.settings.general.position', defaultMessage: 'Position'});
            }

            return (
                <View testID='user_profile.display_block'>
                    <Text
                        style={style.header}
                        testID={`user_profile.display_block.${property}.label`}
                    >
                        {label}
                    </Text>
                    <Text
                        style={style.text}
                        testID={`user_profile.display_block.${property}.value`}
                    >
                        {user[property]}
                    </Text>
                </View>
            );
        }

        return null;
    };

    buildOrganizationBlock = () => {
        const {theme, remoteClusterInfo} = this.props;
        if (!remoteClusterInfo) {
            return null;
        }
        const style = createStyleSheet(theme);
        return (
            <View>
                <FormattedText
                    id='mobile.routes.user_profile.organization'
                    defaultMessage='ORGANIZATION'
                    style={style.header}
                />
                <View style={style.organizationDataContainer}>
                    <ChannelIcon
                        isActive={true}
                        isArchived={false}
                        isBot={false}
                        isInfo={true}
                        size={16}
                        shared={true}
                        theme={theme}
                        type={General.OPEN_CHANNEL}
                    />
                    <Text style={style.text}>{remoteClusterInfo.display_name}</Text>
                </View>
            </View>
        );
    }

    buildCustomStatusBlock = () => {
        const {formatMessage} = this.context.intl;
        const {customStatus, theme, isMyUser} = this.props;
        const style = createStyleSheet(theme);
        const isStatusSet = customStatus?.emoji;

        if (!isStatusSet) {
            return null;
        }

        const label = formatMessage({id: 'user.settings.general.status', defaultMessage: 'Status'});
        return (
            <View
                testID='user_profile.custom_status'
            >
                <Text style={style.header}>{label}</Text>
                <View style={style.customStatus}>
                    <Text
                        style={style.iconContainer}
                        testID={`custom_status.emoji.${customStatus.emoji}`}
                    >
                        <Emoji
                            emojiName={customStatus.emoji}
                            size={20}
                        />
                    </Text>
                    <View style={style.customStatusTextContainer}>
                        <Text style={style.text}>
                            {customStatus.text}
                        </Text>
                    </View>
                    {isMyUser && (
                        <View style={style.clearButton}>
                            <ClearButton
                                theme={theme}
                                handlePress={this.props.actions.unsetCustomStatus}
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    }

    buildTimezoneBlock = () => {
        const {theme, user, isMilitaryTime} = this.props;
        const style = createStyleSheet(theme);

        const currentTimezone = getUserCurrentTimezone(user.timezone);
        if (!currentTimezone) {
            return null;
        }
        const nowDate = new Date();

        return (
            <View>
                <FormattedText
                    id='mobile.routes.user_profile.local_time'
                    defaultMessage='LOCAL TIME'
                    style={style.header}
                    testID='user_profile.timezone_block.local_time.label'
                />
                <Text
                    style={style.text}
                    testID='user_profile.timezone_block.local_time.value'
                >
                    <FormattedTime
                        timezone={currentTimezone}
                        isMilitaryTime={isMilitaryTime}
                        value={nowDate}
                    />
                </Text>
            </View>
        );
    };

    sendMessage = async () => {
        const {intl} = this.context;
        const {actions, currentDisplayName, teammateNameDisplay, user} = this.props;

        // save the current channel display name in case it fails
        const currentChannelDisplayName = currentDisplayName;

        const userDisplayName = displayUsername(user, teammateNameDisplay);
        actions.setChannelDisplayName(userDisplayName);

        const result = await actions.makeDirectChannel(user.id);
        if (result.error) {
            actions.setChannelDisplayName(currentChannelDisplayName);
            alertErrorWithFallback(
                intl,
                result.error,
                {
                    id: t('mobile.open_dm.error'),
                    defaultMessage: "We couldn't open a direct message with {displayName}. Please check your connection and try again.",
                },
                {
                    displayName: userDisplayName,
                },
            );
        } else {
            dismissAllModalsAndPopToRoot();
        }
    };

    handleLinkPress = (link) => {
        const username = this.props.user.username;
        const email = this.props.user.email;
        const {intl} = this.context;

        return () => {
            let hydrated = link.replace(/{email}/, email);
            hydrated = hydrated.replace(/{username}/, username);

            const onError = () => {
                Alert.alert(
                    intl.formatMessage({
                        id: 'mobile.link.error.title',
                        defaultMessage: 'Error',
                    }),
                    intl.formatMessage({
                        id: 'mobile.link.error.text',
                        defaultMessage: 'Unable to open the link.',
                    }),
                );
            };
            tryOpenURL(hydrated, onError);
        };
    };

    goToEditProfile = () => {
        const {user: currentUser} = this.props;
        const {formatMessage} = this.context.intl;
        const commandType = 'Push';
        const screen = 'EditProfile';
        const title = formatMessage({id: 'mobile.routes.edit_profile', defaultMessage: 'Edit Profile'});
        const passProps = {currentUser, commandType};

        requestAnimationFrame(() => {
            goToScreen(screen, title, passProps);
        });
    };

    renderAdditionalOptions = () => {
        if (!Config.ExperimentalProfileLinks) {
            return null;
        }

        const profileLinks = Config.ExperimentalProfileLinks;

        const additionalOptions = profileLinks.map((l) => {
            let action;
            if (l.type === 'link') {
                action = this.handleLinkPress(l.url);
            }

            return (
                <UserProfileRow
                    key={l.defaultMessage}
                    action={action}
                    defaultMessage={l.defaultMessage}
                    textId={l.textId}
                    icon={l.icon}
                    theme={this.props.theme}
                    iconSize={l.iconSize}
                    testID='user_profile.additional_options.action'
                />
            );
        });

        return additionalOptions;
    };

    renderDetailsBlock = (style) => {
        if (this.props.user.is_bot) {
            if (!this.props.bot) {
                return null;
            }

            return (
                <View style={style.content}>
                    <View>
                        <Text style={style.header}>{'DESCRIPTION'}</Text>
                        <Text style={style.text}>{this.props.bot.description || ''}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={style.content}>
                {this.props.config.ShowFullName === 'true' && this.buildDisplayBlock('first_name')}
                {this.props.config.ShowFullName === 'true' && this.buildDisplayBlock('last_name')}
                {this.props.config.ShowEmailAddress === 'true' && this.buildDisplayBlock('email')}
                {this.props.config.EnableCustomUserStatuses === 'true' && this.buildCustomStatusBlock()}
                {this.buildDisplayBlock('nickname')}
                {this.buildOrganizationBlock()}
                {this.buildDisplayBlock('position')}
                {this.props.enableTimezone && this.buildTimezoneBlock()}
            </View>
        );
    }

    render() {
        const {theme, user} = this.props;
        const style = createStyleSheet(theme);

        if (!user) {
            return null;
        }

        return (
            <SafeAreaView
                style={style.container}
                testID='user_profile.screen'
            >
                <StatusBar/>
                <ScrollView
                    style={style.scrollView}
                    contentContainerStyle={style.contentContainer}
                    testID='user_profile.scroll_view'
                >
                    <View style={style.top}>
                        <ProfilePicture
                            userId={user.id}
                            size={153}
                            iconSize={104}
                            statusBorderWidth={6}
                            statusSize={36}
                            testID='user_profile.profile_picture'
                        />
                        {this.getDisplayName()}
                        <Text
                            style={style.username}
                            testID='user_profile.username'
                        >
                            {`@${user.username}`}
                        </Text>
                    </View>
                    <View style={style.divider}/>
                    {this.renderDetailsBlock(style)}
                    <View style={style.divider}/>
                    <UserProfileRow
                        action={this.sendMessage}
                        defaultMessage='Send Message'
                        icon='send'
                        iconSize={24}
                        textId={t('mobile.routes.user_profile.send_message')}
                        theme={theme}
                        testID='user_profile.send_message.action'
                    />
                    {this.renderAdditionalOptions()}
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const createStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        iconContainer: {
            marginRight: 5,
            color: theme.centerChannelColor,
        },
        customStatus: {
            flexDirection: 'row',
        },
        customStatusTextContainer: {
            justifyContent: 'center',
            width: '80%',
        },
        clearButton: {
            position: 'absolute',
            top: -8,
            right: 0,
        },
        content: {
            marginBottom: 25,
            marginHorizontal: 15,
        },
        displayName: {
            color: theme.centerChannelColor,
            fontSize: 17,
            fontWeight: '600',
        },
        header: {
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
            color: changeOpacity(theme.centerChannelColor, 0.5),
            marginTop: 25,
            marginBottom: 10,
        },
        scrollView: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
        },
        contentContainer: {
            paddingBottom: 48,
        },
        text: {
            fontSize: 15,
            color: theme.centerChannelColor,
        },
        top: {
            padding: 25,
            alignItems: 'center',
            justifyContent: 'center',
        },
        username: {
            marginTop: 15,
            color: theme.centerChannelColor,
            fontSize: 15,
        },
        indicatorContainer: {
            marginTop: 15,
            flexDirection: 'row',
        },
        divider: {
            height: 1,
            marginLeft: 16,
            marginRight: 22,
            backgroundColor: '#EBEBEC',
        },
        organizationDataContainer: {
            alignItems: 'center',
            flexDirection: 'row',
        },
    };
});
