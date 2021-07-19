// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Keyboard,
    Platform,
    View,
    ViewPropTypes,
} from 'react-native';

import {DeviceTypes} from '@constants';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {emptyFunction} from '@utils/general';
import EventEmitter from '@mm-redux/utils/event_emitter';

import AtMention from './at_mention';
import ChannelMention from './channel_mention';
import EmojiSuggestion from './emoji_suggestion';
import SlashSuggestion from './slash_suggestion';
import AppSlashSuggestion from './slash_suggestion/app_slash_suggestion';
import DateSuggestion from './date_suggestion';

export default class Autocomplete extends PureComponent {
    static propTypes = {
        cursorPosition: PropTypes.number,
        deviceHeight: PropTypes.number,
        onChangeText: PropTypes.func.isRequired,
        maxHeight: PropTypes.number,
        rootId: PropTypes.string,
        isSearch: PropTypes.bool,
        theme: PropTypes.object.isRequired,
        value: PropTypes.string,
        enableDateSuggestion: PropTypes.bool.isRequired,
        valueEvent: PropTypes.string,
        cursorPositionEvent: PropTypes.string,
        nestedScrollEnabled: PropTypes.bool,
        onVisible: PropTypes.func,
        offsetY: PropTypes.number,
        onKeyboardOffsetChanged: PropTypes.func,
        style: ViewPropTypes.style,
    };

    static defaultProps = {
        isSearch: false,
        cursorPosition: 0,
        enableDateSuggestion: false,
        nestedScrollEnabled: false,
        onVisible: emptyFunction,
        onKeyboardOffsetChanged: emptyFunction,
        offsetY: 80,
    };

    static getDerivedStateFromProps(props, state) {
        const nextState = {};
        let updated = false;

        if (props.cursorPosition !== state.cursorPosition && !props.cursorPositionEvent) {
            nextState.cursorPosition = props.cursorPosition;
            updated = true;
        }

        if (props.value !== state.value && !props.valueEvent) {
            nextState.value = props.value;
            updated = true;
        }

        return updated ? nextState : null;
    }

    constructor(props) {
        super(props);

        this.state = {
            atMentionCount: 0,
            channelMentionCount: 0,
            cursorPosition: props.cursorPosition,
            emojiCount: 0,
            commandCount: 0,
            appCommandCount: 0,
            dateCount: 0,
            keyboardOffset: 0,
            value: props.value,
        };

        this.containerRef = React.createRef();
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);

        if (this.props.valueEvent) {
            EventEmitter.on(this.props.valueEvent, this.handleValueChange);
        }

        if (this.props.cursorPositionEvent) {
            EventEmitter.on(this.props.cursorPositionEvent, this.handleCursorPositionChange);
        }
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();

        if (this.props.valueEvent) {
            EventEmitter.off(this.props.valueEvent, this.handleValueChange);
        }

