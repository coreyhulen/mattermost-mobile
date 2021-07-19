// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Platform,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {popTopScreen} from '@actions/navigation';
import CustomList, {FLATLIST, SECTIONLIST} from '@components/custom_list';
import UserListRow from '@components/custom_list/user_list_row';
import ChannelListRow from '@components/custom_list/channel_list_row';
import OptionListRow from '@components/custom_list/option_list_row';
import FormattedText from '@components/formatted_text';
import SearchBar from '@components/search_bar';
import StatusBar from '@components/status_bar';
import {ViewTypes} from '@constants';
import {debounce} from '@mm-redux/actions/helpers';
import {General} from '@mm-redux/constants';
import {filterProfilesMatchingTerm} from '@mm-redux/utils/user_utils';
import {filterChannelsMatchingTerm} from '@mm-redux/utils/channel_utils';
import {memoizeResult} from '@mm-redux/utils/helpers';
import {t} from '@utils/i18n';
import {createProfilesSections, loadingText} from '@utils/member_list';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';
import {Theme} from '@mm-redux/types/preferences';
import {DialogOption} from '@mm-redux/types/integrations';
import {Channel} from '@mm-redux/types/channels';
import {ActionResult} from '@mm-redux/types/actions';
import {UserProfile} from '@mm-redux/types/users';
import SelectedOptions from './selected_options';
import {EventSubscription, Navigation} from 'react-native-navigation';

type DataType = DialogOption[] | Channel[] | UserProfile[];
type Selection = DialogOption | Channel | UserProfile | DialogOption[] | Channel[] | UserProfile[];

type Props = {
    actions: {
        getProfiles: (page?: number, perPage?: number, options?: any) => Promise<ActionResult>;
        getChannels: (teamId: string, page?: number, perPage?: number) => Promise<ActionResult>;
        searchProfiles: (term: string, options?: any) => Promise<ActionResult>;
        searchChannels: (teamId: string, term: string, archived?: boolean | undefined) => Promise<ActionResult>;
    };
    getDynamicOptions?: (term: string) => Promise<ActionResult>;
    currentTeamId: string;
    data?: DataType;
    dataSource: string;
    onSelect: (opt: Selection) => void;
    isMultiselect?: boolean;
    selected?: DialogOption[];
    theme: Theme;
}

type State = {
    data: DataType | {id: string; data: DataType}[];
    loading: boolean;
    searchResults: DialogOption[];
    term: string;
    multiselectSelected: DataType;
}

export default class SelectorScreen extends PureComponent<Props, State> {
    static contextTypes = {
        intl: intlShape.isRequired,
    };

    private navigationEventListener?: EventSubscription;

