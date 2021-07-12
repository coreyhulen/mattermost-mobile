// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import memoize from 'memoize-one';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Alert,
    InteractionManager,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {resetToChannel, dismissModal} from '@actions/navigation';
import CustomList from '@components/custom_list';
import FormattedText from '@components/formatted_text';
import Loading from '@components/loading';
import StatusBar from '@components/status_bar';
import TeamIcon from '@components/team_icon';
import {NavigationTypes} from '@constants';
import {RequestStatus} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const TEAMS_PER_PAGE = 50;

export default class SelectTeam extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            getTeams: PropTypes.func.isRequired,
            handleTeamChange: PropTypes.func.isRequired,
            addUserToTeam: PropTypes.func.isRequired,
            logout: PropTypes.func.isRequired,
        }).isRequired,
        currentUrl: PropTypes.string.isRequired,
        currentUserIsGuest: PropTypes.bool.isRequired,
        currentUserId: PropTypes.string.isRequired,
        userWithoutTeams: PropTypes.bool,
        teams: PropTypes.array.isRequired,
        theme: PropTypes.object,
        teamsRequest: PropTypes.object.isRequired,
    };

    static defaultProps = {
        teams: [],
    };

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            joining: false,
            teams: [],
            page: 0,
            refreshing: false,
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        this.getTeams();
    }

    navigationButtonPressed({buttonId}) {
        const {logout} = this.props.actions;

        switch (buttonId) {
        case 'close-teams':
            this.close();
            break;
        case 'logout':
            InteractionManager.runAfterInteractions(logout);
            break;
        }
    }

    getTeams = () => {
        this.setState({loading: true});
        this.props.actions.getTeams(this.state.page, TEAMS_PER_PAGE).then(() => {
            this.setState((state) => ({
                loading: false,
                refreshing: false,
                page: state.page + 1,
            }));
        });
    }

    memoizedTeams = memoize((teams) => {
        if (teams.length) {
            return teams;
        }
        return [{
            id: t('mobile.select_team.no_teams'),
            defaultMessage: 'There are no available teams for you to join.',
        }];
    })

    close = () => {
        dismissModal();
    };

    goToChannelView = () => {
        const passProps = {
            disableTermsModal: true,
        };

        resetToChannel(passProps);
    };

    onSelectTeam = async (team) => {
        this.setState({joining: true});
        const {userWithoutTeams, currentUserId} = this.props;
        const {
            addUserToTeam,
            handleTeamChange,
        } = this.props.actions;

        const result = await addUserToTeam(team.id, currentUserId);
        if (result.error) {
            Alert.alert(result.error.message);
            this.setState({joining: false});
            return;
        }

        handleTeamChange(team.id);

        if (userWithoutTeams) {
            this.goToChannelView();
        } else {
            EventEmitter.emit(NavigationTypes.CLOSE_MAIN_SIDEBAR);
            InteractionManager.runAfterInteractions(() => {
                this.close();
            });
        }
    };

    onRefresh = () => {
        this.setState({page: 0, refreshing: true}, () => {
            this.getTeams();
        });
    }

    renderItem = ({item}) => {
        const {currentUrl, theme} = this.props;
        const style = getStyleFromTheme(theme);

        if (item.id === 'mobile.select_team.no_teams') {
            return (
                <View style={style.teamWrapper}>
                    <View style={style.teamContainer}>
                        <FormattedText
                            testID='select_team.no_teams'
                            id={item.id}
                            defaultMessage={item.defaultMessage}
                            style={style.noTeam}
                        />
                    </View>
                </View>
            );
        }

        const testID = 'select_team.custom_list.team_item';
        const itemTestID = `${testID}.${item.id}`;
        const teamDisplayNameTestID = `${testID}.display_name`;
        const teamIconTestID = `${testID}.team_icon`;

        return (
            <View
                testID={testID}
                style={style.teamWrapper}
            >
                <TouchableOpacity
                    onPress={preventDoubleTap(() => this.onSelectTeam(item))}
                >
                    <View
                        testID={itemTestID}
                        style={style.teamContainer}
                    >
                        <TeamIcon
                            testID={teamIconTestID}
                            teamId={item.id}
                            styleContainer={style.teamIconContainer}
                            styleText={style.teamIconText}
                            styleImage={style.imageContainer}
                        />
                        <View style={style.teamNameContainer}>
                            <Text
                                testID={teamDisplayNameTestID}
                                numberOfLines={1}
                                ellipsizeMode='tail'
                                style={style.teamName}
                            >
                                {item.display_name}
                            </Text>
                            <Text
                                numberOfLines={1}
                                ellipsizeMode='tail'
                                style={style.teamUrl}
                            >
                                {`${currentUrl}/${item.name}`}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    render() {
        const {theme} = this.props;
        const teams = this.memoizedTeams(this.props.teams);
        const style = getStyleFromTheme(theme);

        if (this.state.joining) {
            return <Loading color={theme.centerChannelColor}/>;
        }

        if (this.props.teamsRequest.status === RequestStatus.FAILURE) {
            const FailedNetworkAction = require('app/components/failed_network_action').default;

            return (
                <FailedNetworkAction
                    onRetry={this.getTeams}
                    theme={theme}
                />
            );
        }

        if (this.props.currentUserIsGuest) {
            return (
                <View
                    testID='select_team.screen'
                    style={style.container}
                >
                    <StatusBar/>
                    <View style={style.headingContainer}>
                        <FormattedText
                            testID='select_team.guest_cant_join_team'
                            id='mobile.select_team.guest_cant_join_team'
                            defaultMessage='Your guest account has no teams or channels assigned. Please contact an administrator.'
                            style={style.heading}
                        />
                    </View>
                </View>
            );
        }

        return (
            <SafeAreaView
                testID='select_team.screen'
                style={style.container}
            >
                <StatusBar/>
                <View style={style.headingContainer}>
                    <View style={style.headingWrapper}>
                        <FormattedText
                            id='mobile.select_team.join_open'
                            defaultMessage='Open teams you can join'
                            style={style.heading}
                        />
                    </View>
                    <View style={style.line}/>
                </View>
                <CustomList
                    testID='select_team.custom_list'
                    data={teams}
                    loading={this.state.loading}
                    loadingComponent={
                        <View style={style.footer}>
                            <Loading
                                color={theme.centerChannelColor}
                                size='small'
                            />
                        </View>
                    }
                    refreshing={this.state.refreshing}
                    onRefresh={this.onRefresh}
                    onLoadMore={this.getTeams}
                    renderItem={this.renderItem}
                    theme={theme}
                    extraData={this.state.loading}
                    shouldRenderSeparator={false}
                />
            </SafeAreaView>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        headingContainer: {
            alignItems: 'center',
            flexDirection: 'row',
            marginHorizontal: 16,
            marginTop: 20,
        },
        headingWrapper: {
            marginRight: 15,
        },
        heading: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 13,
        },
        line: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            flex: 1,
            height: 1,
        },
        footer: {
            marginVertical: 10,
        },
        teamWrapper: {
            marginTop: 20,
        },
        teamContainer: {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            marginHorizontal: 16,
        },
        teamIconContainer: {
            width: 40,
            height: 40,
            backgroundColor: theme.sidebarBg,
        },
        teamIconText: {
            color: theme.sidebarText,
            fontSize: 18,
        },
        imageContainer: {
            backgroundColor: '#FFF',
        },
        noTeam: {
            color: theme.centerChannelColor,
            fontSize: 14,
        },
        teamNameContainer: {
            flex: 1,
            flexDirection: 'column',
            marginLeft: 10,
        },
        teamName: {
            color: theme.centerChannelColor,
            fontSize: 18,
        },
        teamUrl: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 12,
        },
    };
});
