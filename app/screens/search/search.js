// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-underscore-dangle */

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    DeviceEventEmitter,
    Keyboard,
    Platform,
    SectionList,
    Text,
    View,
} from 'react-native';
import HWKeyboardEvent from 'react-native-hw-keyboard-event';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {dismissModal} from '@actions/navigation';
import Autocomplete from '@components/autocomplete';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import KeyboardLayout from '@components/layout/keyboard_layout';
import Loading from '@components/loading';
import DateSeparator from '@components/post_list/date_separator';
import PostListRetry from '@components/post_list_retry';
import PostSeparator from '@components/post_separator';
import SearchBar from '@components/search_bar';
import StatusBar from '@components/status_bar';
import {ListTypes} from '@constants';
import {debounce} from '@mm-redux/actions/helpers';
import {isDateLine, getDateForDateLine} from '@mm-redux/utils/post_list';
import EphemeralStore from '@store/ephemeral_store';
import {preventDoubleTap} from '@utils/tap';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

import ChannelDisplayName from './channel_display_name';
import Modifier, {MODIFIER_LABEL_HEIGHT} from './modifier';
import RecentItem, {RECENT_LABEL_HEIGHT} from './recent_item';
import SearchResultPost from './search_result_post';

const SECTION_HEIGHT = 20;
const RECENT_SEPARATOR_HEIGHT = 3;
const SCROLL_UP_MULTIPLIER = 6;
const SEARCHING = 'searching';
const NO_RESULTS = 'no results';
const FAILURE = 'failure';

