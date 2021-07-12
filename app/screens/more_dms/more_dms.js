// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Keyboard, View} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {dismissModal, setButtons} from '@actions/navigation';
import CustomList, {FLATLIST, SECTIONLIST} from '@components/custom_list';
import UserListRow from '@components/custom_list/user_list_row';
import FormattedText from '@components/formatted_text';
import KeyboardLayout from '@components/layout/keyboard_layout';
import Loading from '@components/loading';
import SearchBar from '@components/search_bar';
import StatusBar from '@components/status_bar';
import {NavigationTypes} from '@constants';
import {debounce} from '@mm-redux/actions/helpers';
import {General} from '@mm-redux/constants';
import {getGroupDisplayNameFromUserIds} from '@mm-redux/utils/channel_utils';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {displayUsername, filterProfilesMatchingTerm} from '@mm-redux/utils/user_utils';
import {alertErrorWithFallback} from '@utils/general';
import {t} from '@utils/i18n';
import {createProfilesSections, loadingText} from '@utils/member_list';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

import SelectedUsers from './selected_users';

const START_BUTTON = 'start-conversation';
const CLOSE_BUTTON = 'close-dms';

export default class MoreDirectMessages extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            makeDirectChannel: PropTypes.func.isRequired,
            makeGroupChannel: PropTypes.func.isRequired,
            getProfiles: PropTypes.func.isRequired,
            getProfilesInTeam: PropTypes.func.isRequired,
            searchProfiles: PropTypes.func.isRequired,
            setChannelDisplayName: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string,
        allProfiles: PropTypes.object.isRequired,
        currentDisplayName: PropTypes.string,
        currentTeamId: PropTypes.string.isRequired,
        currentUserId: PropTypes.string.isRequired,
        isGuest: PropTypes.bool,
        restrictDirectMessage: PropTypes.bool.isRequired,
        teammateNameDisplay: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props, context) {
        super(props, context);

        this.searchTimeoutId = 0;
        this.next = true;
        this.page = -1;
        this.mounted = false;

        this.state = {
            profiles: [],
            searchResults: [],
            loading: false,
            term: '',
            startingConversation: false,
            selectedIds: {},
            selectedCount: 0,
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
        this.mounted = true;
        this.updateNavigationButtons(false);

        this.getProfiles();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentDidUpdate() {
        const {selectedCount, startingConversation} = this.state;
        const canStart = selectedCount > 0 && !startingConversation;

        this.updateNavigationButtons(canStart);
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === START_BUTTON) {
            this.startConversation();
        } else if (buttonId === CLOSE_BUTTON) {
            this.close();
        }
    }

    setSearchBarRef = (ref) => {
        this.searchBarRef = ref;
    }

    close = () => {
        Keyboard.dismiss();
        dismissModal();
    };

    clearSearch = () => {
        this.setState({term: '', searchResults: []});
    };

    getProfiles = debounce(() => {
        const {loading, term} = this.state;
        if (this.next && !loading && !term && this.mounted) {
            this.setState({loading: true}, () => {
                const {actions, currentTeamId, restrictDirectMessage} = this.props;

                if (restrictDirectMessage) {
                    actions.getProfiles(this.page + 1, General.PROFILE_CHUNK_SIZE).then(this.loadedProfiles);
                } else {
                    actions.getProfilesInTeam(currentTeamId, this.page + 1, General.PROFILE_CHUNK_SIZE).then(this.loadedProfiles);
                }
            });
        }
    }, 100);

    handleSelectProfile = (id) => {
        const {currentUserId} = this.props;

        if (this.state.selectedIds[id]) {
            this.handleRemoveProfile(id);
            return;
        }

        if (id === currentUserId) {
            const selectedId = {};
            selectedId[currentUserId] = true;

            this.startConversation(selectedId);
        } else {
            this.setState((prevState) => {
                const {selectedIds} = prevState;

                const wasSelected = selectedIds[id];

                // Prevent selecting too many users
                if (!wasSelected && Object.keys(selectedIds).length >= General.MAX_USERS_IN_GM - 1) {
                    return {};
                }

                const newSelectedIds = Object.assign({}, selectedIds);
                if (!wasSelected) {
                    newSelectedIds[id] = true;
                }

                return {
                    selectedIds: newSelectedIds,
                    selectedCount: Object.keys(newSelectedIds).length,
                };
            });

            this.clearSearch();
        }
    };

    handleRemoveProfile = (id) => {
        this.setState((prevState) => {
            const {selectedIds} = prevState;

            const newSelectedIds = Object.assign({}, selectedIds);

            Reflect.deleteProperty(newSelectedIds, id);

            return {
                selectedIds: newSelectedIds,
                selectedCount: Object.keys(newSelectedIds).length,
            };
        });
    };

    isStartEnabled = (state) => {
        if (state.startingConversation) {
            return false;
        }

        return state.selectedCount >= 1 && state.selectedCount <= General.MAX_USERS_IN_GM - 1;
    };

    loadedProfiles = ({data}) => {
        if (this.mounted) {
            const {profiles} = this.state;
            if (data && !data.length) {
                this.next = false;
            }

            this.page += 1;
            this.setState({loading: false, profiles: [...profiles, ...data]});
        }
    };

    makeDirectChannel = async (id) => {
        const {intl} = this.context;
        const {actions, allProfiles, teammateNameDisplay} = this.props;

        const user = allProfiles[id];

        const displayName = displayUsername(user, teammateNameDisplay);
        actions.setChannelDisplayName(displayName);

        const result = await actions.makeDirectChannel(id);

        if (result.error) {
            alertErrorWithFallback(
                intl,
                result.error,
                {
                    id: 'mobile.open_dm.error',
                    defaultMessage: "We couldn't open a direct message with {displayName}. Please check your connection and try again.",
                },
                {
                    displayName,
                },
            );
        }

        return !result.error;
    };

    makeGroupChannel = async (ids) => {
        const {intl} = this.context;
        const {
            actions,
            allProfiles,
            currentUserId,
            teammateNameDisplay,
        } = this.props;

        const result = await actions.makeGroupChannel(ids);
        const displayName = getGroupDisplayNameFromUserIds(ids, allProfiles, currentUserId, teammateNameDisplay);
        actions.setChannelDisplayName(displayName);

        if (result.error) {
            alertErrorWithFallback(
                intl,
                result.error,
                {
                    id: t('mobile.open_gm.error'),
                    defaultMessage: "We couldn't open a group message with those users. Please check your connection and try again.",
                },
            );
        }

        return !result.error;
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

    searchProfiles = async (term) => {
        const lowerCasedTerm = term.toLowerCase();
        const {actions, currentTeamId, restrictDirectMessage} = this.props;
        this.setState({loading: true});
        let results;

        if (restrictDirectMessage) {
            results = await actions.searchProfiles(lowerCasedTerm);
        } else {
            results = await actions.searchProfiles(lowerCasedTerm, {team_id: currentTeamId});
        }

        let data = [];
        if (results.data) {
            data = results.data;
        }

        this.setState({searchResults: data, loading: false});
    };

    startConversation = async (selectedId) => {
        const {
            currentDisplayName,
            actions,
        } = this.props;

        if (this.state.startingConversation) {
            return;
        }

        this.setState({
            startingConversation: true,
        });

        // Save the current channel display name in case it fails
        const currentChannelDisplayName = currentDisplayName;

        const selectedIds = selectedId ? Object.keys(selectedId) : Object.keys(this.state.selectedIds);
        let success;
        if (selectedIds.length === 0) {
            success = false;
        } else if (selectedIds.length > 1) {
            success = await this.makeGroupChannel(selectedIds);
        } else {
            success = await this.makeDirectChannel(selectedIds[0]);
        }

        if (success) {
            EventEmitter.emit(NavigationTypes.CLOSE_MAIN_SIDEBAR);
            requestAnimationFrame(() => {
                this.close();
            });
        } else {
            this.setState({
                startingConversation: false,
            });

            actions.setChannelDisplayName(currentChannelDisplayName);
        }
    };

    updateNavigationButtons = (startEnabled, context = this.context) => {
        const {componentId, theme} = this.props;
        const {formatMessage} = context.intl;
        setButtons(componentId, {
            rightButtons: [{
                color: theme.sidebarHeaderTextColor,
                id: START_BUTTON,
                text: formatMessage({id: 'mobile.more_dms.start', defaultMessage: 'Start'}),
                showAsAction: 'always',
                enabled: startEnabled,
                testID: 'more_direct_messages.start.button',
            }],
        });
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
                testID='more_direct_messages.custom_list.user_item'
            />
        );
    };

    filterUnknownUsers = (u) => Boolean(this.props.allProfiles[u.id])

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

    render() {
        const {formatMessage} = this.context.intl;
        const {isGuest, currentUserId, theme} = this.props;
        const {
            loading,
            profiles,
            searchResults,
            selectedIds,
            selectedCount,
            startingConversation,
            term,
        } = this.state;
        const style = getStyleFromTheme(theme);

        if (startingConversation) {
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
            const filterByTerm = (p) => {
                if (selectedCount > 0 && p.id === currentUserId) {
                    return false;
                }

                if (p.username === term || p.username.startsWith(term)) {
                    exactMatches.push(p);
                    return false;
                }

                return true;
            };

            let results;
            if (isGuest) {
                results = filterProfilesMatchingTerm(searchResults, term).filter((u) => filterByTerm(u) && this.filterUnknownUsers(u));
            } else {
                results = filterProfilesMatchingTerm(searchResults, term).filter(filterByTerm);
            }
            data = [...exactMatches, ...results];

            listType = FLATLIST;
        } else {
            if (isGuest) {
                data = createProfilesSections(profiles.filter(this.filterUnknownUsers));
            } else {
                data = createProfilesSections(profiles);
            }
            listType = SECTIONLIST;
        }

        return (
            <SafeAreaView style={style.container}>
                <KeyboardLayout testID='more_direct_messages.screen'>
                    <StatusBar/>
                    <View style={style.searchBar}>
                        <SearchBar
                            testID='more_direct_messages.search_bar'
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
                    <SelectedUsers
                        selectedIds={this.state.selectedIds}
                        warnCount={5}
                        maxCount={7}
                        onRemove={this.handleRemoveProfile}
                    />
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
                        testID='more_direct_messages.custom_list'
                        theme={theme}
                    />
                </KeyboardLayout>
            </SafeAreaView>
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
