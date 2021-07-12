// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Alert, View} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {popTopScreen, setButtons} from '@actions/navigation';
import CustomList, {FLATLIST, SECTIONLIST} from '@components/custom_list';
import UserListRow from '@components/custom_list/user_list_row';
import FormattedText from '@components/formatted_text';
import KeyboardLayout from '@components/layout/keyboard_layout';
import Loading from '@components/loading';
import SearchBar from '@components/search_bar';
import StatusBar from '@components/status_bar';
import {debounce} from '@mm-redux/actions/helpers';
import {General} from '@mm-redux/constants';
import {filterProfilesMatchingTerm} from '@mm-redux/utils/user_utils';
import {alertErrorIfInvalidPermissions} from '@utils/general';
import {createProfilesSections, loadingText} from '@utils/member_list';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

export default class ChannelAddMembers extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            getTeamStats: PropTypes.func.isRequired,
            getProfilesNotInChannel: PropTypes.func.isRequired,
            handleAddChannelMembers: PropTypes.func.isRequired,
            searchProfiles: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string,
        currentChannelId: PropTypes.string.isRequired,
        currentChannelGroupConstrained: PropTypes.bool,
        currentTeamId: PropTypes.string.isRequired,
        currentUserId: PropTypes.string.isRequired,
        profilesNotInChannel: PropTypes.array.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        currentChannelGroupConstrained: false,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props, context) {
        super(props, context);

        this.searchTimeoutId = 0;
        this.page = -1;
        this.next = true;

        this.state = {
            adding: false,
            loading: false,
            searchResults: [],
            selectedIds: {},
            term: '',
        };

        this.addButton = {
            enalbed: false,
            id: 'add-members',
            text: context.intl.formatMessage({id: 'integrations.add', defaultMessage: 'Add'}),
            color: props.theme.sidebarHeaderTextColor,
            showAsAction: 'always',
            testID: 'channel_add_members.add.button',
        };

        setButtons(props.componentId, {
            rightButtons: [this.addButton],
        });
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        const {actions, currentTeamId} = this.props;

        actions.getTeamStats(currentTeamId);
        this.getProfiles();

        this.enableAddOption(false);
    }

    componentDidUpdate() {
        const {adding, selectedIds} = this.state;
        const enabled = Object.keys(selectedIds).length > 0 && !adding;

        this.enableAddOption(enabled);
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === this.addButton.id) {
            this.handleAddMembersPress();
        }
    }

    setSearchBarRef = (ref) => {
        this.searchBarRef = ref;
    }

    clearSearch = () => {
        this.setState({term: '', searchResults: []});
    };

    close = () => {
        popTopScreen();
    };

    enableAddOption = (enabled) => {
        const {componentId} = this.props;
        setButtons(componentId, {
            rightButtons: [{...this.addButton, enabled}],
        });
    };

    getProfiles = debounce(() => {
        const {loading, term} = this.state;
        if (this.next && !loading && !term) {
            this.setState({loading: true}, () => {
                const {actions, currentChannelId, currentChannelGroupConstrained, currentTeamId} = this.props;

                actions.getProfilesNotInChannel(
                    currentTeamId,
                    currentChannelId,
                    currentChannelGroupConstrained,
                    this.page + 1,
                    General.PROFILE_CHUNK_SIZE,
                ).then(this.onProfilesLoaded);
            });
        }
    }, 100);

    handleAddMembersPress = () => {
        const {formatMessage} = this.context.intl;
        const {actions, currentChannelId} = this.props;
        const {selectedIds, adding} = this.state;
        const membersToAdd = Object.keys(selectedIds).filter((id) => selectedIds[id]);

        if (!membersToAdd.length) {
            Alert.alert(
                formatMessage({id: 'channel_header.addMembers', defaultMessage: 'Add Members'}),
                formatMessage({
                    id: 'mobile.channel_members.add_members_alert',
                    defaultMessage: 'You must select at least one member to add to the channel.',
                }),
            );

            return;
        }

        if (!adding) {
            this.enableAddOption(false);
            this.setState({adding: true}, async () => {
                const result = await actions.handleAddChannelMembers(currentChannelId, membersToAdd);

                if (result.error) {
                    alertErrorIfInvalidPermissions(result);
                    this.enableAddOption(true);
                    this.setState({adding: false});
                } else {
                    this.close();
                }
            });
        }
    };

    handleSelectProfile = (id) => {
        const {selectedIds} = this.state;
        const newSelected = Object.assign({}, selectedIds, {[id]: !selectedIds[id]});

        if (Object.values(newSelected).filter((selected) => selected).length) {
            this.enableAddOption(true);
        } else {
            this.enableAddOption(false);
        }

        this.setState({selectedIds: newSelected});
    };

    onProfilesLoaded = ({data}) => {
        if (data && !data.length) {
            this.next = false;
        }

        this.page += 1;
        this.setState({
            loading: false,
        });
    };

    onSearch = (text) => {
        if (text) {
            this.setState({term: text});
            clearTimeout(this.searchTimeoutId);

            this.searchTimeoutId = setTimeout(() => {
                this.searchProfiles(text);
            }, General.SEARCH_TIMEOUT_MILLISECONDS);
        } else {
            this.clearSearch();
        }
    };

    renderItem = (props) => {
        // The list will re-render when the selection changes because it's passed into the list as extraData
        const selected = this.state.selectedIds[props.id];

        return (
            <UserListRow
                key={props.id}
                {...props}
                selectable={true}
                selected={selected}
                enabled={true}
            />
        );
    };

    renderLoading = () => {
        const {theme} = this.props;
        const {loading} = this.state;
        const style = getStyleFromTheme(theme);

        if (!loading) {
            return null;
        }

        return (
            <View style={style.loadingContainer}>
                <FormattedText
                    {...loadingText}
                    style={style.loadingText}
                />
            </View>
        );
    };

    renderNoResults = () => {
        const {loading} = this.state;
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        if (loading || this.page === -1) {
            return null;
        }

        return (
            <View style={style.noResultContainer}>
                <FormattedText
                    id='mobile.custom_list.no_results'
                    defaultMessage='No Results'
                    style={style.noResultText}
                />
            </View>
        );
    };

    searchProfiles = (term) => {
        const {actions, currentChannelId, currentChannelGroupConstrained, currentTeamId} = this.props;
        const options = {not_in_channel_id: currentChannelId, team_id: currentTeamId, group_constrained: currentChannelGroupConstrained};
        this.setState({loading: true});

        actions.searchProfiles(term.toLowerCase(), options).then((results) => {
            let data = [];
            if (results.data) {
                data = results.data;
            }
            this.setState({searchResults: data, loading: false});
        });
    };

    render() {
        const {formatMessage} = this.context.intl;
        const {currentUserId, profilesNotInChannel, theme} = this.props;
        const {
            adding,
            loading,
            searchResults,
            selectedIds,
            term,
        } = this.state;
        const style = getStyleFromTheme(theme);

        if (adding) {
            return (
                <View style={style.container}>
                    <StatusBar/>
                    <Loading color={theme.centerChannelColor}/>
                </View>
            );
        }

        const searchBarInput = {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            color: theme.centerChannelColor,
            fontSize: 15,
        };

        let data;
        let listType;
        if (term) {
            const exactMatches = [];
            const results = filterProfilesMatchingTerm(searchResults, term).filter((p) => {
                if (p.id === currentUserId) {
                    return false;
                }

                if (p.username === term || p.username.startsWith(term)) {
                    exactMatches.push(p);
                    return false;
                }

                return true;
            });
            data = [...exactMatches, ...results];
            listType = FLATLIST;
        } else {
            data = createProfilesSections(profilesNotInChannel.filter((user) => user.delete_at === 0));
            listType = SECTIONLIST;
        }

        return (
            <KeyboardLayout>
                <SafeAreaView
                    testID='channel_add_members.screen'
                    edges={['bottom', 'left', 'right']}
                    style={style.container}
                >
                    <StatusBar/>
                    <View style={style.searchBar}>
                        <SearchBar
                            testID='channel_add_members.search_bar'
                            ref={this.setSearchBarRef}
                            placeholder={formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                            cancelTitle={formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                            backgroundColor='transparent'
                            inputHeight={33}
                            inputStyle={searchBarInput}
                            placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                            tintColorSearch={changeOpacity(theme.centerChannelColor, 0.5)}
                            tintColorDelete={changeOpacity(theme.centerChannelColor, 0.5)}
                            titleCancelColor={theme.centerChannelColor}
                            onChangeText={this.onSearch}
                            onSearchButtonPress={this.onSearch}
                            onCancelButtonPress={this.clearSearch}
                            autoCapitalize='none'
                            keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                            value={term}
                        />
                    </View>
                    <CustomList
                        data={data}
                        extraData={selectedIds}
                        key='custom_list'
                        listType={listType}
                        loading={loading}
                        loadingComponent={this.renderLoading()}
                        noResults={this.renderNoResults()}
                        onLoadMore={this.getProfiles}
                        onRowPress={this.handleSelectProfile}
                        renderItem={this.renderItem}
                        testID='channel_add_members.custom_list'
                        theme={theme}
                    />
                </SafeAreaView>
            </KeyboardLayout>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        searchBar: {
            marginVertical: 5,
            height: 38,
        },
        loadingContainer: {
            alignItems: 'center',
            backgroundColor: theme.centerChannelBg,
            height: 70,
            justifyContent: 'center',
        },
        loadingText: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
        },
        noResultContainer: {
            flexGrow: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        noResultText: {
            fontSize: 26,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
    };
});
