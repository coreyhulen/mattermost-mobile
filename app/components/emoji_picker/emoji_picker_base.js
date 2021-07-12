// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SectionList,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout';

import CompassIcon from '@components/compass_icon';
import Emoji from '@components/emoji';
import FormattedText from '@components/formatted_text';
import {DeviceTypes} from '@constants';
import {compareEmojis} from '@utils/emoji_utils';
import {emptyFunction} from '@utils/general';
import {
    makeStyleSheetFromTheme,
    changeOpacity,
} from '@utils/theme';

import EmojiPickerRow from './emoji_picker_row';

const EMOJI_SIZE = 30;
const EMOJI_GUTTER = 7;
const EMOJIS_PER_PAGE = 200;
const SECTION_HEADER_HEIGHT = 28;
const SECTION_MARGIN = 15;
export const SCROLLVIEW_NATIVE_ID = 'emojiPicker';

export function filterEmojiSearchInput(searchText) {
    return searchText.toLowerCase().replace(/^:|:$/g, '');
}

export default class EmojiPicker extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        customEmojisEnabled: PropTypes.bool.isRequired,
        customEmojiPage: PropTypes.number.isRequired,
        deviceWidth: PropTypes.number.isRequired,
        emojis: PropTypes.array.isRequired,
        emojisBySection: PropTypes.array.isRequired,
        fuse: PropTypes.object.isRequired,
        isLandscape: PropTypes.bool.isRequired,
        onEmojiPress: PropTypes.func,
        theme: PropTypes.object.isRequired,
        actions: PropTypes.shape({
            getCustomEmojis: PropTypes.func.isRequired,
            incrementEmojiPickerPage: PropTypes.func.isRequired,
        }).isRequired,
    };

    static defaultProps = {
        onEmojiPress: emptyFunction,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);

        this.sectionListGetItemLayout = sectionListGetItemLayout({
            getItemHeight: () => {
                return (EMOJI_SIZE + 7) + (EMOJI_GUTTER * 2);
            },
            getSectionHeaderHeight: () => SECTION_HEADER_HEIGHT,
        });

        const emojis = this.renderableEmojis(props.emojisBySection, props.deviceWidth);
        const emojiSectionIndexByOffset = this.measureEmojiSections(emojis);

        this.scrollToSectionTries = 0;
        this.state = {
            emojis,
            emojiSectionIndexByOffset,
            filteredEmojis: [],
            searchTerm: '',
            currentSectionIndex: 0,
            missingPages: true,
        };
    }

    componentDidUpdate(prevProps) {
        this.rebuildEmojis = false;
        if (this.props.deviceWidth !== prevProps.deviceWidth) {
            this.rebuildEmojis = true;

            if (this.searchBarRef) {
                this.searchBarRef.blur();
            }
        }

        if (this.props.emojis !== prevProps.emojis) {
            this.rebuildEmojis = true;
        }

        this.setRebuiltEmojis();
    }

    setSearchBarRef = (ref) => {
        this.searchBarRef = ref;
    }

    setSectionListRef = (ref) => {
        this.sectionListRef = ref;
    };

    setRebuiltEmojis = (searchBarAnimationComplete = true) => {
        if (this.rebuildEmojis && searchBarAnimationComplete) {
            this.rebuildEmojis = false;
            const emojis = this.renderableEmojis(this.props.emojisBySection, this.props.deviceWidth);
            this.setState({emojis});
        }
    }

    renderableEmojis = (emojis, deviceWidth) => {
        const numberOfColumns = this.getNumberOfColumns(deviceWidth);

        const nextEmojis = emojis.map((section) => {
            const data = [];
            let row = {
                key: `${section.key}-0`,
                items: [],
            };

            section.data.forEach((emoji, index) => {
                if (index % numberOfColumns === 0 && index !== 0) {
                    data.push(row);
                    row = {
                        key: `${section.key}-${index}`,
                        items: [],
                    };
                }

                row.items.push(emoji);
            });

            if (row.items.length) {
                if (row.items.length < numberOfColumns) {
                    // push some empty items to make sure flexbox can justfiy content correctly
                    const emptyEmojis = new Array(numberOfColumns - row.items.length);
                    row.items.push(...emptyEmojis);
                }

                data.push(row);
            }

            return {
                ...section,
                data,
            };
        });

        return nextEmojis;
    };

    measureEmojiSections = (emojiSections) => {
        let lastOffset = 0;
        return emojiSections.map((section) => {
            const start = lastOffset;
            const nextOffset = (section.data.length * ((EMOJI_SIZE + 7) + (EMOJI_GUTTER * 2))) + SECTION_HEADER_HEIGHT;
            lastOffset += nextOffset;

            return start;
        });
    };

    changeSearchTerm = (rawText) => {
        const searchTerm = filterEmojiSearchInput(rawText);
        const nextState = {
            searchTerm: rawText,
        };
        const prevSearchTerm = this.state.searchTerm;
        this.setState(nextState);

        if (!searchTerm) {
            nextState.currentSectionIndex = 0;
            return;
        }

        clearTimeout(this.searchTermTimeout);
        if (prevSearchTerm === '') {
            const filteredEmojis = this.searchEmojis(searchTerm);
            this.setState({
                filteredEmojis,
            });
        } else {
            this.searchTermTimeout = setTimeout(() => {
                const filteredEmojis = this.searchEmojis(searchTerm);
                this.setState({
                    filteredEmojis,
                });
            }, 100);
        }
    };

    cancelSearch = () => {
        this.setState({
            currentSectionIndex: 0,
            filteredEmojis: [],
            searchTerm: '',
        });
    };

    searchEmojis = (searchTerm) => {
        const {fuse} = this.props;
        const searchTermLowerCase = searchTerm.toLowerCase();

        if (!searchTerm) {
            return [];
        }

        const sorter = (a, b) => compareEmojis(a, b, searchTermLowerCase);
        const fuzz = fuse.search(searchTermLowerCase);
        const results = fuzz.reduce((values, r) => {
            const v = r.matches[0]?.value;
            if (v) {
                values.push(v);
            }

            return values;
        }, []);
        const data = results.sort(sorter);

        return data;
    };

    getNumberOfColumns = (deviceWidth) => {
        const shorten = DeviceTypes.IS_IPHONE_WITH_INSETS && this.props.isLandscape ? 4 : 2;
        return Math.floor(Number(((deviceWidth - (SECTION_MARGIN * shorten)) / ((EMOJI_SIZE + 7) + (EMOJI_GUTTER * shorten)))));
    };

    renderItem = ({item, section}) => {
        return (
            <View testID={section.defaultMessage}>
                <EmojiPickerRow
                    key={item.key}
                    emojiGutter={EMOJI_GUTTER}
                    emojiSize={EMOJI_SIZE}
                    items={item.items}
                    onEmojiPress={this.props.onEmojiPress}
                />
            </View>
        );
    };

    renderListComponent = (shorten) => {
        const {deviceWidth, theme} = this.props;
        const {emojis, filteredEmojis, searchTerm} = this.state;
        const styles = getStyleSheetFromTheme(theme);

        let listComponent;
        if (searchTerm) {
            const contentContainerStyle = filteredEmojis.length ? null : styles.flex;

            listComponent = (
                <FlatList
                    contentContainerStyle={contentContainerStyle}
                    data={filteredEmojis}
                    keyboardShouldPersistTaps='always'
                    keyExtractor={this.flatListKeyExtractor}
                    initialListSize={10}
                    ListEmptyComponent={this.renderEmptyList}
                    nativeID={SCROLLVIEW_NATIVE_ID}
                    pageSize={10}
                    renderItem={this.flatListRenderItem}
                    removeClippedSubviews={true}
                    style={styles.flatList}
                />
            );
        } else {
            listComponent = (
                <SectionList
                    ref={this.setSectionListRef}
                    getItemLayout={this.sectionListGetItemLayout}
                    initialNumToRender={50}
                    keyboardShouldPersistTaps='always'
                    keyboardDismissMode='interactive'
                    ListFooterComponent={this.renderFooter}
                    nativeID={SCROLLVIEW_NATIVE_ID}
                    onEndReached={this.loadMoreCustomEmojis}
                    onEndReachedThreshold={Platform.OS === 'ios' ? 0 : 1}
                    onMomentumScrollEnd={this.onMomentumScrollEnd}
                    onScroll={this.onScroll}
                    onScrollToIndexFailed={this.handleScrollToSectionFailed}
                    pageSize={50}
                    removeClippedSubviews={true}
                    renderItem={this.renderItem}
                    renderSectionHeader={this.renderSectionHeader}
                    sections={emojis}
                    showsVerticalScrollIndicator={false}
                    style={[styles.sectionList, {width: deviceWidth - (SECTION_MARGIN * shorten)}]}
                />
            );
        }

        return listComponent;
    };

    flatListKeyExtractor = (item) => item;

    flatListRenderItem = ({item}) => {
        const style = getStyleSheetFromTheme(this.props.theme);

        return (
            <TouchableOpacity
                onPress={() => this.props.onEmojiPress(item)}
                style={style.flatListRow}
            >
                <View style={style.flatListEmoji}>
                    <Emoji
                        emojiName={item}
                        textStyle={style.emojiText}
                        size={20}
                    />
                </View>
                <Text style={style.flatListEmojiName}>{`:${item}:`}</Text>
            </TouchableOpacity>
        );
    };

    loadMoreCustomEmojis = async () => {
        if (!this.props.customEmojisEnabled) {
            return;
        }

        const {data} = await this.props.actions.getCustomEmojis(this.props.customEmojiPage, EMOJIS_PER_PAGE);
        this.setState({loadingMore: false});

        if (!data) {
            return;
        }

        if (data.length < EMOJIS_PER_PAGE) {
            this.setState({missingPages: false});
            return;
        }

        this.props.actions.incrementEmojiPickerPage();
    };

    onScroll = (e) => {
        if (this.state.jumpToSection) {
            return;
        }

        clearTimeout(this.setIndexTimeout);

        const {contentOffset} = e.nativeEvent;
        let nextIndex = this.state.emojiSectionIndexByOffset.findIndex((offset) => contentOffset.y <= offset);

        if (nextIndex === -1) {
            nextIndex = this.state.emojiSectionIndexByOffset.length - 1;
        } else if (nextIndex !== 0) {
            nextIndex -= 1;
        }

        if (nextIndex !== this.state.currentSectionIndex) {
            this.setState({
                currentSectionIndex: nextIndex,
            });
        }
    };

    onMomentumScrollEnd = () => {
        if (this.state.jumpToSection) {
            this.setState({
                jumpToSection: false,
            });
        }
    };

    scrollToSection = (index) => {
        this.setState({
            jumpToSection: true,
            currentSectionIndex: index,
        }, () => {
            this.sectionListRef.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                viewOffset: 25,
            });
        });
    };

    handleScrollToSectionFailed = ({index}) => {
        if (this.scrollToSectionTries < 1) {
            setTimeout(() => {
                this.scrollToSectionTries++;
                this.scrollToSection(index);
            }, 200);
        }
    };

    renderSectionHeader = ({section}) => {
        const {theme} = this.props;
        const styles = getStyleSheetFromTheme(theme);

        return (
            <View
                style={styles.sectionTitleContainer}
                key={section.title}
            >
                <FormattedText
                    style={styles.sectionTitle}
                    id={section.id}
                    defaultMessage={section.defaultMessage}
                />
            </View>
        );
    };

    handleSectionIconPress = (index, isCustomSection = false) => {
        this.scrollToSectionTries = 0;
        this.scrollToSection(index);

        if (isCustomSection && this.props.customEmojiPage === 0) {
            this.loadMoreCustomEmojis();
        }
    };

    renderSectionIcons = () => {
        const {theme} = this.props;
        const styles = getStyleSheetFromTheme(theme);

        return this.state.emojis.map((section, index) => {
            const onPress = () => this.handleSectionIconPress(index, section.key === 'custom');

            return (
                <TouchableOpacity
                    key={section.key}
                    onPress={onPress}
                    style={styles.sectionIconContainer}
                >
                    <CompassIcon
                        name={section.icon}
                        size={17}
                        style={[styles.sectionIcon, (index === this.state.currentSectionIndex && styles.sectionIconHighlight)]}
                    />
                </TouchableOpacity>
            );
        });
    };

    renderFooter = () => {
        if (!this.state.missingPages) {
            return null;
        }

        const {theme} = this.props;

        const styles = getStyleSheetFromTheme(theme);
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.centerChannelColor}/>
            </View>
        );
    };

    renderEmptyList = () => {
        const {theme} = this.props;
        const {formatMessage} = this.context.intl;
        const {searchTerm} = this.state;
        const styles = getStyleSheetFromTheme(theme);
        const title = formatMessage({
            id: 'mobile.emoji_picker.search.not_found_title',
            defaultMessage: 'No results found for "{searchTerm}"',
        }, {
            searchTerm,
        });
        const description = formatMessage({
            id: 'mobile.emoji_picker.search.not_found_description',
            defaultMessage: 'Check the spelling or try another search.',
        });
        return (
            <View style={[styles.flex, styles.flexCenter]}>
                <View style={styles.flexCenter}>
                    <View style={styles.notFoundIcon}>
                        <CompassIcon
                            name='magnify'
                            size={72}
                            color={theme.buttonBg}
                        />
                    </View>
                    <Text style={[styles.notFoundText, styles.notFoundText20]}>
                        {title}
                    </Text>
                    <Text style={[styles.notFoundText, styles.notFoundText15]}>
                        {description}
                    </Text>
                </View>
            </View>
        );
    }
}

