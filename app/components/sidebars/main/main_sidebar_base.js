// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    Dimensions,
    Platform,
    StyleSheet,
    View,
} from 'react-native';

import SafeAreaView from '@components/safe_area_view';
import {NavigationTypes, WebsocketEvents} from '@constants';
import {General} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {t} from '@utils/i18n';

import ChannelsList from './channels_list';
import DrawerSwiper from './drawer_swiper';
import TeamsList from './teams_list';

export default class MainSidebarBase extends Component {
    static propTypes = {
        actions: PropTypes.shape({
            getTeams: PropTypes.func.isRequired,
            handleSelectChannel: PropTypes.func,
            joinChannel: PropTypes.func.isRequired,
            makeDirectChannel: PropTypes.func.isRequired,
            setChannelDisplayName: PropTypes.func.isRequired,
            fetchMyCategories: PropTypes.func.isRequired,
        }).isRequired,
        children: PropTypes.node,
        currentTeamId: PropTypes.string.isRequired,
        currentUserId: PropTypes.string,
        locale: PropTypes.string,
        teamsCount: PropTypes.number.isRequired,
        theme: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.swiperIndex = 1;
        this.channelListRef = React.createRef();
    }

    componentDidMount() {
        this.mounted = true;
        this.props.actions.getTeams();

        if (this.props.currentTeamId) {
            this.props.actions.fetchMyCategories(this.props.currentTeamId);
        }

        EventEmitter.on(NavigationTypes.CLOSE_MAIN_SIDEBAR, this.closeMainSidebar);
        EventEmitter.on(WebsocketEvents.CHANNEL_UPDATED, this.handleUpdateTitle);
        Dimensions.addEventListener('change', this.handleDimensions);
    }

    shouldComponentUpdate(nextProps, nextState) {
        const {currentTeamId, teamsCount, theme} = this.props;
        const {deviceWidth, openDrawerOffset, isSplitView, permanentSidebar, searching} = this.state;

        if (nextState.openDrawerOffset !== openDrawerOffset && Platform.OS === 'ios') {
            return true;
        }

        if (nextState.searching !== searching || nextState.deviceWidth !== deviceWidth) {
            return true;
        }

        const condition = nextProps.currentTeamId !== currentTeamId ||
            nextProps.teamsCount !== teamsCount ||
            nextProps.theme !== theme || this.props.children !== nextProps.children;

        if (Platform.OS === 'ios') {
            return condition ||
                nextState.isSplitView !== isSplitView ||
                nextState.permanentSidebar !== permanentSidebar;
        }

        return condition;
    }

    componentWillUnmount() {
        this.mounted = false;
        EventEmitter.off(NavigationTypes.CLOSE_MAIN_SIDEBAR, this.closeMainSidebar);
        EventEmitter.off(WebsocketEvents.CHANNEL_UPDATED, this.handleUpdateTitle);
        Dimensions.removeEventListener('change', this.handleDimensions);
    }

    drawerSwiperRef = (ref) => {
        this.drawerSwiper = ref;
    };

    getIntl = () => {
        const {intl} = this.providerRef ? this.providerRef.getChildContext() : this.context;
        return intl;
    };

    handleUpdateTitle = (channel) => {
        let channelName = '';
        if (channel.display_name) {
            channelName = channel.display_name;
        }
        this.props.actions.setChannelDisplayName(channelName);
    };

    joinChannel = async (channel, currentChannelId) => {
        const intl = this.getIntl();
        const {
            actions,
            currentTeamId,
            currentUserId,
        } = this.props;

        const {
            joinChannel,
            makeDirectChannel,
        } = actions;

        this.closeMainSidebar();

        const displayValue = {displayName: channel.display_name};
        const utils = require('app/utils/general');

        let result;
        if (channel.type === General.DM_CHANNEL) {
            result = await makeDirectChannel(channel.id, false);

            if (result.error) {
                const dmFailedMessage = {
                    id: t('mobile.open_dm.error'),
                    defaultMessage: "We couldn't open a direct message with {displayName}. Please check your connection and try again.",
                };
                utils.alertErrorWithFallback(intl, result.error, dmFailedMessage, displayValue);
            }
        } else {
            result = await joinChannel(currentUserId, currentTeamId, channel.id);

            if (result.error || !result.data || !result.data.channel) {
                const joinFailedMessage = {
                    id: t('mobile.join_channel.error'),
                    defaultMessage: "We couldn't join the channel {displayName}. Please check your connection and try again.",
                };
                utils.alertErrorWithFallback(intl, result.error, joinFailedMessage, displayValue);
            }
        }

        if (result.error || (!result.data && !result.data.channel)) {
            return;
        }

        this.selectChannel(result.data.channel || result.data, currentChannelId, false);
    };