        if (this.props.cursorPositionEvent) {
            EventEmitter.off(this.props.cursorPositionEvent, this.handleCursorPositionChange);
        }
    }

    componentDidUpdate() {
        //eslint-disable-next-line no-underscore-dangle
        const visible = Boolean(this.containerRef.current?._children.length);
        this.props.onVisible(visible);
    }

    onChangeText = (value) => {
        this.props.onChangeText(value, true);
    };

    handleAtMentionCountChange = (atMentionCount) => {
        this.setState({atMentionCount});
    };

    handleChannelMentionCountChange = (channelMentionCount) => {
        this.setState({channelMentionCount});
    };

    handleCursorPositionChange = (cursorPosition) => {
        this.setState({cursorPosition});
    };

    handleEmojiCountChange = (emojiCount) => {
        this.setState({emojiCount});
    };

    handleAppCommandCountChange = (appCommandCount) => {
        this.setState({appCommandCount});
    }

    handleCommandCountChange = (commandCount) => {
        this.setState({commandCount});
    };

    handleIsDateFilterChange = (dateCount) => {
        this.setState({dateCount});
    };

    handleValueChange = (value) => {
        this.setState({value});
    };

    keyboardDidShow = (e) => {
        const {height} = e.endCoordinates;
        this.setState({keyboardOffset: height});
        this.props.onKeyboardOffsetChanged(height);
    };

    keyboardDidHide = () => {
        this.setState({keyboardOffset: 0});
        this.props.onKeyboardOffsetChanged(0);
    };

    maxListHeight() {
        let maxHeight;
        if (this.props.maxHeight) {
            maxHeight = this.props.maxHeight;
        } else {
            // List is expanding downwards, likely from the search box
            let offset = Platform.select({ios: 65, android: 75});
            if (DeviceTypes.IS_IPHONE_WITH_INSETS) {
                offset = 90;
            }

            maxHeight = (this.props.deviceHeight / 2) - offset;
        }

        return maxHeight;
    }

    render() {
        const {atMentionCount, channelMentionCount, emojiCount, commandCount, appCommandCount, dateCount, cursorPosition, value} = this.state;
        const {theme, isSearch, offsetY} = this.props;
        const style = getStyleFromTheme(theme);
        const maxListHeight = this.maxListHeight();
        const wrapperStyles = [];
        const containerStyles = [style.borders];

        if (Platform.OS === 'ios') {
            wrapperStyles.push(style.shadow);
        }

        if (isSearch) {
            wrapperStyles.push(style.base, style.searchContainer, {height: maxListHeight});
        } else {
            const containerStyle = {bottom: offsetY};
            containerStyles.push(style.base, containerStyle);
        }

        // Hide when there are no active autocompletes
        if (atMentionCount + channelMentionCount + emojiCount + commandCount + appCommandCount + dateCount === 0) {
            wrapperStyles.push(style.hidden);
            containerStyles.push(style.hidden);
        }

        const appsTakeOver = this.state.appCommandCount > 0;
        return (
            <View
                style={wrapperStyles}
                edges={['left', 'right']}
            >
                <View
                    testID='autocomplete'
                    ref={this.containerRef}
                    style={containerStyles}
                >
                    <AppSlashSuggestion
                        {...this.props}
                        maxListHeight={maxListHeight}
                        onChangeText={this.onChangeText}
                        onResultCountChange={this.handleAppCommandCountChange}
                        value={value || ''}
                        nestedScrollEnabled={this.props.nestedScrollEnabled}
                    />
                    <AtMention
                        {...this.props}
                        cursorPosition={cursorPosition}
                        maxListHeight={maxListHeight}
                        onChangeText={this.onChangeText}
                        onResultCountChange={this.handleAtMentionCountChange}
                        value={value || ''}
                        nestedScrollEnabled={this.props.nestedScrollEnabled}
                        appsTakeOver={appsTakeOver}
                    />
                    <ChannelMention
                        {...this.props}
                        cursorPosition={cursorPosition}
                        maxListHeight={maxListHeight}
                        onChangeText={this.onChangeText}
                        onResultCountChange={this.handleChannelMentionCountChange}
                        value={value || ''}
                        nestedScrollEnabled={this.props.nestedScrollEnabled}
                        appsTakeOver={appsTakeOver}
                    />
                    <EmojiSuggestion
                        {...this.props}
                        cursorPosition={cursorPosition}
                        maxListHeight={maxListHeight}
                        onChangeText={this.onChangeText}
                        onResultCountChange={this.handleEmojiCountChange}
                        value={value || ''}
                        nestedScrollEnabled={this.props.nestedScrollEnabled}
                        appsTakeOver={appsTakeOver}
                    />
                    <SlashSuggestion
                        {...this.props}
                        maxListHeight={maxListHeight}
                        onChangeText={this.onChangeText}
                        onResultCountChange={this.handleCommandCountChange}
                        value={value || ''}
                        nestedScrollEnabled={this.props.nestedScrollEnabled}
                        appsTakeOver={appsTakeOver}
                    />
                    {(this.props.isSearch && this.props.enableDateSuggestion) &&
                    <DateSuggestion
                        {...this.props}
                        cursorPosition={cursorPosition}
                        onChangeText={this.onChangeText}
                        onResultCountChange={this.handleIsDateFilterChange}
                        value={value || ''}
                        appsTakeOver={appsTakeOver}
                    />
                    }
                </View>
            </View>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        base: {
            left: 8,
            position: 'absolute',
            right: 8,
        },
        borders: {
            borderWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.2),
            overflow: 'hidden',
            borderRadius: 4,
        },
        hidden: {
            display: 'none',
        },
        searchContainer: {
            ...Platform.select({
                android: {
                    top: 42,
                },
                ios: {
                    top: 55,
                },
            }),
        },
        shadow: {
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: {
                width: 0,
                height: 8,
            },
        },
    };
});
