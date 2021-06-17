// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {ScrollView, View} from 'react-native';

import {General} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';

import {showModal, showModalOverCurrentContext, dismissModal} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import CustomStatusText from '@components/custom_status/custom_status_text';
import ClearButton from '@components/custom_status/clear_button';
import Emoji from '@components/emoji';
import FormattedText from '@components/formatted_text';
import UserStatus from '@components/user_status';
import {NavigationTypes, CustomStatus} from '@constants';
import {t} from '@utils/i18n';
import {confirmOutOfOfficeDisabled} from '@utils/status';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import DrawerItem from './drawer_item';
import UserInfo from './user_info';
import StatusLabel from './status_label';

export default class SettingsSidebarBase extends PureComponent {
	public state: any;
	public mounted: any;
	public closeSettingsSidebar: any;
	public props: any;
	public setState: any;
	public statusModal: any;
	public closeButton: any;
	public confirmReset: any;
	public goToCustomStatus: any;
	public goToUserProfile: any;
	public goToMentions: any;
	public goToSaved: any;
	public goToEditProfile: any;
	public goToSettings: any;
	public currentUser: any;
	public currentUserStatus: any;
	public error: any;
	public isCustomStatusEnabled: any;
	public customStatus: any;
	public theme: any;
	public showStatus: any;
	public showRetryMessage: any;
    static propTypes = {
        actions: PropTypes.shape({
            logout: PropTypes.func.isRequired,
            setStatus: PropTypes.func.isRequired,
            unsetCustomStatus: PropTypes.func.isRequired,
        }).isRequired,
        currentUser: PropTypes.object.isRequired,
        status: PropTypes.string,
        theme: PropTypes.object.isRequired,
        isCustomStatusEnabled: PropTypes.bool.isRequired,
        customStatus: PropTypes.object,
    };

    static defaultProps = {
        currentUser: {},
        status: 'offline',
    };

    constructor(props) {
        super(props);
        this.state = {
            showStatus: props.isCustomStatusEnabled,
            showRetryMessage: false,
        };
    }

    componentDidMount() {
        this.mounted = true;
        EventEmitter.on(NavigationTypes.CLOSE_SETTINGS_SIDEBAR, this.closeSettingsSidebar);
        EventEmitter.on(CustomStatus.SET_CUSTOM_STATUS_FAILURE, this.handleSetCustomStatusFailure);
    }

    componentDidUpdate(prevProps) {
        this.handleCustomStatusChange(prevProps.customStatus, this.props.customStatus);
    }

    componentWillUnmount() {
        this.mounted = false;
        EventEmitter.off(NavigationTypes.CLOSE_SETTINGS_SIDEBAR, this.closeSettingsSidebar);
        EventEmitter.off(CustomStatus.SET_CUSTOM_STATUS_FAILURE, this.handleSetCustomStatusFailure);
    }

    handleSetCustomStatusFailure = () => {
        this.setState({
            showRetryMessage: true,
        });
    }

    handleCustomStatusChange = (prevCustomStatus, customStatus) => {
        const isStatusSet = Boolean(customStatus?.emoji);
        if (isStatusSet) {
            const isStatusChanged = prevCustomStatus?.emoji !== customStatus.emoji || prevCustomStatus?.text !== customStatus.text;
            if (isStatusChanged) {
                this.setState({
                    showStatus: true,
                    showRetryMessage: false,
                });
            }
        }
    }

    confirmResetBase = (status, intl) => {
        confirmOutOfOfficeDisabled(intl, status, this.updateStatus);
    };

    handleSetStatus = preventDoubleTap(() => {
        const items = [{
            action: () => this.setStatus(General.ONLINE),
            text: {
                id: t('mobile.set_status.online'),
                defaultMessage: 'Online',
            },
        }, {
            action: () => this.setStatus(General.AWAY),
            text: {
                id: t('mobile.set_status.away'),
                defaultMessage: 'Away',
            },
        }, {
            action: () => this.setStatus(General.DND),
            text: {
                id: t('mobile.set_status.dnd'),
                defaultMessage: 'Do Not Disturb',
            },
        }, {
            action: () => this.setStatus(General.OFFLINE),
            text: {
                id: t('mobile.set_status.offline'),
                defaultMessage: 'Offline',
            },
        }];

        this.statusModal = true;
        showModalOverCurrentContext('OptionsModal', {items});
    });