    private searchTimeoutId = 0;
    private page = -1;
    private next: boolean;
    private searchBarRef = React.createRef<SearchBar>();
    constructor(props: Props) {
        super(props);

        this.next = props.dataSource === ViewTypes.DATA_SOURCE_USERS || props.dataSource === ViewTypes.DATA_SOURCE_CHANNELS || props.dataSource === ViewTypes.DATA_SOURCE_DYNAMIC;

        let data: DataType = [];
        if (!props.dataSource) {
            data = props.data || [];
        }

        let multiselectSelected: DataType = [];
        if (props.isMultiselect && props.selected && !([ViewTypes.DATA_SOURCE_USERS, ViewTypes.DATA_SOURCE_CHANNELS].includes(props.dataSource))) {
            multiselectSelected = props.selected;
        }

        this.state = {
            data,
            loading: false,
            searchResults: [],
            term: '',
            multiselectSelected,
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
        const {dataSource} = this.props;
        if (dataSource === ViewTypes.DATA_SOURCE_USERS) {
            this.getProfiles();
        } else if (dataSource === ViewTypes.DATA_SOURCE_CHANNELS) {
            this.getChannels();
        } else if (dataSource === ViewTypes.DATA_SOURCE_DYNAMIC) {
            this.getDynamicOptions();
        }
    }

    clearSearch = () => {
        this.setState({term: '', searchResults: []});
    };

    close = () => {
        popTopScreen();
    };

    handleSelectItem = (id: string, item: UserProfile | Channel | DialogOption) => {
        if (!this.props.isMultiselect) {
            this.props.onSelect(item);
            this.close();
            return;
        }

        switch (this.props.dataSource) {
        case ViewTypes.DATA_SOURCE_USERS: {
            const currentList = this.state.multiselectSelected as UserProfile[];
            const typedItem = item as UserProfile;
            if (!currentList.find((u) => u.id === typedItem.id)) {
                this.setState({multiselectSelected: [...currentList, typedItem]});
            }
            return;
        }
        case ViewTypes.DATA_SOURCE_CHANNELS: {
            const currentList = this.state.multiselectSelected as Channel[];
            const typedItem = item as Channel;
            if (!currentList.find((u) => u.id === typedItem.id)) {
                this.setState({multiselectSelected: [...currentList, typedItem]});
            }
            return;
        }
        default: {
            const currentList = this.state.multiselectSelected as DialogOption[];
            const typedItem = item as DialogOption;
            if (!currentList.find((u) => u.value === typedItem.value)) {
                this.setState({multiselectSelected: [...currentList, typedItem]});
            }
        }
        }
    };

    navigationButtonPressed({buttonId}: {buttonId: string}) {
        switch (buttonId) {
        case 'submit-form':
            this.props.onSelect(this.state.multiselectSelected);
            this.close();
            return;
        case 'close-dialog':
            this.close();
        }
    }

    handleRemoveOption = (item: UserProfile | Channel | DialogOption) => {
        switch (this.props.dataSource) {
        case ViewTypes.DATA_SOURCE_USERS: {
            const currentList = this.state.multiselectSelected as UserProfile[];
            const multiselectSelected = currentList.filter((u) => u.id !== (item as UserProfile).id);
            this.setState({multiselectSelected});
            return;
        }
        case ViewTypes.DATA_SOURCE_CHANNELS: {
            const currentList = this.state.multiselectSelected as Channel[];
            const multiselectSelected = currentList.filter((u) => u.id !== (item as Channel).id);
            this.setState({multiselectSelected});
            return;
        }
        default: {
            const currentList = this.state.multiselectSelected as DialogOption[];
            const multiselectSelected = currentList.filter((u) => u.value !== (item as DialogOption).value);
            this.setState({multiselectSelected});
        }
        }
    }

    getChannels = debounce(() => {
        const {actions, currentTeamId} = this.props;
        const {loading, term} = this.state;
        if (this.next && !loading && !term) {
            this.setState({loading: true}, () => {
                actions.getChannels(
                    currentTeamId,
                    this.page += 1,
                    General.CHANNELS_CHUNK_SIZE,
                ).then(this.loadedChannels);
            });
        }
    }, 100);

    getDataResults = () => {
        const {dataSource} = this.props;
        const {data, searchResults, term} = this.state;

        const result = {
            data,
            listType: FLATLIST};
        if (term) {
            result.data = filterSearchData(dataSource, searchResults, term);
        } else if (dataSource === ViewTypes.DATA_SOURCE_USERS) {
            result.data = createProfilesSections(data);
            result.listType = SECTIONLIST;
        }

        return result;
    };

    getProfiles = debounce(() => {
        const {loading, term} = this.state;
        if (this.next && !loading && !term) {
            this.setState({loading: true}, () => {
                const {actions} = this.props;

                actions.getProfiles(
                    this.page + 1,
                    General.PROFILE_CHUNK_SIZE,
                ).then(this.loadedProfiles);
            });
        }
    }, 100);

    getDynamicOptions = debounce(() => {
        const {loading, term} = this.state;
        if (this.next && !loading && !term) {
            this.searchDynamicOptions('');
        }
    }, 100);

    loadedChannels = ({data: channels}: {data: Channel[]}) => {
        const data = this.state.data as Channel[];
        if (channels && !channels.length) {
            this.next = false;
        }

        this.page += 1;
        this.setState({loading: false, data: [...channels, ...data]});
    };

    loadedProfiles = ({data: profiles}: {data: UserProfile[]}) => {
        const data = this.state.data as UserProfile[];
        if (profiles && !profiles.length) {
            this.next = false;
        }

        this.page += 1;
        this.setState({loading: false, data: [...profiles, ...data]});
    };

    loadMore = () => {
        const {dataSource} = this.props;

        if (dataSource === ViewTypes.DATA_SOURCE_USERS) {
            this.getProfiles();
        } else if (dataSource === ViewTypes.DATA_SOURCE_CHANNELS) {
            this.getChannels();
        }

        // dynamic options are not paged so are not reloaded on scroll
    };

    onSearch = (text: string) => {
        if (text) {
            const {dataSource, data} = this.props;
            this.setState({term: text});
            clearTimeout(this.searchTimeoutId);

            this.searchTimeoutId = setTimeout(() => {
                if (!dataSource) {
                    this.setState({searchResults: filterSearchData(null, data, text)});
                    return;
                }

                if (dataSource === ViewTypes.DATA_SOURCE_USERS) {
                    this.searchProfiles(text);
                } else if (dataSource === ViewTypes.DATA_SOURCE_CHANNELS) {
                    this.searchChannels(text);
                } else if (dataSource === ViewTypes.DATA_SOURCE_DYNAMIC) {
                    this.searchDynamicOptions(text);
                }
            }, General.SEARCH_TIMEOUT_MILLISECONDS) as any;
        } else {
            this.clearSearch();
        }
    };

    searchChannels = (term: string) => {
        const {actions, currentTeamId} = this.props;

        actions.searchChannels(currentTeamId, term.toLowerCase()).then(({data}) => {
            this.setState({searchResults: data, loading: false});
        });
    };

    searchProfiles = (term: string) => {
        const {actions} = this.props;
        this.setState({loading: true});

        actions.searchProfiles(term.toLowerCase()).then((results) => {
            let data = [];
            if (results.data) {
                data = results.data;
            }
            this.setState({searchResults: data, loading: false});
        });
    };

    searchDynamicOptions = (term = '') => {
        if (!this.props.getDynamicOptions) {
            return;
        }

        this.setState({loading: true});

        this.props.getDynamicOptions(term.toLowerCase()).then((results) => {
            let data = [];
            if (results.data) {
                data = results.data;
            }

            if (term) {
                this.setState({searchResults: data, loading: false});
            } else {
                this.setState({data, loading: false});
            }
        });
    };

    renderLoading = () => {
        const {dataSource, theme} = this.props;
        const {loading} = this.state;
        const style = getStyleFromTheme(theme);

        if (!loading) {
            return null;
        }

        let text;
        switch (dataSource) {
        case ViewTypes.DATA_SOURCE_USERS:
            text = loadingText;
            break;
        case ViewTypes.DATA_SOURCE_CHANNELS:
            text = {
                id: t('mobile.loading_channels'),
                defaultMessage: 'Loading Channels...',
            };
            break;
        default:
            text = {
                id: t('mobile.loading_options'),
                defaultMessage: 'Loading Options...',
            };
            break;
        }

        return (
            <View style={style.loadingContainer}>
                <FormattedText
                    {...text}
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

    renderChannelItem = (props: any) => {
        return <ChannelListRow {...props}/>;
    };

    renderOptionItem = (props: any) => {
        return <OptionListRow {...props}/>;
    };

    renderUserItem = (props: any) => {
        return <UserListRow {...props}/>;
    };

    render() {
        const {formatMessage} = this.context.intl;
        const {theme, dataSource} = this.props;
        const {loading, term} = this.state;
        const style = getStyleFromTheme(theme);

        const searchBarInput = {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            color: theme.centerChannelColor,
            fontSize: 15,
        };

        let rowComponent;
        if (dataSource === ViewTypes.DATA_SOURCE_USERS) {
            rowComponent = this.renderUserItem;
        } else if (dataSource === ViewTypes.DATA_SOURCE_CHANNELS) {
            rowComponent = this.renderChannelItem;
        } else {
            rowComponent = this.renderOptionItem;
        }

        const {data, listType} = this.getDataResults();

        let selectedOptionsComponent = null;
        if (this.state.multiselectSelected.length > 0) {
            selectedOptionsComponent = (
                <SelectedOptions
                    selectedOptions={this.state.multiselectSelected}
                    dataSource={this.props.dataSource}
                    onRemove={this.handleRemoveOption}
                />
            );
        }

        return (
            <SafeAreaView style={style.container}>
                <StatusBar/>
                <View
                    testID='selector.screen'
                    style={style.searchBar}
                >
                    <SearchBar
                        testID='selector.search_bar'
                        ref={this.searchBarRef}
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
                {selectedOptionsComponent}
                <CustomList
                    data={data}
                    key='custom_list'
                    listType={listType}
                    loading={loading}
                    loadingComponent={this.renderLoading()}
                    noResults={this.renderNoResults()}
                    onLoadMore={this.loadMore}
                    onRowPress={this.handleSelectItem}
                    renderItem={rowComponent}
                    theme={theme}
                />
            </SafeAreaView>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
        },
        searchBar: {
            marginVertical: 5,
            height: 38,
            ...Platform.select({
                ios: {
                    paddingLeft: 8,
                },
            }),
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

const filterSearchData = memoizeResult((dataSource: string, data: DataType, term: string) => {
    if (!data) {
        return [];
    }

    const lowerCasedTerm = term.toLowerCase();
    if (dataSource === ViewTypes.DATA_SOURCE_USERS) {
        return filterProfilesMatchingTerm(data as UserProfile[], lowerCasedTerm);
    } else if (dataSource === ViewTypes.DATA_SOURCE_CHANNELS) {
        return filterChannelsMatchingTerm(data as Channel[], lowerCasedTerm);
    } else if (dataSource === ViewTypes.DATA_SOURCE_DYNAMIC) {
        return data;
    }

    return (data as DialogOption[]).filter((option) => option.text && option.text.toLowerCase().startsWith(lowerCasedTerm));
});