export const getStyleSheetFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        flex: {
            flex: 1,
        },
        bottomContent: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.3),
            borderTopWidth: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
        },
        bottomContentWrapper: {
            ...Platform.select({
                android: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                ios: {
                    width: '100%',
                    flexDirection: 'row',
                },
            }),
            backgroundColor: theme.centerChannelBg,
            height: 35,
        },
        container: {
            alignItems: 'center',
            backgroundColor: theme.centerChannelBg,
            flex: 1,
        },
        emojiText: {
            color: '#000',
            fontWeight: 'bold',
        },
        flatList: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
            alignSelf: 'stretch',
        },
        flatListEmoji: {
            marginRight: 5,
        },
        flatListEmojiName: {
            fontSize: 13,
            color: theme.centerChannelColor,
        },
        flatListRow: {
            height: 40,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            backgroundColor: theme.centerChannelBg,
            borderTopWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.2),
            borderLeftWidth: 1,
            borderLeftColor: changeOpacity(theme.centerChannelColor, 0.2),
            borderRightWidth: 1,
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.2),
            overflow: 'hidden',
        },
        flexCenter: {
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        },
        notFoundIcon: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
            width: 120,
            height: 120,
            borderRadius: 60,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        notFoundText: {
            color: theme.centerChannelColor,
            marginTop: 16,
        },
        notFoundText20: {
            fontSize: 20,
            fontWeight: '600',
        },
        notFoundText15: {
            fontSize: 15,
        },
        searchBar: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            paddingVertical: 5,
            ...Platform.select({
                ios: {
                    paddingLeft: 8,
                },
            }),
            height: 50,
        },
        sectionList: {
            ...Platform.select({
                android: {
                    marginBottom: 35,
                },
            }),
        },
        sectionIcon: {
            color: changeOpacity(theme.centerChannelColor, 0.3),
        },
        sectionIconContainer: {
            flex: 1,
            height: 35,
            alignItems: 'center',
            justifyContent: 'center',
        },
        sectionIconHighlight: {
            color: theme.centerChannelColor,
        },
        sectionTitle: {
            color: changeOpacity(theme.centerChannelColor, 0.2),
            fontSize: 15,
            fontWeight: '700',
        },
        sectionTitleContainer: {
            height: SECTION_HEADER_HEIGHT,
            justifyContent: 'center',
            backgroundColor: theme.centerChannelBg,
        },
        loading: {
            flex: 1,
            alignItems: 'center',
        },
    };
});