    goToEditProfileScreen = (intl) => {
        const {currentUser} = this.props;
        const commandType = 'ShowModal';

        this.openModal(
            'EditProfile',
            intl.formatMessage({id: 'mobile.routes.edit_profile', defaultMessage: 'Edit Profile'}),
            {currentUser, commandType},
        );
    };

    goToSavedPostsScreen = (intl) => {
        this.openModal(
            'SavedPosts',
            intl.formatMessage({id: 'search_header.title3', defaultMessage: 'Saved Messages'}),
        );
    };

    goToMentionsScreen = (intl) => {
        this.openModal(
            'RecentMentions',
            intl.formatMessage({id: 'search_header.title2', defaultMessage: 'Recent Mentions'}),
        );
    };

    goToUserProfileScreen = (intl) => {
        const userId = this.props.currentUser.id;

        this.openModal(
            'UserProfile',
            intl.formatMessage({id: 'mobile.routes.user_profile', defaultMessage: 'Profile'}),
            {userId},
        );
    };

    goToSettingsScreeen = (intl) => {
        this.openModal(
            'Settings',
            intl.formatMessage({id: 'mobile.routes.settings', defaultMessage: 'Settings'}),
        );
    };

    goToCustomStatusScreen = (intl) => {
        this.closeSettingsSidebar();
        showModal('CustomStatus', intl.formatMessage({id: 'mobile.routes.custom_status', defaultMessage: 'Set a Status'}));
    }

    logout = preventDoubleTap(() => {
        const {logout} = this.props.actions;
        this.closeSettingsSidebar();
        logout();
    });

    openModal = async (screen, title, passProps = {}) => {
        this.closeSettingsSidebar();

        if (!this.closeButton) {
            this.closeButton = await CompassIcon.getImageSource('close', 24, this.props.theme.sidebarHeaderTextColor);
        }

        const options = {
            topBar: {
                leftButtons: [{
                    id: 'close-settings',
                    icon: this.closeButton,
                    testID: 'close.settings.button',
                }],
            },
        };

        showModal(screen, title, passProps, options);
    };

    updateStatus = (status) => {
        const {currentUser: {id: currentUserId}} = this.props;
        this.props.actions.setStatus({
            user_id: currentUserId,
            status,
        });
    };

    setStatus = (status) => {
        const {status: currentUserStatus} = this.props;

        if (currentUserStatus === General.OUT_OF_OFFICE) {
            dismissModal();
            this.closeSettingsSidebar();
            this.confirmReset(status);
            return;
        }
        this.updateStatus(status);
        EventEmitter.emit(NavigationTypes.NAVIGATION_CLOSE_MODAL);
    };

    renderUserStatusIcon = (userId) => {
        return (
            <UserStatus
                size={24}
                userId={userId}
            />
        );
    };

    renderUserStatusLabel = (userId) => {
        return (
            <StatusLabel userId={userId}/>
        );
    };

    clearCustomStatus = async () => {
        this.setState({showStatus: false, showRetryMessage: false});
        const {error} = await this.props.actions.unsetCustomStatus();
        if (error) {
            this.setState({showStatus: true, showRetryMessage: true});
        }
    }

