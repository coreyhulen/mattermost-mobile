// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Platform,
    View,
} from 'react-native';
import {intlShape} from 'react-intl';
import {SafeAreaView} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import SearchBar from '@components/search_bar';
import {ViewTypes} from '@constants';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

// import List from './list';
// import SwitchTeamsButton from './switch_teams_button';

const {ANDROID_TOP_PORTRAIT} = ViewTypes;
let FilteredList = null;

export default class CategoriesList extends PureComponent {
	public state: any;
	public props: any;
	public closeButton: any;
	public searchBarRef: any;
	public setState: any;
	public context: any;
	public intl: any;
	public testID: any;
	public onShowTeams: any;
	public theme: any;
	public searching: any;
	public term: any;
    static propTypes = {
        testID: PropTypes.string,
        onJoinChannel: PropTypes.func.isRequired,
        onSearchEnds: PropTypes.func.isRequired,
        onSearchStart: PropTypes.func.isRequired,
        onSelectChannel: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
        onShowTeams: PropTypes.func,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            searching: false,
            term: '',
        };

        CompassIcon.getImageSource('close', 24, this.props.theme.sidebarHeaderTextColor).then((source) => {
            this.closeButton = source;
        });
    }

    setSearchBarRef = (ref) => {
        this.searchBarRef = ref;
    }

    cancelSearch = () => {
        if (this.searchBarRef) {
            this.searchBarRef.onCancel();
        }
    };

    onSelectChannel = (channel, currentChannelId) => {
        if (channel.fake) {
            this.props.onJoinChannel(channel, currentChannelId);
        } else {
            this.props.onSelectChannel(channel, currentChannelId);
        }

        this.cancelSearch();
    };

    onSearch = (term) => {
        this.setState({term});
    };

    onSearchFocused = () => {
        if (!FilteredList) {
            FilteredList = require('./filtered_list').default;
        }
        this.setState({searching: true});
        this.props.onSearchStart();
    };

    onSearchCancel = () => {
        this.props.onSearchEnds();
        this.setState({searching: false});
        this.onSearch('');
    };

    render() {
        const {intl} = this.context;
        const {testID, onShowTeams, theme} = this.props;
        const {searching, term} = this.state;
        const styles = getStyleSheet(theme);
        const filteredListTestID = `${testID}.filtered_list`;
        const listTestID = `${testID}.list`;
        const searchBarTestID = `${testID}.search_bar`;
        const switchTeamsButtonTestID = `${testID}.switch_teams.button`;

        let list;
        if (searching) {
            list = (
                <FilteredList
                    testID={filteredListTestID}
                    onSelectChannel={this.onSelectChannel}
                    styles={styles}
                    term={term}
                />
            );
        } else {
            list = (
                <List
                    testID={listTestID}
                    onSelectChannel={this.onSelectChannel}
                    styles={styles}
                />
            );
        }

        const searchBarInput = {
            backgroundColor: changeOpacity(theme.sidebarHeaderTextColor, 0.2),
            color: theme.sidebarHeaderTextColor,
            fontSize: 15,
        };

        let leftComponent;
        if (onShowTeams) {
            leftComponent = (
                <SwitchTeamsButton
                    testID={switchTeamsButtonTestID}
                    onShowTeams={onShowTeams}
                />
            );
        }

        const title = (
            <View
                style={styles.searchContainer}
            >
                <SearchBar
                    testID={searchBarTestID}
                    ref={this.setSearchBarRef}
                    placeholder={intl.formatMessage({id: 'mobile.channel_drawer.search', defaultMessage: 'Jump to...'})}
                    cancelTitle={intl.formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                    backgroundColor='transparent'
                    inputHeight={36}
                    inputStyle={searchBarInput}
                    containerStyle={styles.searchBar}
                    placeholderTextColor={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                    tintColorSearch={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                    tintColorDelete={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                    titleCancelColor={theme.sidebarHeaderTextColor}
                    selectionColor={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                    onSearchButtonPress={this.onSearch}
                    onCancelButtonPress={this.onSearchCancel}
                    onChangeText={this.onSearch}
                    onFocus={this.onSearchFocused}
                    keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                    value={term}
                    showCancel={Platform.OS === 'android'}
                    leftComponent={leftComponent}
                />
            </View>
        );

        return (
            <SafeAreaView
                testID={testID}
                edges={['left']}
                style={styles.container}
            >
                <View style={styles.headerContainer}>
                    {title}
                </View>
                {list}
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        above: {
            backgroundColor: theme.mentionBg,
            top: 40,
            height: 40,
            borderRadius: 4,
            paddingTop: 12,
            paddingRight: 16,
            paddingBottom: 12,
            paddingLeft: 16,
        },
        action: {
            color: changeOpacity(theme.sidebarText, 0.4),
            fontSize: 18,
            fontWeight: '100',
        },
        actionContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
        },
        container: {
            backgroundColor: theme.sidebarBg,
            flex: 1,
        },
        header: {
            color: theme.sidebarHeaderTextColor,
            flex: 1,
            fontSize: 17,
            fontWeight: 'normal',
            paddingLeft: 16,
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
        hitSlop: {
            bottom: 10,
            left: 10,
            right: 10,
            top: 10,
        },
        searchBar: {
            flex: 1,
            overflow: 'visible',
        },
        searchContainer: {
            flex: 1,
            flexDirection: 'row',
            ...Platform.select({
                android: {
                    marginBottom: 1,
                    paddingRight: 8,
                    paddingLeft: 8,
                },
                ios: {
                    marginBottom: 3,
                },
            }),
        },
        separator: {
            backgroundColor: changeOpacity(theme.sidebarHeaderTextColor, 0.1),
            height: 1,
            width: '100%',
        },
        separatorContainer: {
            flex: 1,
            justifyContent: 'center',
            marginHorizontal: 16,
        },
        title: {
            color: theme.sidebarText,
            opacity: 0.4,
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.2,
            lineHeight: 18,
            fontFamily: 'Open Sans',
        },
        titleContainer: { // These aren't used by this component, but they are passed down to the list component
            alignItems: 'center',
            backgroundColor: theme.sidebarBg,
            flex: 1,
            flexDirection: 'row',
            height: 40,
            paddingLeft: 16,
        },
    };
});