    onSearchEnds = () => {
        this.setState({searching: false});
        if (this.drawerRef?.current) {
            this.drawerRef.current.canClose = true;
        }
    };

    onSearchStart = () => {
        if (this.drawerRef?.current) {
            this.drawerRef.current.canClose = false;
        }
        this.setState({searching: true});
    };

    showTeams = () => {
        if (this.drawerSwiper) {
            this.drawerSwiper.showTeamsPage();
        }
    };

    resetDrawer = () => {
        if (this.drawerSwiper) {
            this.drawerSwiper.resetPage();
        }

        if (this.drawerRef?.current) {
            this.drawerRef.current.canClose = true;
        }

        if (this.channelListRef?.current) {
            this.channelListRef.current.cancelSearch();
        }
    };

    renderNavigationView = (drawerWidth) => {
        const {
            teamsCount,
            theme,
        } = this.props;

        const {
            openDrawerOffset,
            searching,
        } = this.state;

        const offset = Platform.select({android: 64, ios: 0});
        const multipleTeams = teamsCount > 1;
        const showTeams = !searching && multipleTeams;
        if (this.drawerSwiper) {
            if (multipleTeams) {
                this.drawerSwiper.runOnLayout();
                this.drawerSwiper.scrollToInitial();
            } else if (!openDrawerOffset) {
                this.drawerSwiper.scrollToStart();
            }
        }

        const lists = [];
        if (multipleTeams) {
            const teamsList = (
                <View
                    key='teamsList'
                    style={style.swiperContent}
                >
                    <TeamsList
                        testID='main.sidebar.teams_list'
                        closeMainSidebar={this.closeMainSidebar}
                    />
                </View>
            );
            lists.push(teamsList);
        }

        lists.push(
            <View
                key='channelsList'
                style={style.swiperContent}
            >
                <ChannelsList
                    testID='main.sidebar.channels_list'
                    ref={this.channelListRef}
                    onSelectChannel={this.selectChannel}
                    onJoinChannel={this.joinChannel}
                    onShowTeams={multipleTeams ? this.showTeams : undefined}
                    onSearchStart={this.onSearchStart}
                    onSearchEnds={this.onSearchEnds}
                    theme={theme}
                />
            </View>,
        );

        return (
            <SafeAreaView
                excludeFooter={true}
                excludeLeft={true}
                excludeRight={true}
                navBarBackgroundColor={theme.sidebarBg}
                backgroundColor={theme.sidebarHeaderBg}
                footerColor={theme.sidebarBg}
            >
                <DrawerSwiper
                    ref={this.drawerSwiperRef}
                    onPageSelected={this.onPageSelected}
                    showTeams={showTeams}
                    drawerOpened={this.state.drawerOpened}
                    drawerWidth={drawerWidth - offset}
                    testID='main.sidebar'
                >
                    {lists}
                </DrawerSwiper>
            </SafeAreaView>
        );
    };

    selectChannel = (channel, currentChannelId, closeDrawer = true) => {
        const {handleSelectChannel} = this.props.actions;

        if (closeDrawer) {
            this.closeMainSidebar();
        }

        if (channel.id === currentChannelId) {
            return;
        }

        if (!channel) {
            const utils = require('app/utils/general');
            const intl = this.getIntl();

            const unableToJoinMessage = {
                id: t('mobile.open_unknown_channel.error'),
                defaultMessage: "We couldn't join the channel. Please reset the cache and try again.",
            };
            const erroMessage = {};

            utils.alertErrorWithFallback(intl, erroMessage, unableToJoinMessage);
            return;
        }

        handleSelectChannel(channel.id);
    };

    render() {
        return; // eslint-disable-line no-useless-return
    }
}

const style = StyleSheet.create({
    swiperContent: {
        flex: 1,
    },
});
