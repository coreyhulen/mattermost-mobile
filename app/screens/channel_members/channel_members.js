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
import {filterProfilesMatchingTerm, isShared} from '@mm-redux/utils/user_utils';
import {alertErrorIfInvalidPermissions} from '@utils/general';
import {createProfilesSections, loadingText} from '@utils/member_list';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

export default class ChannelMembers extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            getProfilesInChannel: PropTypes.func.isRequired,
            handleRemoveChannelMembers: PropTypes.func.isRequired,
            searchProfiles: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string,
        canManageUsers: PropTypes.bool.isRequired,
        currentChannelId: PropTypes.string.isRequired,
        currentChannelMembers: PropTypes.array,
        currentUserId: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
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
            loading: false,
            profiles: [],
            removing: false,
            searchResults: [],
            selectedIds: {},
            term: '',
        };

        this.removeButton = {
            color: props.theme.sidebarHeaderTextColor,
            enabled: false,
            id: 'remove-members',
            showAsAction: 'always',
            testID: 'channel_members.remove.button',
            text: context.intl.formatMessage({id: 'channel_members_modal.remove', defaultMessage: 'Remove'}),
        };

        if (props.canManageUsers) {
            setButtons(props.componentId, {
                rightButtons: [this.removeButton],
            });
        }
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        this.getProfiles();
    }

    componentDidUpdate() {
        const {removing, selectedIds} = this.state;
        const enabled = Object.keys(selectedIds).length > 0 && !removing;

        this.enableRemoveOption(enabled);
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === this.removeButton.id) {
            this.handleRemoveMembersPress();
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

    enableRemoveOption = (enabled) => {
        const {canManageUsers, componentId} = this.props;
        if (canManageUsers) {
            setButtons(componentId, {
                rightButtons: [{...this.removeButton, enabled}],
            });
        }
    };

    getProfiles = debounce(() => {
        const {loading, term} = this.state;
        if (this.next && !loading && !term) {
            this.setState({loading: true}, () => {
                const {actions, currentChannelId} = this.props;

                actions.getProfilesInChannel(
                    currentChannelId,
                    this.page + 1,
                    General.PROFILE_CHUNK_SIZE,
                ).then(this.loadedProfiles);
            });
        }
    }, 100);

    handleRemoveMembersPress = () => {
        const {formatMessage} = this.context.intl;
        const {selectedIds, removing} = this.state;
        const membersToRemove = Object.keys(selectedIds).filter((id) => selectedIds[id]);

        if (!membersToRemove.length) {
            Alert.alert(
                formatMessage({
                    id: 'mobile.routes.channel_members.action',
                    defaultMessage: 'Remove Members',
                }),
                formatMessage({
                    id: 'mobile.routes.channel_members.action_message',
                    defaultMessage: 'You must select at least one member to remove from the channel.',
                }),
            );
            return;
        }

        if (!removing) {
            Alert.alert(
                formatMessage({
                    id: 'mobile.routes.channel_members.action',
                    defaultMessage: 'Remove Members',
                }),
                formatMessage({
                    id: 'mobile.routes.channel_members.action_message_confirm',
                    defaultMessage: 'Are you sure you want to remove the selected members from the channel?',
                }),
                [{
                    text: formatMessage({id: 'mobile.channel_list.alertNo', defaultMessage: 'No'}),
                }, {
                    text: formatMessage({id: 'mobile.channel_list.alertYes', defaultMessage: 'Yes'}),
                    onPress: () => this.removeMembers(membersToRemove),
                }],
            );
        }
    };

    handleSelectProfile = (id) => {
        const {canManageUsers} = this.props;
        const {selectedIds} = this.state;

        if (canManageUsers) {
            const newSelected = Object.assign({}, selectedIds, {[id]: !selectedIds[id]});

            if (Object.values(newSelected).filter((selected) => selected).length) {
                this.enableRemoveOption(true);
            } else {
                this.enableRemoveOption(false);
            }

            this.setState({selectedIds: newSelected});
        }
    };

    loadedProfiles = ({data}) => {
        const {profiles} = this.state;
        if (data && !data.length) {
            this.next = false;
        }

        this.page += 1;
        this.setState({loading: false, profiles: [...profiles, ...data]});
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

    removeMembers = async (membersToRemove) => {
        const {actions, currentChannelId} = this.props;
        this.enableRemoveOption(false);
        this.setState({adding: true}, async () => {
            const result = await actions.handleRemoveChannelMembers(currentChannelId, membersToRemove);

            if (result.error) {
                alertErrorIfInvalidPermissions(result);
                this.enableRemoveOption(true);
                this.setState({removing: false});
            } else {
                this.close();
            }
        });
    };

    renderItem = (props, selectProps) => {
        return (
            <UserListRow
                key={props.id}
                {...props}
                {...selectProps}
            />
        );
    }

    renderSelectableItem = (props) => {
        // The list will re-render when the selection changes because selectedIds is passed into the list as extraData
        const selectProps = {
            selectable: true,
            selected: this.state.selectedIds[props.id],
            enabled: props.id !== this.props.currentUserId && !isShared(props.item),
        };

        return this.renderItem(props, selectProps);
    }

    renderUnselectableItem = (props) => {
        const selectProps = {
            selectable: false,
            enabled: false,
        };

        return this.renderItem(props, selectProps);
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
        const {actions, currentChannelId} = this.props;
        const options = {in_channel_id: currentChannelId};
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
        const {theme, canManageUsers} = this.props;
        const {
            removing,
            loading,
            profiles,
            searchResults,
            selectedIds,
            term,
        } = this.state;
        const style = getStyleFromTheme(theme);

        if (removing) {
            return (
                <View style={style.container}>
                    <StatusBar/>
                    <Loading color={theme.centerChannelColor}/>
                </View>
            );
        }

        let data;
        let listType;
        if (term) {
            const exactMatches = [];
            const results = filterProfilesMatchingTerm(searchResults, term).filter((p) => {
                if (p.username === term || p.username.startsWith(term)) {
                    exactMatches.push(p);
                    return false;
                }

                return true;
            });
            data = [...exactMatches, ...results];
            listType = FLATLIST;
        } else {
            data = createProfilesSections(profiles);
            listType = SECTIONLIST;
        }

        return (
            <KeyboardLayout>
                <SafeAreaView
                    testID='channel_members.screen'
                    edges={['bottom', 'left', 'right']}
                    style={style.container}
                >
                    <StatusBar/>
                    <View style={style.searchBar}>
                        <SearchBar
                            testID='channel_members.search_bar'
                            ref={this.setSearchBarRef}
                            placeholder={formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                            cancelTitle={formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                            backgroundColor='transparent'
                            inputHeight={33}
                            inputStyle={style.searchBarInput}
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
                        renderItem={canManageUsers ? this.renderSelectableItem : this.renderUnselectableItem}
                        testID='channel_members.custom_list'
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
        searchBarInput: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            color: theme.centerChannelColor,
            fontSize: 15,

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