    renderCustomStatus = () => {
        const {isCustomStatusEnabled, customStatus, theme} = this.props;
        const {showStatus, showRetryMessage} = this.state;

        if (!isCustomStatusEnabled) {
            return null;
        }

        const style = getStyleSheet(theme);
        const isStatusSet = customStatus?.emoji && showStatus;

        const customStatusEmoji = (
            <View
                testID={`custom_status.emoji.${isStatusSet ? customStatus.emoji : 'default'}`}
            >
                {isStatusSet ? (
                    <Emoji
                        emojiName={customStatus.emoji}
                        size={20}
                    />
                ) : (
                    <CompassIcon
                        name='emoticon-happy-outline'
                        size={24}
                        style={style.customStatusIcon}
                    />
                )}
            </View>
        );

        const clearButton = isStatusSet ?
            (
                <ClearButton
                    handlePress={this.clearCustomStatus}
                    theme={theme}
                    testID='settings.sidebar.custom_status.action.clear'
                />
            ) : null;

        const retryMessage = showRetryMessage ?
            (
                <FormattedText
                    id='custom_status.failure_message'
                    defaultMessage='Failed to update status. Try again'
                    style={style.retryMessage}
                />
            ) : null;

        const text = isStatusSet ? customStatus.text : (
            <FormattedText
                id='mobile.routes.custom_status'
                defaultMessage='Set a Status'
            />
        );

        const labelComponent = (
            <>
                <View
                    style={style.customStatusTextContainer}
                >
                    <CustomStatusText
                        text={text}
                        theme={theme}
                    />
                </View>
                {retryMessage}
                {clearButton &&
                    <View
                        style={style.clearButton}
                    >
                        {clearButton}
                    </View>
                }
            </>
        );

        return (
            <DrawerItem
                testID='settings.sidebar.custom_status.action'
                labelComponent={labelComponent}
                leftComponent={customStatusEmoji}
                separator={false}
                onPress={this.goToCustomStatus}
                theme={theme}
            />
        );
    };

    renderOptions = (style) => {
        const {currentUser, theme} = this.props;

        return (
            <View
                testID='settings.sidebar'
                style={style.container}
            >
                <ScrollView
                    alwaysBounceVertical={false}
                    contentContainerStyle={style.wrapper}
                >
                    <UserInfo
                        testID='settings.sidebar.user_info.action'
                        onPress={this.goToUserProfile}
                        user={currentUser}
                    />
                    <View style={style.block}>
                        <DrawerItem
                            testID='settings.sidebar.status.action'
                            labelComponent={this.renderUserStatusLabel(currentUser.id)}
                            leftComponent={this.renderUserStatusIcon(currentUser.id)}
                            separator={this.props.isCustomStatusEnabled}
                            onPress={this.handleSetStatus}
                            theme={theme}
                        />
                        {this.renderCustomStatus()}
                    </View>
                    <View style={style.separator}/>
                    <View style={style.block}>
                        <DrawerItem
                            testID='settings.sidebar.recent_mentions.action'
                            defaultMessage='Recent Mentions'
                            i18nId='search_header.title2'
                            iconName='at'
                            onPress={this.goToMentions}
                            separator={true}
                            theme={theme}
                        />
                        <DrawerItem
                            testID='settings.sidebar.saved_messages.action'
                            defaultMessage='Saved Messages'
                            i18nId='search_header.title3'
                            iconName='bookmark-outline'
                            onPress={this.goToSaved}
                            separator={false}
                            theme={theme}
                        />
                    </View>
                    <View style={style.separator}/>
                    <View style={style.block}>
                        <DrawerItem
                            testID='settings.sidebar.edit_profile.action'
                            defaultMessage='Edit Profile'
                            i18nId='mobile.routes.edit_profile'
                            iconName='pencil-outline'
                            onPress={this.goToEditProfile}
                            separator={true}
                            theme={theme}
                        />
                        <DrawerItem
                            testID='settings.sidebar.settings.action'
                            defaultMessage='Settings'
                            i18nId='mobile.routes.settings'
                            iconName='settings-outline'
                            onPress={this.goToSettings}
                            separator={false}
                            theme={theme}
                        />
                    </View>
                    <View style={style.separator}/>
                    <View style={style.block}>
                        <DrawerItem
                            testID='settings.sidebar.logout.action'
                            defaultMessage='Logout'
                            i18nId='sidebar_right_menu.logout'
                            iconName='exit-to-app'
                            isDestructor={true}
                            onPress={this.logout}
                            separator={false}
                            theme={theme}
                        />
                    </View>
                </ScrollView>
            </View>
        );
    };

    render() {
        return; // eslint-disable-line no-useless-return
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        customStatusTextContainer: {
            width: '70%',
        },
        customStatusIcon: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
        },
        clearButton: {
            position: 'absolute',
            top: 4,
            right: 14,
        },
        retryMessage: {
            color: theme.errorTextColor,
        },
    };
});
