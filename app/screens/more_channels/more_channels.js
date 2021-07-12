// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Keyboard, View, Text} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {goToScreen, dismissModal, setButtons} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import CustomList from '@components/custom_list';
import ChannelListRow from '@components/custom_list/channel_list_row';
import FormattedText from '@components/formatted_text';
import KeyboardLayout from '@components/layout/keyboard_layout';
import Loading from '@components/loading';
import SearchBar from '@components/search_bar';
import StatusBar from '@components/status_bar';
import {NavigationTypes} from '@constants';
import {debounce} from '@mm-redux/actions/helpers';
import {General} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import BottomSheet from '@utils/bottom_sheet';
import {alertErrorWithFallback, emptyFunction} from '@utils/general';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

export default class MoreChannels extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            getArchivedChannels: PropTypes.func.isRequired,
            getChannels: PropTypes.func.isRequired,
            getSharedChannels: PropTypes.func.isRequired,
            handleSelectChannel: PropTypes.func.isRequired,
            joinChannel: PropTypes.func.isRequired,
            searchChannels: PropTypes.func.isRequired,
            setChannelDisplayName: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string,
        canCreateChannels: PropTypes.bool.isRequired,
        channels: PropTypes.array,
        sharedChannels: PropTypes.array,
        sharedChannelsEnabled: PropTypes.bool,
        archivedChannels: PropTypes.array,
        closeButton: PropTypes.object,
        currentUserId: PropTypes.string.isRequired,
        currentTeamId: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
        canShowArchivedChannels: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        channels: [],
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props, context) {
        super(props, context);

        this.searchTimeoutId = 0;
        this.publicPage = -1;
        this.sharedPage = -1;
        this.archivedPage = -1;
        this.nextPublic = true;
        this.nextShared = true;
        this.nextArchived = true;
        this.mounted = false;

        this.state = {
            channels: props.channels.slice(0, General.CHANNELS_CHUNK_SIZE),
            sharedChannels: props.sharedChannels.slice(0, General.CHANNELS_CHUNK_SIZE),
            archivedChannels: props.archivedChannels.slice(0, General.CHANNELS_CHUNK_SIZE),
            typeOfChannels: 'public',
            loading: false,
            adding: false,
            term: '',
        };

        this.rightButton = {
            color: props.theme.sidebarHeaderTextColor,
            id: 'create-pub-channel',
            text: context.intl.formatMessage({id: 'mobile.create_channel', defaultMessage: 'Create'}),
            showAsAction: 'always',
            testID: 'more_channels.create.button',
        };

        this.leftButton = {
            id: 'close-more-channels',
            icon: props.closeButton,
            testID: 'close.more_channels.button',
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
        this.mounted = true;
        this.setHeaderButtons(this.props.canCreateChannels);
        this.doGetChannels();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    setChannelsOrArchivedChannels(state) {
        this.setState(state);
    }

    componentDidUpdate(prevProps) {
        const {term} = this.state;
        let channels;
        let archivedChannels;

        if (this.props.channels !== prevProps.channels) {
            channels = this.props.channels;
            if (term) {
                channels = this.filterChannels(this.props.channels, term);
            }
        }

        if (this.props.archivedChannels !== prevProps.archivedChannels) {
            archivedChannels = this.props.archivedChannels;
            if (term) {
                archivedChannels = this.filterChannels(this.props.archivedChannels, term);
            }
        }

        const nextState = {};
        if (channels) {
            nextState.channels = channels;
        }

        if (archivedChannels) {
            nextState.archivedChannels = archivedChannels;
        }

        if (nextState.archivedChannels || nextState.channels) {
            this.setChannelsOrArchivedChannels(nextState);
        }
    }

    navigationButtonPressed({buttonId}) {
        switch (buttonId) {
        case 'close-more-channels':
            this.close();
            break;
        case 'create-pub-channel':
            this.onCreateChannel();
            break;
        }
    }

    setSearchBarRef = (ref) => {
        this.searchBarRef = ref;
    }

    cancelSearch = () => {
        const {channels, archivedChannels} = this.props;

        this.setState({
            channels,
            archivedChannels,
            term: '',
        });
    };

    close = () => {
        Keyboard.dismiss();
        dismissModal();
    };

    doGetChannels = () => {
        const {actions, currentTeamId, canShowArchivedChannels} = this.props;
        const {loading, term, typeOfChannels} = this.state;

        if (!loading && !term && this.mounted) {
            this.setState({loading: true}, () => {
                switch (typeOfChannels) {
                case 'public':
                    if (this.nextPublic) {
                        actions.getChannels(
                            currentTeamId,
                            this.publicPage + 1,
                            General.CHANNELS_CHUNK_SIZE,
                        ).then(this.loadedChannels);
                    }
                    break;
                case 'shared':
                    if (this.nextShared) {
                        actions.getSharedChannels(
                            currentTeamId,
                            this.sharedPage + 1,
                            General.CHANNELS_CHUNK_SIZE,
                        ).then(this.loadedChannels);
                    }
                    break;
                case 'archived':
                    if (canShowArchivedChannels && this.nextArchived) {
                        actions.getArchivedChannels(
                            currentTeamId,
                            this.archivedPage + 1,
                            General.CHANNELS_CHUNK_SIZE,
                        ).then(this.loadedChannels);
                    }
                    break;
                }
            });
        }
    };

    filterChannels = (channels, term) => {
        const lowerCasedTerm = term.toLowerCase();
        return channels.filter((c) => {
            return (c.name.toLowerCase().includes(lowerCasedTerm) || c.display_name.toLowerCase().includes(lowerCasedTerm));
        });
    };

    getChannels = debounce(this.doGetChannels, 100);

    setHeaderButtons = (createEnabled) => {
        const {canCreateChannels, componentId} = this.props;
        const buttons = {
            leftButtons: [this.leftButton],
        };

        if (canCreateChannels) {
            buttons.rightButtons = [{...this.rightButton, enabled: createEnabled}];
        }

        setButtons(componentId, buttons);
    };

    loadedChannels = ({data}) => {
        if (this.mounted) {
            const {typeOfChannels} = this.state;
            const isPublic = typeOfChannels === 'public';
            const isShared = typeOfChannels === 'shared';

            if (isShared) {
                this.sharedPage += 1;
                this.nextShared = data?.length > 0;
            } else if (isPublic) {
                this.publicPage += 1;
                this.nextPublic = data?.length > 0;
            } else {
                this.archivedPage += 1;
                this.nextArchived = data?.length > 0;
            }

            this.setState({loading: false});
        }
    };

    onSelectChannel = async (id) => {
        const {intl} = this.context;
        const {actions, currentTeamId, currentUserId} = this.props;
        const {channels} = this.state;

        this.setHeaderButtons(false);
        this.setState({adding: true});

        const channel = channels.find((c) => c.id === id);
        const result = await actions.joinChannel(currentUserId, currentTeamId, id);

        if (result.error) {
            alertErrorWithFallback(
                intl,
                result.error,
                {
                    id: 'mobile.join_channel.error',
                    defaultMessage: "We couldn't join the channel {displayName}. Please check your connection and try again.",
                },
                {
                    displayName: channel ? channel.display_name : '',
                },
            );
            this.setHeaderButtons(true);
            this.setState({adding: false});
        } else {
            if (channel) {
                actions.setChannelDisplayName(channel.display_name);
            } else {
                actions.setChannelDisplayName('');
            }
            await actions.handleSelectChannel(id);

            EventEmitter.emit(NavigationTypes.CLOSE_MAIN_SIDEBAR);
            requestAnimationFrame(() => {
                this.close();
            });
        }
    };

    onCreateChannel = () => {
        const {formatMessage} = this.context.intl;

        const screen = 'CreateChannel';
        const title = formatMessage({id: 'mobile.create_channel.public', defaultMessage: 'New Public Channel'});
        const passProps = {
            channelType: General.OPEN_CHANNEL,
        };

        goToScreen(screen, title, passProps);
    };

    renderLoading = () => {
        const {theme} = this.props;
        const {typeOfChannels} = this.state;
        const style = getStyleFromTheme(theme);

        if ((typeOfChannels === 'public' && !this.nextPublic) ||
            (typeOfChannels === 'archived' && !this.nextArchived)) {
            return null;
        }

        return (
            <View style={style.loadingContainer}>
                <FormattedText
                    id='mobile.loading_channels'
                    defaultMessage='Loading Channels...'
                    style={style.loadingText}
                />
            </View>
        );
    };

    renderNoResults = () => {
        const {term, loading} = this.state;
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        if (loading) {
            return null;
        }

        if (term) {
            return (
                <View style={style.noResultContainer}>
                    <FormattedText
                        id='mobile.custom_list.no_results'
                        defaultMessage='No Results'
                        style={style.noResultText}
                    />
                </View>
            );
        }

        return (
            <View style={style.noResultContainer}>
                <FormattedText
                    id='more_channels.noMore'
                    defaultMessage='No more channels to join'
                    style={style.noResultText}
                />
            </View>
        );
    };

    renderItem = (props) => {
        return (
            <ChannelListRow
                {...props}
                isArchived={this.state.typeOfChannels === 'archived'}
                testID='more_channels.custom_list.channel_item'
            />
        );
    }

    searchChannels = (text) => {
        const {actions, channels, sharedChannels, archivedChannels, currentTeamId, canShowArchivedChannels} = this.props;
        const {typeOfChannels} = this.state;

        if (text) {
            if (typeOfChannels === 'public') {
                const filtered = this.filterChannels(channels, text);
                this.setState({
                    channels: filtered,
                    term: text,
                });
                clearTimeout(this.searchTimeoutId);
            } else if (typeOfChannels === 'shared') {
                const filtered = this.filterChannels(sharedChannels, text);
                this.setState({
                    sharedChannels: filtered,
                    term: text,
                });
                clearTimeout(this.searchTimeoutId);
            } else if (typeOfChannels === 'archived' && canShowArchivedChannels) {
                const filtered = this.filterChannels(archivedChannels, text);
                this.setState({
                    archivedChannels: filtered,
                    term: text,
                });
                clearTimeout(this.searchTimeoutId);
            }
            this.searchTimeoutId = setTimeout(() => {
                actions.searchChannels(currentTeamId, text.toLowerCase(), typeOfChannels === 'archived');
            }, General.SEARCH_TIMEOUT_MILLISECONDS);
        } else {
            this.cancelSearch();
        }
    };

    handleDropdownClick = () => {
        const {formatMessage} = this.context.intl;
        const titleText = formatMessage({id: 'more_channels.dropdownTitle', defaultMessage: 'Show'});
        const publicChannelsText = formatMessage({id: 'more_channels.publicChannels', defaultMessage: 'Public Channels'});
        const archivedChannelsText = formatMessage({id: 'more_channels.archivedChannels', defaultMessage: 'Archived Channels'});
        const cancelText = 'Cancel';
        const options = [publicChannelsText, archivedChannelsText, cancelText];

        let archivedChannelsIndex = 1;
        let sharedChannelsIndex;

        if (this.props.sharedChannelsEnabled) {
            const sharedChannelsText = formatMessage({id: 'more_channels.sharedChannels', defaultMessage: 'Shared Channels'});
            options.splice(1, 0, sharedChannelsText);
            sharedChannelsIndex = 1;
            archivedChannelsIndex = 2;
        }

        BottomSheet.showBottomSheetWithOptions({
            options,
            cancelButtonIndex: 3,
            title: titleText,
        }, (value) => {
            let typeOfChannels;
            switch (value) {
            case 0:
                typeOfChannels = 'public';
                break;
            case sharedChannelsIndex:
                typeOfChannels = 'shared';
                break;
            case archivedChannelsIndex:
                typeOfChannels = 'archived';
                break;
            default:
                typeOfChannels = this.state.typeOfChannels;
            }

            if (typeOfChannels !== this.state.typeOfChannels) {
                this.setState({typeOfChannels, loading: false}, this.doGetChannels);
            }
        });
    }

    render() {
        const {formatMessage} = this.context.intl;
        const {canShowArchivedChannels, sharedChannelsEnabled, theme} = this.props;
        const {adding, channels, sharedChannels, archivedChannels, loading, term, typeOfChannels} = this.state;
        const more = term ? emptyFunction : this.getChannels;
        const style = getStyleFromTheme(theme);

        let content;
        if (adding) {
            content = (<Loading color={theme.centerChannelColor}/>);
        } else {
            const searchBarInput = {
                backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
                color: theme.centerChannelColor,
                fontSize: 15,
            };

            let activeChannels = channels;

            if (typeOfChannels === 'shared') {
                activeChannels = sharedChannels;
            } else if (canShowArchivedChannels && typeOfChannels === 'archived') {
                activeChannels = archivedChannels;
            }

            let channelDropdown;
            if (canShowArchivedChannels || sharedChannelsEnabled) {
                let channelDropdownText;
                if (typeOfChannels === 'public') {
                    channelDropdownText = formatMessage({id: 'more_channels.showPublicChannels', defaultMessage: 'Show: Public Channels'});
                } else if (typeOfChannels === 'shared') {
                    channelDropdownText = formatMessage({id: 'more_channels.showSharedChannels', defaultMessage: 'Show: Shared Channels'});
                } else {
                    channelDropdownText = formatMessage({id: 'more_channels.showArchivedChannels', defaultMessage: 'Show: Archived Channels'});
                }
                channelDropdown = (
                    <View
                        style={style.titleContainer}
                        testID='more_channels.channel.dropdown'
                    >
                        <Text
                            accessibilityRole={'button'}
                            style={style.channelDropdown}
                            onPress={this.handleDropdownClick}
                            testID={`more_channels.channel.dropdown.${typeOfChannels}`}
                        >
                            {channelDropdownText}
                            {'  '}
                            <CompassIcon
                                name='menu-down'
                            />
                        </Text>
                    </View>
                );
            }

            content = (
                <>
                    <View
                        testID='more_channels.screen'
                        style={style.searchBar}
                    >
                        <SearchBar
                            testID='more_channels.search_bar'
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
                            onChangeText={this.searchChannels}
                            onSearchButtonPress={this.searchChannels}
                            onCancelButtonPress={this.cancelSearch}
                            autoCapitalize='none'
                            keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                            value={term}
                        />
                    </View>
                    {channelDropdown}
                    <CustomList
                        canRefresh={false}
                        data={activeChannels}
                        extraData={loading}
                        key='custom_list'
                        loading={loading}
                        loadingComponent={this.renderLoading()}
                        noResults={this.renderNoResults()}
                        onLoadMore={more}
                        onRowPress={this.onSelectChannel}
                        renderItem={this.renderItem}
                        testID='more_channels.custom_list'
                        theme={theme}
                    />
                </>
            );
        }

        return (
            <SafeAreaView style={style.container}>
                <KeyboardLayout>
                    <StatusBar/>
                    {content}
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
        channelDropdown: {
            color: theme.centerChannelColor,
            fontWeight: 'bold',
            marginLeft: 10,
            marginTop: 20,
            marginBottom: 10,
        },
    };
});
