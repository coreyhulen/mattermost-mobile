// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {intlShape} from 'react-intl';
import {Alert, Animated, Keyboard, StyleSheet} from 'react-native';

import {General} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';

import {showModal, showModalOverCurrentContext} from '@actions/navigation';
import {TYPING_VISIBLE} from '@constants/post_draft';
import CompassIcon from '@components/compass_icon';
import PushNotifications from '@init/push_notifications';
import EphemeralStore from '@store/ephemeral_store';
import telemetry, {PERF_MARKERS} from '@telemetry';
import {unsupportedServer} from '@utils/supported_server';
import {preventDoubleTap} from '@utils/tap';
import {setNavigatorStyles} from '@utils/theme';

export default class ChannelBase extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            getChannelStats: PropTypes.func.isRequired,
            loadChannelsForTeam: PropTypes.func.isRequired,
            selectDefaultTeam: PropTypes.func.isRequired,
            selectInitialChannel: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string.isRequired,
        currentChannelId: PropTypes.string,
        currentTeamId: PropTypes.string,
        currentUserId: PropTypes.string,
        disableTermsModal: PropTypes.bool,
        isSupportedServer: PropTypes.bool,
        isSystemAdmin: PropTypes.bool,
        teamName: PropTypes.string,
        theme: PropTypes.object.isRequired,
        showTermsOfService: PropTypes.bool,
        skipMetrics: PropTypes.bool,
        viewingGlobalThreads: PropTypes.bool,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    static defaultProps = {
        disableTermsModal: false,
        viewingGlobalThreads: false,
    };

    constructor(props) {
        super(props);

        this.postDraft = React.createRef();

        this.state = {
            channelsRequestFailed: false,
        };

        if (props.currentChannelId) {
            telemetry.start([PERF_MARKERS.CHANNEL_RENDER], Date.now(), ['Initial Channel Render']);
        }

        this.typingAnimations = [];
    }

    componentDidMount() {
        const {
            actions,
            currentChannelId,
            currentTeamId,
            disableTermsModal,
            isSupportedServer,
            isSystemAdmin,
            showTermsOfService,
        } = this.props;

        EventEmitter.on('leave_team', this.handleLeaveTeam);
        EventEmitter.on(TYPING_VISIBLE, this.runTypingAnimations);
        EventEmitter.on(General.REMOVED_FROM_CHANNEL, this.handleRemovedFromChannel);

        if (currentTeamId) {
            this.loadChannels(currentTeamId);
        } else {
            actions.selectDefaultTeam();
        }

        if (currentChannelId) {
            this.clearChannelNotifications();
            requestAnimationFrame(() => {
                actions.getChannelStats(currentChannelId);
            });
        }

        if (showTermsOfService && !disableTermsModal) {
            this.showTermsOfServiceModal();
        } else if (!isSupportedServer) {
            // Only display the Alert if the TOS does not need to show first
            unsupportedServer(isSystemAdmin, this.context.intl.formatMessage);
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.isSupportedServer && !this.props.isSupportedServer) {
            unsupportedServer(this.props.isSystemAdmin, this.context.intl.formatMessage);
        }

        if (this.props.theme !== prevProps.theme) {
            setNavigatorStyles(this.props.componentId, this.props.theme);
            EphemeralStore.allNavigationComponentIds.forEach((componentId) => {
                if (this.props.componentId !== componentId) {
                    setNavigatorStyles(componentId, this.props.theme);
                }
            });
        }

        if (this.props.currentUserId && prevProps.currentTeamId && !this.props.currentTeamId) {
            this.props.actions.selectDefaultTeam();
        }

        if (this.props.currentTeamId &&
            (!this.props.currentChannelId || this.props.currentTeamId !== prevProps.currentTeamId)) {
            this.loadChannels(this.props.currentTeamId);
        }

        if (this.props.currentChannelId && this.props.currentChannelId !== prevProps.currentChannelId) {
            this.clearChannelNotifications();

            requestAnimationFrame(() => {
                this.props.actions.getChannelStats(this.props.currentChannelId);
            });
        }
    }

    componentWillUnmount() {
        EventEmitter.off('leave_team', this.handleLeaveTeam);
        EventEmitter.off(TYPING_VISIBLE, this.runTypingAnimations);
        EventEmitter.off(General.REMOVED_FROM_CHANNEL, this.handleRemovedFromChannel);
    }

    clearChannelNotifications = () => {
        const clearNotificationsTimeout = setTimeout(() => {
            clearTimeout(clearNotificationsTimeout);
            PushNotifications.clearChannelNotifications(this.props.currentChannelId);
        }, 1000);
    }

    registerTypingAnimation = (animation) => {
        const length = this.typingAnimations.push(animation);
        const removeAnimation = () => {
            const animationIndex = length - 1;
            this.typingAnimations = this.typingAnimations.filter((a, index) => index !== animationIndex);
        };

        return removeAnimation;
    }

    runTypingAnimations = (typingVisible) => {
        Animated.parallel(
            this.typingAnimations.map((animation) => animation(typingVisible)),
        ).start();
    }

    goToChannelInfo = preventDoubleTap(() => {
        const {intl} = this.context;
        const {theme} = this.props;
        const screen = 'ChannelInfo';
        const title = intl.formatMessage({id: 'mobile.routes.channelInfo', defaultMessage: 'Info'});
        CompassIcon.getImageSource('close', 24, theme.sidebarHeaderTextColor).then((source) => {
            const options = {
                topBar: {
                    leftButtons: [{
                        id: 'close-info',
                        icon: source,
                        testID: 'close.channel_info.button',
                    }],
                },
            };

            Keyboard.dismiss();

            showModal(screen, title, null, options);
        });
    }, 1000);

    handleLeaveTeam = () => {
        this.props.actions.selectDefaultTeam();
    };

    handleRemovedFromChannel = (channelName) => {
        const {formatMessage} = this.context.intl;

        Alert.alert(
            formatMessage({
                id: 'mobile.user_removed.title',
                defaultMessage: 'Removed from {channelName}',
            }, {channelName}),
            formatMessage({
                id: 'mobile.user_removed.message',
                defaultMessage: 'You were removed from the channel.',
            }),
        );
    };

    loadChannels = (teamId) => {
        const {loadChannelsForTeam, selectInitialChannel} = this.props.actions;
        if (EphemeralStore.getStartFromNotification()) {
            // eslint-disable-next-line no-console
            console.log('Switch to channel from a push notification');
            EphemeralStore.setStartFromNotification(false);
        } else {
            loadChannelsForTeam(teamId).then((result) => {
                if (result?.error) {
                    this.setState({channelsRequestFailed: true});
                    return;
                }

                this.setState({channelsRequestFailed: false});
                selectInitialChannel(teamId);
            });
        }
    };

    retryLoad = () => {
        const {currentTeamId, actions} = this.props;
        if (currentTeamId) {
            this.loadChannels(currentTeamId);
        } else {
            actions.selectDefaultTeam();
        }
    }

    retryLoadChannels = () => {
        this.loadChannels(this.props.currentTeamId);
    };

    renderLoadingOrFailedChannel() {
        const {formatMessage} = this.context.intl;
        const {
            currentChannelId,
            teamName,
            theme,
        } = this.props;

        const {channelsRequestFailed} = this.state;
        if (!currentChannelId) {
            if (channelsRequestFailed) {
                const FailedNetworkAction = require('app/components/failed_network_action').default;
                const title = formatMessage({id: 'mobile.failed_network_action.teams_title', defaultMessage: 'Something went wrong'});
                const message = formatMessage({
                    id: 'mobile.failed_network_action.teams_channel_description',
                    defaultMessage: 'Channels could not be loaded for {teamName}.',
                }, {teamName});

                return (
                    <FailedNetworkAction
                        errorMessage={message}
                        errorTitle={title}
                        onRetry={this.retryLoadChannels}
                        theme={theme}
                    />
                );
            }

            const Loading = require('app/components/channel_loader').default;
            return (
                <Loading
                    channelIsLoading={true}
                    color={theme.centerChannelColor}
                    retryLoad={this.retryLoad}
                />
            );
        }

        return null;
    }

    showTermsOfServiceModal = async () => {
        const {intl} = this.context;
        const {isSupportedServer, isSystemAdmin, theme} = this.props;
        const screen = 'TermsOfService';
        const title = intl.formatMessage({id: 'mobile.tos_link', defaultMessage: 'Terms of Service'});
        CompassIcon.getImageSource('close', 24, theme.sidebarHeaderTextColor).then((closeButton) => {
            const passProps = {
                closeButton,
                isSupportedServer,
                isSystemAdmin,
            };
            const options = {
                layout: {
                    componentBackgroundColor: theme.centerChannelBg,
                },
                topBar: {
                    visible: true,
                    height: null,
                    title: {
                        color: theme.sidebarHeaderTextColor,
                        text: title,
                    },
                },
            };

            showModalOverCurrentContext(screen, passProps, options);
        });
    };

    render() {
        // Overriden in channel.android.js and channel.ios.js
        // but defined here for channel_base.test.js
        return; // eslint-disable-line no-useless-return
    }
}

export const style = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
