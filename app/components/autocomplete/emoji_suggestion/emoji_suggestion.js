// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Fuse from 'fuse.js';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    FlatList,
    Platform,
    Text,
    View,
} from 'react-native';

import Emoji from '@components/emoji';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {getEmojiByName, compareEmojis} from '@utils/emoji_utils';
import {BuiltInEmojis} from '@utils/emojis';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

const EMOJI_REGEX = /(^|\s|^\+|^-)(:([^:\s]*))$/i;
const EMOJI_REGEX_WITHOUT_PREFIX = /\B(:([^:\s]*))$/i;
const FUSE_OPTIONS = {
    shouldSort: false,
    ignoreLocation: true,
    includeMatches: true,
    findAllMatches: true,
};

let fuse;

export default class EmojiSuggestion extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            addReactionToLatestPost: PropTypes.func.isRequired,
            autocompleteCustomEmojis: PropTypes.func.isRequired,
        }).isRequired,
        cursorPosition: PropTypes.number,
        customEmojisEnabled: PropTypes.bool,
        emojis: PropTypes.array.isRequired,
        isSearch: PropTypes.bool,
        maxListHeight: PropTypes.number,
        theme: PropTypes.object.isRequired,
        onChangeText: PropTypes.func.isRequired,
        onResultCountChange: PropTypes.func.isRequired,
        rootId: PropTypes.string,
        value: PropTypes.string,
        nestedScrollEnabled: PropTypes.bool,
    };

    static defaultProps = {
        defaultChannel: {},
        value: '',
        emojis: [],
    };

    state = {
        active: false,
        dataSource: [],
    };

    constructor(props) {
        super(props);

        this.matchTerm = '';
        fuse = new Fuse(props.emojis, FUSE_OPTIONS);
    }

    componentDidUpdate(prevProps) {
        const {isSearch, emojis, cursorPosition, value} = this.props;

        if (isSearch) {
            return;
        }

        if (emojis.join('') !== prevProps.emojis.join('')) {
            fuse = new Fuse(emojis, FUSE_OPTIONS);
        }

        const match = value.substring(0, cursorPosition).match(EMOJI_REGEX);

        if (!match || this.state.emojiComplete) {
            this.resetAutocomplete();
            return;
        }

        const oldMatchTerm = this.matchTerm;
        this.matchTerm = match[3] || '';
        if (this.matchTerm !== oldMatchTerm || match[2] === ':') {
            if (this.props.customEmojisEnabled) {
                this.props.actions.autocompleteCustomEmojis(this.matchTerm);
            }
            this.searchEmojis(this.matchTerm);
        }
    }

    completeSuggestion = (emoji) => {
        const {actions, cursorPosition, onChangeText, value, rootId} = this.props;
        const emojiPart = value.substring(0, cursorPosition);

        if (emojiPart.startsWith('+:')) {
            actions.addReactionToLatestPost(emoji, rootId);
            onChangeText('');
        } else {
            // We are going to set a double : on iOS to prevent the auto correct from taking over and replacing it
            // with the wrong value, this is a hack but I could not found another way to solve it
            let completedDraft;
            let prefix = ':';
            if (Platform.OS === 'ios') {
                prefix = '::';
            }

            const emojiData = getEmojiByName(emoji);
            if (emojiData?.filename && !BuiltInEmojis.includes(emojiData.filename)) {
                const codeArray = emojiData.filename.split('-');
                const code = codeArray.reduce((acc, c) => {
                    return acc + String.fromCodePoint(parseInt(c, 16));
                }, '');
                completedDraft = emojiPart.replace(EMOJI_REGEX_WITHOUT_PREFIX, `${code} `);
            } else {
                completedDraft = emojiPart.replace(EMOJI_REGEX_WITHOUT_PREFIX, `${prefix}${emoji}: `);
            }

            if (value.length > cursorPosition) {
                completedDraft += value.substring(cursorPosition);
            }

            onChangeText(completedDraft);

            if (Platform.OS === 'ios' && (!emojiData?.filename || BuiltInEmojis.includes(emojiData?.filename))) {
                // This is the second part of the hack were we replace the double : with just one
                // after the auto correct vanished
                setTimeout(() => {
                    onChangeText(completedDraft.replace(`::${emoji}: `, `:${emoji}: `));
                });
            }
        }

        this.setState({
            active: false,
            emojiComplete: true,
        });
    };

    getItemLayout = ({index}) => ({length: 40, offset: 40 * index, index})

    keyExtractor = (item) => item;

    renderItem = ({item}) => {
        const style = getStyleFromTheme(this.props.theme);
        const completeSuggestion = () => this.completeSuggestion(item);
        return (
            <TouchableWithFeedback
                onPress={completeSuggestion}
                underlayColor={changeOpacity(this.props.theme.buttonBg, 0.08)}
                type={'native'}
            >
                <View style={style.row}>
                    <View style={style.emoji}>
                        <Emoji
                            emojiName={item}
                            textStyle={style.emojiText}
                            size={24}
                        />
                    </View>
                    <Text style={style.emojiName}>{`:${item}:`}</Text>
                </View>
            </TouchableWithFeedback>
        );
    };

    resetAutocomplete = () => {
        this.setState({
            active: false,
            emojiComplete: false,
        });

        this.props.onResultCountChange(0);
    }

    searchEmojis = (searchTerm) => {
        const {emojis} = this.props;

        let sorter = compareEmojis;
        if (searchTerm.trim().length) {
            const searchTermLowerCase = searchTerm.toLowerCase();

            sorter = (a, b) => compareEmojis(a, b, searchTermLowerCase);
            clearTimeout(this.searchTermTimeout);

            this.searchTermTimeout = setTimeout(() => {
                const fuzz = fuse.search(searchTerm);
                const results = fuzz.reduce((values, r) => {
                    const v = r.matches[0]?.value;
                    if (v) {
                        values.push(v);
                    }

                    return values;
                }, []);
                const data = results.sort(sorter);
                this.props.onResultCountChange(data.length);
                this.setState({
                    active: data.length > 0,
                    dataSource: data,
                });
            }, 100);
        } else {
            this.props.onResultCountChange(emojis.length);
            this.setState({
                active: emojis.length > 0,
                dataSource: emojis.sort(sorter),
            });
        }
    };

    render() {
        const {maxListHeight, theme, nestedScrollEnabled} = this.props;

        if (!this.state.active) {
            return null;
        }

        const style = getStyleFromTheme(theme);

        return (
            <FlatList
                testID='emoji_suggestion.list'
                keyboardShouldPersistTaps='always'
                style={[style.listView, {maxHeight: maxListHeight}]}
                extraData={this.state}
                data={this.state.dataSource}
                keyExtractor={this.keyExtractor}
                removeClippedSubviews={true}
                renderItem={this.renderItem}
                pageSize={10}
                initialListSize={10}
                nestedScrollEnabled={nestedScrollEnabled}
            />
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        emoji: {
            marginRight: 5,
        },
        emojiName: {
            fontSize: 15,
            color: theme.centerChannelColor,
        },
        emojiText: {
            color: '#000',
            fontWeight: 'bold',
        },
        listView: {
            paddingTop: 16,
            backgroundColor: theme.centerChannelBg,
            borderRadius: 4,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            overflow: 'hidden',
            paddingBottom: 8,
            paddingHorizontal: 16,
            height: 40,
        },
    };
});
