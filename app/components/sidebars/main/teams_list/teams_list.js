// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Dimensions,
    FlatList,
    Platform,
    StatusBar,
    Text,
    TouchableHighlight,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {showModal} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {DeviceTypes, ListTypes, ViewTypes} from '@constants';
import {getCurrentServerUrl} from '@init/credentials';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {removeProtocol} from '@utils/url';

import TeamsListItem from './teams_list_item';

const {ANDROID_TOP_PORTRAIT} = ViewTypes;
const VIEWABILITY_CONFIG = {
    ...ListTypes.VISIBILITY_CONFIG_DEFAULTS,
    waitForInteraction: true,
};

export default class TeamsList extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        actions: PropTypes.shape({
            handleTeamChange: PropTypes.func.isRequired,
        }).isRequired,
        closeMainSidebar: PropTypes.func.isRequired,
        currentTeamId: PropTypes.string.isRequired,
        hasOtherJoinableTeams: PropTypes.bool,
        teamIds: PropTypes.array.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            serverUrl: '',
        };

        CompassIcon.getImageSource('close', 24, props.theme.sidebarHeaderTextColor).then((source) => {
            this.closeButton = source;
        });

        getCurrentServerUrl().then((url) => {
            this.setState({serverUrl: removeProtocol(url)});
        });
    }

    selectTeam = (teamId) => {
        const {actions, closeMainSidebar, currentTeamId} = this.props;

        StatusBar.setHidden(false, 'slide');
        requestAnimationFrame(() => {
            if (teamId !== currentTeamId) {
                actions.handleTeamChange(teamId);
            }
        });

        closeMainSidebar();
    };

    goToSelectTeam = preventDoubleTap(async () => {
        const {intl} = this.context;
        const {serverUrl} = this.state;
        const screen = 'SelectTeam';
        const title = intl.formatMessage({id: 'mobile.routes.selectTeam', defaultMessage: 'Select Team'});
        const passProps = {
            currentUrl: serverUrl,
        };
        const options = {
            topBar: {
                leftButtons: [{
                    id: 'close-teams',
                    icon: this.closeButton,
                }],
            },
        };

        showModal(screen, title, passProps, options);
    });

    keyExtractor = (item) => {
        return item;
    };

    listContentPadding = () => {
        if (DeviceTypes.IS_TABLET) {
            return 64;
        }

        const {width, height} = Dimensions.get('window');
        const landscape = width > height;
        if (DeviceTypes.IS_IPHONE_WITH_INSETS) {
            return landscape ? 54 : 44;
        }

        return 64;
    };

    renderItem = ({item}) => {
        const {testID} = this.props;
        const teamsListItemTestID = `${testID}.flat_list.teams_list_item`;

        return (
            <TeamsListItem
                testID={teamsListItemTestID}
                currentUrl={this.state.serverUrl}
                selectTeam={this.selectTeam}
                teamId={item}
            />
        );
    };

    render() {
        const {testID, hasOtherJoinableTeams, teamIds, theme} = this.props;
        const flatListTestID = `${testID}.flat_list`;
        const styles = getStyleSheet(theme);

        let moreAction;
        if (hasOtherJoinableTeams) {
            moreAction = (
                <TouchableHighlight
                    style={styles.moreActionContainer}
                    onPress={this.goToSelectTeam}
                    underlayColor={changeOpacity(theme.sidebarHeaderBg, 0.5)}
                >
                    <Text
                        style={styles.moreAction}
                    >
                        {'+'}
                    </Text>
                </TouchableHighlight>
            );
        }

        return (
            <SafeAreaView
                testID={testID}
                edges={['left']}
                style={styles.container}
            >
                <View style={styles.headerContainer}>
                    <FormattedText
                        id='mobile.drawer.teamsTitle'
                        defaultMessage='Teams'
                        style={styles.header}
                    />
                    {moreAction}
                </View>
                <FlatList
                    testID={flatListTestID}
                    extraData={this.state.serverUrl}
                    contentContainerStyle={this.listContentPadding()}
                    data={teamIds}
                    removeClippedSubviews={true}
                    renderItem={this.renderItem}
                    keyExtractor={this.keyExtractor}
                    viewabilityConfig={VIEWABILITY_CONFIG}
                />
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            backgroundColor: theme.sidebarBg,
            flex: 1,
        },
        headerContainer: {
            alignItems: 'center',
            backgroundColor: theme.sidebarBg,
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: changeOpacity(theme.sidebarHeaderTextColor, 0.10),
            ...Platform.select({
                android: {
                    height: ANDROID_TOP_PORTRAIT,
                },
                ios: {
                    height: 54,
                },
            }),
        },
        header: {
            color: theme.sidebarHeaderTextColor,
            flex: 1,
            fontSize: 17,
            textAlign: 'center',
            fontWeight: '600',
        },
        moreActionContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            width: 50,
            ...Platform.select({
                android: {
                    height: ANDROID_TOP_PORTRAIT,
                },
                ios: {
                    height: 44,
                },
            }),
        },
        moreAction: {
            color: theme.sidebarHeaderTextColor,
            fontSize: 30,
        },
    };
});