export default class Search extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            clearSearch: PropTypes.func.isRequired,
            handleSearchDraftChanged: PropTypes.func.isRequired,
            removeSearchTerms: PropTypes.func.isRequired,
            searchPostsWithParams: PropTypes.func.isRequired,
            getMorePostsForSearch: PropTypes.func.isRequired,
        }).isRequired,
        currentTeamId: PropTypes.string.isRequired,
        initialValue: PropTypes.string,
        postIds: PropTypes.array,
        archivedPostIds: PropTypes.arrayOf(PropTypes.string),
        recent: PropTypes.array.isRequired,
        isSearchGettingMore: PropTypes.bool.isRequired,
        theme: PropTypes.object.isRequired,
        enableDateSuggestion: PropTypes.bool,
        timezoneOffsetInSeconds: PropTypes.number.isRequired,
        viewArchivedChannels: PropTypes.bool,
    };

    static defaultProps = {
        initialValue: '',
        postIds: [],
        recent: [],
        archivedPostIds: [],
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);

        this.contentOffsetY = 0;
        this.state = {
            channelName: '',
            cursorPosition: 0,
            value: props.initialValue,
            recent: props.recent,
            didFail: false,
            isLoading: false,
            isLoaded: false,
            status: 'not_started',
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
        HWKeyboardEvent.onHWKeyPressed(this.handleHardwareEnterPress);

        if (this.props.initialValue) {
            this.search(this.props.initialValue);
        }

        setTimeout(() => {
            if (this.searchBarRef && !this.props.initialValue) {
                this.searchBarRef.focus();
            }
        }, 150);
    }

    componentDidUpdate(prevProps, prevState) {
        const {enableDateSuggestion} = this.props;
        const {recent, didFail, isLoaded, status} = this.state;
        const {status: prevStatus} = prevState;
        const shouldScroll = prevStatus !== status &&
            (isLoaded || didFail) &&
            !this.props.isSearchGettingMore && !prevProps.isSearchGettingMore && prevState.recent.length === recent.length;

        if (shouldScroll) {
            setTimeout(() => {
                const recentLabelsHeight = recent.length * RECENT_LABEL_HEIGHT;
                const recentSeparatorsHeight = (recent.length - 1) * RECENT_SEPARATOR_HEIGHT;
                const modifiersCount = enableDateSuggestion ? 5 : 2;
                const modifiersHeight = modifiersCount * MODIFIER_LABEL_HEIGHT;
                const modifiersSeparatorHeight = (modifiersCount - 1) * RECENT_SEPARATOR_HEIGHT;
                const offset = modifiersHeight + modifiersSeparatorHeight + SECTION_HEIGHT + recentLabelsHeight + recentSeparatorsHeight;

                Keyboard.dismiss();
                if (this.listRef?._wrapperListRef) {
                    this.listRef._wrapperListRef.getListRef().scrollToOffset({
                        animated: true,
                        offset,
                    });
                }
            }, 250);
        }
    }

    componentWillUnmount() {
        HWKeyboardEvent.removeOnHWKeyPressed();
    }

    handleHardwareEnterPress = (keyEvent) => {
        if (EphemeralStore.getNavigationTopComponentId() === 'Search') {
            switch (keyEvent.pressedKey) {
            case 'enter':
                this.search(this.state.value);
                break;
            }
        }
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === 'backPress') {
            if (this.state.preview && this.previewRef) {
                this.previewRef.handleClose();
            } else {
                dismissModal();
            }
        }
    }

    setSearchBarRef = (ref) => {
        this.searchBarRef = ref;
    }

    setListRef = (ref) => {
        this.listRef = ref;
    }

    archivedIndicator = (postID, style) => {
        const channelIsArchived = this.props.archivedPostIds.includes(postID);
        let archivedIndicator = null;
        if (channelIsArchived) {
            archivedIndicator = (
                <View style={style.archivedIndicator}>
                    <Text>
                        <CompassIcon
                            name='archive-outline'
                            style={style.archivedText}
                        />
                        {' '}
                        <FormattedText
                            style={style.archivedText}
                            id='search_item.channelArchived'
                            defaultMessage='Archived'
                        />
                    </Text>
                </View>
            );
        }
        return archivedIndicator;
    };

    cancelSearch = preventDoubleTap(() => {
        this.handleTextChanged('', true);
        dismissModal();
    });

    handleLayout = (event) => {
        const {height} = event.nativeEvent.layout;
        this.setState({searchListHeight: height});
    };

    handleScroll = (event) => {
        const pageOffsetY = event.nativeEvent.contentOffset.y;
        if (pageOffsetY > 0) {
            const contentHeight = event.nativeEvent.contentSize.height;
            const direction = (this.contentOffsetY < pageOffsetY) ?
                ListTypes.VISIBILITY_SCROLL_UP :
                ListTypes.VISIBILITY_SCROLL_DOWN;

            this.contentOffsetY = pageOffsetY;
            if (
                direction === ListTypes.VISIBILITY_SCROLL_UP &&
                (contentHeight - pageOffsetY) < (this.state.searchListHeight * SCROLL_UP_MULTIPLIER)
            ) {
                this.getMoreSearchResults();
            }
        }
    };

    handleSelectionChange = (event) => {
        const cursorPosition = event.nativeEvent.selection.end;
        this.setState({
            cursorPosition,
        });
    };

    handleSearchButtonPress = preventDoubleTap((text) => {
        this.search(text);
    });

    handleTextChanged = (value, selectionChanged) => {
        const {actions, isSearchGettingMore} = this.props;
        const {isLoaded} = this.state;

        this.setState({value});
        actions.handleSearchDraftChanged(value);

        if (!value && isLoaded && !isSearchGettingMore) {
            actions.clearSearch();
            this.scrollToTop();
        }

        // FIXME: Workaround for iOS when setting the value directly
        // in the inputText, bug in RN 0.48
        if (Platform.OS === 'ios' && selectionChanged) {
            this.handleSelectionChange({
                nativeEvent: {
                    selection: {
                        end: value.length,
                    },
                },
            });
        }
    };

    keyModifierExtractor = (item) => {
        return `modifier-${item.value}`;
    };

    keyRecentExtractor = (item) => {
        return `recent-${item.terms}`;
    };

    keyPostExtractor = (item) => {
        return item.id || item;
    };

    getMoreSearchResults = debounce(() => {
        if (this.state.value && this.props.postIds.length) {
            this.props.actions.getMorePostsForSearch();
        }
    }, 100);

    onViewableItemsChanged = ({viewableItems}) => {
        const visible = viewableItems.filter((item) => item.section.key === 'results');
        if (!visible.length) {
            return;
        }

        const viewableItemsMap = visible.reduce((acc, {item, isViewable}) => {
            if (isViewable) {
                acc[item] = true;
            }
            return acc;
        }, {});

        DeviceEventEmitter.emit('scrolled', viewableItemsMap);
    };

    removeSearchTerms = preventDoubleTap((item) => {
        const {actions, currentTeamId} = this.props;
        const recent = [...this.state.recent];
        const index = recent.indexOf(item);

        if (index !== -1) {
            recent.splice(index, 1);
            this.setState({recent});
        }

        actions.removeSearchTerms(currentTeamId, item.terms);
    });

    renderFooter = () => {
        const {isSearchGettingMore, theme} = this.props;

        if (isSearchGettingMore) {
            const style = getStyleFromTheme(theme);
            return (
                <View style={style.loadingMore}>
                    <Loading color={theme.centerChannelColor}/>
                </View>
            );
        }

        return null;
    };

    renderModifiers = ({item}) => {
        const {theme} = this.props;

        return (
            <Modifier
                item={item}
                setModifierValue={this.setModifierValue}
                theme={theme}
            />
        );
    };

    renderPost = ({item, index}) => {
        const {postIds, theme} = this.props;
        const style = getStyleFromTheme(theme);

        if (item.id) {
            return (
                <View style={style.customItem}>
                    {item.component}
                </View>
            );
        }

        if (isDateLine(item)) {
            return (
                <DateSeparator
                    date={getDateForDateLine(item)}
                    theme={theme}
                />
            );
        }

        let separator;
        const nextPost = postIds[index + 1];
        if (nextPost && !isDateLine(nextPost)) {
            separator = <PostSeparator theme={theme}/>;
        }

        return (
            <View style={style.postResult}>
                <ChannelDisplayName postId={item}/>
                {this.archivedIndicator(postIds[index], style)}
                <SearchResultPost
                    postId={item}
                    skipPinnedHeader={true}
                    theme={theme}
                />
                {separator}
            </View>
        );
    };

    renderRecentSeparator = () => {
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        return (
            <View style={style.separatorContainer}>
                <View style={style.separator}/>
            </View>
        );
    };

    renderSectionHeader = ({section}) => {
        const {theme} = this.props;
        const {title} = section;
        const style = getStyleFromTheme(theme);

        if (title) {
            return (
                <View style={style.sectionWrapper}>
                    <View style={style.sectionContainer}>
                        <Text style={style.sectionLabel}>
                            {title}
                        </Text>
                    </View>
                </View>
            );
        }

        return <View/>;
    };

    renderRecentItem = ({item}) => {
        const {theme} = this.props;

        return (
            <RecentItem
                item={item}
                removeSearchTerms={this.removeSearchTerms}
                setRecentValue={this.setRecentValue}
                theme={theme}
            />
        );
    };

    retry = () => {
        this.search(this.state.value.trim());
    };

    scrollToTop = () => {
        if (this.listRef?._wrapperListRef) {
            this.listRef._wrapperListRef.getListRef().scrollToOffset({
                animated: false,
                offset: 0,
            });
        }
    };

    search = async (text, isOrSearch) => {
        const {actions, currentTeamId, viewArchivedChannels} = this.props;
        const recent = [...this.state.recent];
        const terms = text.trim();

        this.handleTextChanged(`${terms} `);

        // Trigger onSelectionChanged Manually when submitting
        this.handleSelectionChange({
            nativeEvent: {
                selection: {
                    end: terms.length + 1,
                },
            },
        });

        // timezone offset in seconds
        const params = {
            terms,
            is_or_search: isOrSearch,
            time_zone_offset: this.props.timezoneOffsetInSeconds,
            page: 0,
            per_page: 20,
            include_deleted_channels: viewArchivedChannels,
        };
        this.setState({isLoading: true, isLoaded: false, status: 'isLoading'});
        const {error} = await actions.searchPostsWithParams(currentTeamId, params, true);

        if (!recent.find((r) => r.terms === terms)) {
            recent.push({
                terms,
            });
            this.setState({recent});
        }
        this.setState({
            isLoading: false,
            didFail: Boolean(error),
            isLoaded: true,
            status: error ? 'didFail' : 'isLoaded',
        });
    };

    setModifierValue = preventDoubleTap((modifier) => {
        const {value} = this.state;
        let newValue = '';

        if (!value) {
            newValue = modifier;
        } else if (value.endsWith(' ')) {
            newValue = `${value}${modifier}`;
        } else {
            newValue = `${value} ${modifier}`;
        }

        this.handleTextChanged(newValue, true);

        if (this.searchBarRef) {
            this.searchBarRef.focus();
        }
    });

    setRecentValue = preventDoubleTap((recent) => {
        const {terms, isOrSearch} = recent;
        this.handleTextChanged(terms);
        this.search(terms, isOrSearch);
        Keyboard.dismiss();
    });

    render() {
        const {
            postIds,
            theme,
            isSearchGettingMore,
        } = this.props;

        const {intl} = this.context;
        const {
            cursorPosition,
            recent,
            value,
            didFail,
            isLoading,
            isLoaded,
        } = this.state;
        const style = getStyleFromTheme(theme);

        const sectionsData = [{
            value: 'from:',
            testID: 'search.from_section',
            modifier: `${intl.formatMessage({id: 'mobile.search.from_modifier_title', defaultMessage: 'username'})}`,
            description: intl.formatMessage({
                id: 'mobile.search.from_modifier_description',
                defaultMessage: 'to find posts from specific users',
            }),
        }, {
            value: 'in:',
            testID: 'search.in_section',
            modifier: `${intl.formatMessage({id: 'mobile.search.in_modifier_title', defaultMessage: 'channel-name'})}`,
            description: intl.formatMessage({
                id: 'mobile.search.in_modifier_description',
                defaultMessage: 'to find posts in specific channels',
            }),
        }];

        // if search by date filters supported
        if (this.props.enableDateSuggestion) {
            sectionsData.push({
                value: 'on:',
                testID: 'search.on_section',
                modifier: 'YYYY-MM-DD',
                description: intl.formatMessage({
                    id: 'mobile.search.on_modifier_description',
                    defaultMessage: 'to find posts on a specific date',
                }),
            });
            sectionsData.push({
                value: 'after:',
                testID: 'search.after_section',
                modifier: 'YYYY-MM-DD',
                description: intl.formatMessage({
                    id: 'mobile.search.after_modifier_description',
                    defaultMessage: 'to find posts after a specific date',
                }),
            });
            sectionsData.push({
                value: 'before:',
                testID: 'search.before_section',
                modifier: 'YYYY-MM-DD',
                description: intl.formatMessage({
                    id: 'mobile.search.before_modifier_description',
                    defaultMessage: 'to find posts before a specific date',
                }),
            });
        }

        const sections = [{
            data: sectionsData,
            key: 'modifiers',
            title: '',
            renderItem: this.renderModifiers,
            keyExtractor: this.keyModifierExtractor,
            ItemSeparatorComponent: this.renderRecentSeparator,
        }];

        if (recent.length) {
            sections.push({
                data: recent,
                key: 'recent',
                title: intl.formatMessage({id: 'mobile.search.recent_title', defaultMessage: 'Recent Searches'}),
                renderItem: this.renderRecentItem,
                keyExtractor: this.keyRecentExtractor,
                ItemSeparatorComponent: this.renderRecentSeparator,
            });
        }

        let results;
        if (didFail) {
            if (postIds.length) {
                results = postIds;
            } else {
                results = [{
                    id: FAILURE,
                    component: (
                        <View style={style.searching}>
                            <PostListRetry
                                retry={this.retry}
                                theme={theme}
                            />
                        </View>
                    ),
                }];
            }
        } else if (isLoading) {
            if (isSearchGettingMore) {
                results = postIds;
            } else {
                results = [{
                    id: SEARCHING,
                    component: (
                        <View style={style.searching}>
                            <Loading color={theme.centerChannelColor}/>
                        </View>
                    ),
                }];
            }
        } else if (isLoaded) {
            if (postIds.length) {
                results = postIds;
            } else if (this.state.value) {
                results = [{
                    id: NO_RESULTS,
                    component: (
                        <FormattedText
                            id='mobile.search.no_results'
                            defaultMessage='No Results Found'
                            style={style.noResults}
                        />
                    ),
                }];
            }
        }

        if (results) {
            sections.push({
                data: results,
                key: 'results',
                title: intl.formatMessage({id: 'search_header.results', defaultMessage: 'Search Results'}),
                renderItem: this.renderPost,
                keyExtractor: this.keyPostExtractor,
            });
        }

        const searchBarInput = {
            backgroundColor: changeOpacity(theme.sidebarHeaderTextColor, 0.2),
            color: theme.sidebarHeaderTextColor,
            fontSize: 15,
        };

        return (
            <KeyboardLayout>
                <StatusBar/>
                <View
                    testID='search.screen'
                    style={style.header}
                >
                    <SafeAreaView edges={['left', 'right']}>
                        <SearchBar
                            testID='search.search_bar'
                            ref={this.setSearchBarRef}
                            placeholder={intl.formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                            cancelTitle={intl.formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                            backgroundColor='transparent'
                            inputHeight={Platform.OS === 'ios' ? 33 : 46}
                            inputStyle={searchBarInput}
                            placeholderTextColor={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                            selectionColor={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                            tintColorSearch={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                            tintColorDelete={changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                            titleCancelColor={theme.sidebarHeaderTextColor}
                            onChangeText={this.handleTextChanged}
                            onSearchButtonPress={this.handleSearchButtonPress}
                            onCancelButtonPress={this.cancelSearch}
                            onSelectionChange={this.handleSelectionChange}
                            autoCapitalize='none'
                            showArrow={true}
                            value={value}
                            containerStyle={style.searchBarContainer}
                            backArrowSize={28}
                            keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                            containerHeight={33}
                        />
                    </SafeAreaView>
                </View>
                <SafeAreaView
                    style={style.flex}
                    edges={['bottom', 'left', 'right']}
                >
                    <SectionList
                        ref={this.setListRef}
                        style={style.sectionList}
                        removeClippedSubviews={true}
                        renderSectionHeader={this.renderSectionHeader}
                        sections={sections}
                        keyboardShouldPersistTaps='always'
                        keyboardDismissMode='interactive'
                        stickySectionHeadersEnabled={Platform.OS === 'ios'}
                        onLayout={this.handleLayout}
                        onScroll={this.handleScroll}
                        scrollEventThrottle={60}
                        ListFooterComponent={this.renderFooter}
                        onViewableItemsChanged={this.onViewableItemsChanged}
                        testID='search.results_list'
                    />
                </SafeAreaView>
                <Autocomplete
                    cursorPosition={cursorPosition}
                    onChangeText={this.handleTextChanged}
                    isSearch={true}
                    value={value}
                    enableDateSuggestion={this.props.enableDateSuggestion}
                />
            </KeyboardLayout>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        flex: {
            flex: 1,
        },
        header: {
            backgroundColor: theme.sidebarHeaderBg,
            width: '100%',
            ...Platform.select({
                android: {
                    height: 46,
                    justifyContent: 'center',
                },
                ios: {
                    height: 61,
                    paddingLeft: 14,
                    paddingRight: 5,
                    paddingTop: 14,
                },
            }),
        },
        searchBarContainer: {
            padding: 0,
        },
        sectionWrapper: {
            backgroundColor: theme.centerChannelBg,
        },
        sectionContainer: {
            justifyContent: 'center',
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.07),
            paddingLeft: 16,
            height: SECTION_HEIGHT,
        },
        sectionLabel: {
            color: theme.centerChannelColor,
            fontSize: 12,
            fontWeight: '600',
        },
        recentItemContainer: {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            height: RECENT_LABEL_HEIGHT,
        },
        recentItemLabel: {
            color: theme.centerChannelColor,
            fontSize: 14,
            height: 20,
            flex: 1,
            paddingHorizontal: 16,
        },
        recentRemove: {
            alignItems: 'center',
            height: RECENT_LABEL_HEIGHT,
            justifyContent: 'center',
            width: 50,
        },
        separatorContainer: {
            justifyContent: 'center',
            flex: 1,
            height: RECENT_SEPARATOR_HEIGHT,
        },
        postsSeparator: {
            height: 15,
        },
        separator: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
        },
        sectionList: {
            flex: 1,
        },
        customItem: {
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
        },
        noResults: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 20,
            fontWeight: '400',
            marginTop: 65,
            textAlign: 'center',
            textAlignVertical: 'center',
        },
        searching: {
            marginTop: 65,
        },
        archivedIndicator: {
            alignItems: 'flex-end',
            width: 150,
            alignSelf: 'flex-end',
            marginTop: -17,
            marginRight: 10,
        },
        archivedText: {
            color: changeOpacity(theme.centerChannelColor, 0.4),
        },
        postResult: {
            overflow: 'hidden',
        },
        loadingMore: {
            height: 60,
        },
    };
});
