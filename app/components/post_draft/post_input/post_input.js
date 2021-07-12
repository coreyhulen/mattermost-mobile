// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Alert, AppState, findNodeHandle, Keyboard, NativeModules, Platform} from 'react-native';

import PasteableTextInput from '@components/pasteable_text_input';
import {NavigationTypes} from '@constants';
import DEVICE from '@constants/device';
import {INSERT_TO_COMMENT, INSERT_TO_DRAFT} from '@constants/post_draft';
import {debounce} from '@mm-redux/actions/helpers';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {t} from '@utils/i18n';
import {switchKeyboardForCodeBlocks} from '@utils/markdown';
import {changeOpacity, makeStyleSheetFromTheme, getKeyboardAppearanceFromTheme} from '@utils/theme';

const {RNTextInputReset} = NativeModules;
const INPUT_LINE_HEIGHT = 20;

export default class PostInput extends PureComponent {
    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        rootId: '',
    };

    static propTypes = {
        testID: PropTypes.string,
        channelDisplayName: PropTypes.string,
        channelId: PropTypes.string.isRequired,
        cursorPositionEvent: PropTypes.string,
        handleCommentDraftChanged: PropTypes.func.isRequired,
        handlePostDraftChanged: PropTypes.func.isRequired,
        inputEventType: PropTypes.string,
        isLandscape: PropTypes.bool,
        maxMessageLength: PropTypes.number,
        rootId: PropTypes.string,
        theme: PropTypes.object.isRequired,
        updateInitialValue: PropTypes.func.isRequired,
        userTyping: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.input = React.createRef();
        this.cursorPosition = 0;
        this.value = '';

        this.state = {
            keyboardType: 'default',
            longMessageAlertShown: false,
        };
    }

    componentDidMount() {
        const event = this.props.rootId ? INSERT_TO_COMMENT : INSERT_TO_DRAFT;
        EventEmitter.on(event, this.handleInsertTextToDraft);
        EventEmitter.on(NavigationTypes.BLUR_POST_DRAFT, this.blur);
        AppState.addEventListener('change', this.handleAppStateChange);

        if (Platform.OS === 'android') {
            Keyboard.addListener('keyboardDidHide', this.handleAndroidKeyboard);
        }
    }

    componentWillUnmount() {
        const event = this.props.rootId ? INSERT_TO_COMMENT : INSERT_TO_DRAFT;
        EventEmitter.off(NavigationTypes.BLUR_POST_DRAFT, this.blur);
        EventEmitter.off(event, this.handleInsertTextToDraft);
        AppState.removeEventListener('change', this.handleAppStateChange);

        if (Platform.OS === 'android') {
            Keyboard.removeListener('keyboardDidHide', this.handleAndroidKeyboard);
        }

        this.changeDraft(this.getValue());
    }

    blur = () => {
        if (this.input.current) {
            this.input.current.blur();
        }
    };

    changeDraft = debounce((text) => {
        const {
            channelId,
            handleCommentDraftChanged,
            handlePostDraftChanged,
            rootId,
        } = this.props;

        if (rootId) {
            handleCommentDraftChanged(rootId, text);
        } else {
            handlePostDraftChanged(channelId, text);
        }
    }, 200);

    checkMessageLength = (value) => {
        const {intl} = this.context;
        const {maxMessageLength} = this.props;
        const valueLength = value.trim().length;

        if (valueLength > maxMessageLength) {
            // Check if component is already aware message is too long
            if (!this.state.longMessageAlertShown) {
                Alert.alert(
                    intl.formatMessage({
                        id: 'mobile.message_length.title',
                        defaultMessage: 'Message Length',
                    }),
                    intl.formatMessage({
                        id: 'mobile.message_length.message',
                        defaultMessage: 'Your current message is too long. Current character count: {count}/{max}',
                    }, {
                        max: maxMessageLength,
                        count: valueLength,
                    }),
                );
                this.setState({longMessageAlertShown: true});
            }
        } else if (this.state.longMessageAlertShown) {
            this.setState({longMessageAlertShown: false});
        }
    };

    focus = () => {
        if (this.input.current) {
            this.input.current.focus();
        }
    }

    getPlaceHolder = () => {
        const {rootId} = this.props;
        let placeholder;

        if (rootId) {
            placeholder = {id: t('create_comment.addComment'), defaultMessage: 'Add a comment...'};
        } else {
            placeholder = {id: t('create_post.write'), defaultMessage: 'Write to {channelDisplayName}'};
        }

        return placeholder;
    };

    getValue = () => {
        return this.value;
    };

    handleAndroidKeyboard = () => {
        this.blur();
    };

    handleAppStateChange = (nextAppState) => {
        if (nextAppState !== 'active') {
            this.changeDraft(this.getValue());
        }
    };

    handleEndEditing = (e) => {
        if (e && e.nativeEvent && !DEVICE.IS_TABLET) {
            this.changeDraft(e.nativeEvent.text || '');
        }
    };

    handlePostDraftSelectionChanged = (event, fromHandleTextChange = false) => {
        const cursorPosition = fromHandleTextChange ? this.state.cursorPosition : event.nativeEvent.selection.end;

        const {cursorPositionEvent} = this.props;

        if (cursorPositionEvent) {
            EventEmitter.emit(cursorPositionEvent, cursorPosition);
        }

        if (Platform.OS === 'ios') {
            const keyboardType = switchKeyboardForCodeBlocks(this.state.value, cursorPosition);
            this.setState({cursorPosition, keyboardType});
        } else {
            this.setState({cursorPosition});
        }
    };

    handleTextChange = (value, autocomplete = false) => {
        const {
            channelId,
            cursorPositionEvent,
            inputEventType,
            rootId,
            updateInitialValue,
            userTyping,
        } = this.props;
        this.value = value;
        updateInitialValue(value);
        if (DEVICE.IS_TABLET) {
            this.changeDraft(value);
        }

        if (inputEventType) {
            EventEmitter.emit(inputEventType, value);
        }

        const nextState = {value};

        // Workaround for some Android keyboards that don't play well with cursors (e.g. Samsung keyboards)
        if (autocomplete && this.input?.current) {
            if (Platform.OS === 'android') {
                RNTextInputReset.resetKeyboardInput(findNodeHandle(this.input.current));
            } else {
                nextState.cursorPosition = value.length;
                if (cursorPositionEvent) {
                    EventEmitter.emit(cursorPositionEvent, nextState.cursorPosition);
                }
            }
        }

        this.checkMessageLength(value);

        // Workaround to avoid iOS emdash autocorrect in Code Blocks
        if (Platform.OS === 'ios') {
            const callback = () => this.handlePostDraftSelectionChanged(null, true);
            this.setState(nextState, callback);
        } else {
            this.setState(nextState);
        }

        if (value) {
            userTyping(channelId, rootId);
        }
    };

    handleInsertTextToDraft = (text) => {
        const {cursorPosition} = this.state;
        const value = this.getValue();

        let completed;
        if (value.length === 0) {
            completed = text;
        } else {
            const firstPart = value.substring(0, cursorPosition);
            const secondPart = value.substring(cursorPosition);
            completed = `${firstPart}${text}${secondPart}`;
        }

        this.value = completed;
        this.input.current.setNativeProps({
            text: completed,
        });
    };

    resetTextInput = () => {
        if (this.input.current) {
            this.input.current.setNativeProps({
                text: '',
            });
        }
    }

    setValue = (value, autocomplete = false) => {
        this.value = value;
        if (this.input.current) {
            this.input.current.setNativeProps({
                text: value,
            });
            this.handleTextChange(value, autocomplete);
        }
    }

    render() {
        const {formatMessage} = this.context.intl;
        const {testID, channelDisplayName, isLandscape, theme} = this.props;
        const style = getStyleSheet(theme);
        const placeholder = this.getPlaceHolder();
        let maxHeight = DEVICE.POST_INPUT_MAX_HEIGHT;

        if (isLandscape) {
            maxHeight = 88;
        }

        return (
            <PasteableTextInput
                testID={testID}
                ref={this.input}
                style={{...style.input, maxHeight}}
                onChangeText={this.handleTextChange}
                onSelectionChange={this.handlePostDraftSelectionChanged}
                placeholder={formatMessage(placeholder, {channelDisplayName})}
                placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                multiline={true}
                blurOnSubmit={false}
                underlineColorAndroid='transparent'
                keyboardType={this.state.keyboardType}
                onEndEditing={this.handleEndEditing}
                disableFullscreenUI={true}
                textContentType='none'
                autoCompleteType='off'
                keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
            />
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => ({
    input: {
        color: theme.centerChannelColor,
        fontSize: 15,
        lineHeight: INPUT_LINE_HEIGHT,
        paddingHorizontal: 12,
        paddingTop: Platform.select({
            ios: 6,
            android: 8,
        }),
        paddingBottom: Platform.select({
            ios: 6,
            android: 2,
        }),
        minHeight: 30,
    },
}));
