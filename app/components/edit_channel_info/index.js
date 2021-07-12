// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Platform,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import {SafeAreaView} from 'react-native-safe-area-context';

import {popTopScreen, dismissModal} from '@actions/navigation';
import Autocomplete from '@components/autocomplete';
import ErrorText from '@components/error_text';
import FormattedText from '@components/formatted_text';
import Loading from '@components/loading';
import StatusBar from '@components/status_bar';
import TextInputWithLocalizedPlaceholder from '@components/text_input_with_localized_placeholder';
import DEVICE from '@constants/device';
import {General} from '@mm-redux/constants';
import {t} from '@utils/i18n';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

export default class EditChannelInfo extends PureComponent {
    static propTypes = {
        theme: PropTypes.object.isRequired,
        channelType: PropTypes.string,
        enableRightButton: PropTypes.func,
        saving: PropTypes.bool.isRequired,
        editing: PropTypes.bool,
        error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        displayName: PropTypes.string,
        channelURL: PropTypes.string,
        purpose: PropTypes.string,
        header: PropTypes.string,
        onDisplayNameChange: PropTypes.func,
        onPurposeChange: PropTypes.func,
        onHeaderChange: PropTypes.func,
        oldDisplayName: PropTypes.string,
        oldChannelURL: PropTypes.string,
        oldHeader: PropTypes.string,
        oldPurpose: PropTypes.string,
        testID: PropTypes.string,
    };

    static defaultProps = {
        editing: false,
    };

    constructor(props) {
        super(props);

        this.nameInput = React.createRef();
        this.urlInput = React.createRef();
        this.purposeInput = React.createRef();
        this.headerInput = React.createRef();
        this.scroll = React.createRef();

        this.state = {
            keyboardVisible: false,
            keyboardPosition: 0,
        };
    }

    blur = () => {
        if (this.nameInput?.current) {
            this.nameInput.current.blur();
        }

        // TODO: uncomment below once the channel URL field is added
        // if (this.urlInput?.current) {
        //     this.urlInput.current.blur();
        // }

        if (this.purposeInput?.current) {
            this.purposeInput.current.blur();
        }
        if (this.headerInput?.current) {
            this.headerInput.current.blur();
        }

        if (this.scroll?.current) {
            this.scroll.current.scrollTo({x: 0, y: 0, animated: true});
        }
    };

    close = (goBack = false) => {
        if (goBack) {
            popTopScreen();
        } else {
            dismissModal();
        }
    };

    canUpdate = (displayName, channelURL, purpose, header) => {
        const {
            oldDisplayName,
            oldChannelURL,
            oldPurpose,
            oldHeader,
        } = this.props;

        return displayName !== oldDisplayName || channelURL !== oldChannelURL ||
            purpose !== oldPurpose || header !== oldHeader;
    };

    enableRightButton = (enable = false) => {
        this.props.enableRightButton(enable);
    };

    onDisplayNameChangeText = (displayName) => {
        const {editing, onDisplayNameChange} = this.props;
        onDisplayNameChange(displayName);

        if (editing) {
            const {channelURL, purpose, header} = this.props;
            const canUpdate = this.canUpdate(displayName, channelURL, purpose, header);
            this.enableRightButton(canUpdate);
            return;
        }

        const displayNameExists = displayName && displayName.length >= 2;
        this.props.enableRightButton(displayNameExists);
    };

    onPurposeChangeText = (purpose) => {
        const {editing, onPurposeChange} = this.props;
        onPurposeChange(purpose);

        if (editing) {
            const {displayName, channelURL, header} = this.props;
            const canUpdate = this.canUpdate(displayName, channelURL, purpose, header);
            this.enableRightButton(canUpdate);
        }
    };

    onHeaderChangeText = (header) => {
        const {editing, onHeaderChange} = this.props;
        onHeaderChange(header);

        if (editing) {
            const {displayName, channelURL, purpose} = this.props;
            const canUpdate = this.canUpdate(displayName, channelURL, purpose, header);
            this.enableRightButton(canUpdate);
        }
    };

    onHeaderLayout = ({nativeEvent}) => {
        this.setState({headerPosition: nativeEvent.layout.y});
    }

    onKeyboardDidShow = () => {
        this.setState({keyboardVisible: true});

        if (this.state.headerHasFocus) {
            this.setState({headerHasFocus: false});
            this.scrollHeaderToTop();
        }
    }

    onKeyboardDidHide = () => {
        this.setState({keyboardVisible: false});
    }

    onKeyboardOffsetChanged = (keyboardPosition) => {
        this.setState({keyboardPosition});
    }

    onHeaderFocus = () => {
        if (this.state.keyboardVisible) {
            this.scrollHeaderToTop();
        } else {
            this.setState({headerHasFocus: true});
        }
    };

    scrollHeaderToTop = () => {
        if (this.scroll.current) {
            this.scroll.current.scrollTo({x: 0, y: this.state.headerPosition});
        }
    }

    render() {
        const {
            theme,
            channelType,
            displayName,
            header,
            purpose,
            error,
            saving,
            testID,
        } = this.props;
        const {keyboardVisible, keyboardPosition} = this.state;
        const bottomStyle = {
            bottom: Platform.select({
                ios: keyboardPosition,
                android: 0,
            }),
        };
        const style = getStyleSheet(theme);

        const displayHeaderOnly = channelType === General.DM_CHANNEL ||
            channelType === General.GM_CHANNEL;

        if (saving) {
            return (
                <View style={style.container}>
                    <StatusBar/>
                    <Loading color={theme.centerChannelColor}/>
                </View>
            );
        }

        let displayError;
        if (error) {
            displayError = (
                <SafeAreaView
                    edges={['bottom', 'left', 'right']}
                    style={style.errorContainer}
                >
                    <View style={style.errorWrapper}>
                        <ErrorText
                            testID='edit_channel_info.error.text'
                            error={error}
                        />
                    </View>
                </SafeAreaView>
            );
        }

        return (
            <SafeAreaView
                edges={['bottom', 'left', 'right']}
                style={style.container}
            >
                <StatusBar/>
                <KeyboardAwareScrollView
                    testID={testID}
                    ref={this.scroll}
                    style={style.container}
                    keyboardShouldPersistTaps={'always'}
                    onKeyboardDidShow={this.onKeyboardDidShow}
                    onKeyboardDidHide={this.onKeyboardDidHide}
                    enableAutomaticScroll={!keyboardVisible}
                >
                    {displayError}
                    <TouchableWithoutFeedback onPress={this.blur}>
                        <View style={style.scrollView}>
                            {!displayHeaderOnly && (
                                <View>
                                    <View>
                                        <FormattedText
                                            style={style.title}
                                            id='channel_modal.name'
                                            defaultMessage='Name'
                                        />
                                    </View>
                                    <View style={style.inputContainer}>
                                        <TextInputWithLocalizedPlaceholder
                                            testID='edit_channel_info.name.input'
                                            ref={this.nameInput}
                                            value={displayName}
                                            onChangeText={this.onDisplayNameChangeText}
                                            style={style.input}
                                            autoCapitalize='none'
                                            autoCorrect={false}
                                            placeholder={{id: t('channel_modal.nameEx'), defaultMessage: 'E.g.: "Bugs", "Marketing", "客户支持"'}}
                                            placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                                            underlineColorAndroid='transparent'
                                            disableFullscreenUI={true}
                                            maxLength={64}
                                            keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                                        />
                                    </View>
                                </View>
                            )}
                            {!displayHeaderOnly && (
                                <View>
                                    <View style={style.titleContainer30}>
                                        <FormattedText
                                            style={style.title}
                                            id='channel_modal.purpose'
                                            defaultMessage='Purpose'
                                        />
                                        <FormattedText
                                            style={style.optional}
                                            id='channel_modal.optional'
                                            defaultMessage='(optional)'
                                        />
                                    </View>
                                    <View style={style.inputContainer}>
                                        <TextInputWithLocalizedPlaceholder
                                            testID='edit_channel_info.purpose.input'
                                            ref={this.purposeInput}
                                            value={purpose}
                                            onChangeText={this.onPurposeChangeText}
                                            style={[style.input, {height: 110}]}
                                            autoCapitalize='none'
                                            autoCorrect={false}
                                            placeholder={{id: t('channel_modal.purposeEx'), defaultMessage: 'E.g.: "A channel to file bugs and improvements"'}}
                                            placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                                            multiline={true}
                                            blurOnSubmit={false}
                                            textAlignVertical='top'
                                            underlineColorAndroid='transparent'
                                            disableFullscreenUI={true}
                                            keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                                        />
                                    </View>
                                    <View>
                                        <FormattedText
                                            style={style.helpText}
                                            id='channel_modal.descriptionHelp'
                                            defaultMessage='Describe how this channel should be used.'
                                        />
                                    </View>
                                </View>
                            )}
                            <View
                                onLayout={this.onHeaderLayout}
                                style={style.titleContainer15}
                            >
                                <FormattedText
                                    style={style.title}
                                    id='channel_modal.header'
                                    defaultMessage='Header'
                                />
                                <FormattedText
                                    style={style.optional}
                                    id='channel_modal.optional'
                                    defaultMessage='(optional)'
                                />
                            </View>
                            <View style={style.inputContainer}>
                                <TextInputWithLocalizedPlaceholder
                                    testID='edit_channel_info.header.input'
                                    ref={this.headerInput}
                                    value={header}
                                    onChangeText={this.onHeaderChangeText}
                                    style={[style.input, {height: 110}]}
                                    autoCapitalize='none'
                                    autoCorrect={false}
                                    placeholder={{id: t('channel_modal.headerEx'), defaultMessage: 'E.g.: "[Link Title](http://example.com)"'}}
                                    placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                                    multiline={true}
                                    blurOnSubmit={false}
                                    onFocus={this.onHeaderFocus}
                                    textAlignVertical='top'
                                    underlineColorAndroid='transparent'
                                    disableFullscreenUI={true}
                                    keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                                />
                            </View>
                            <View style={style.headerHelpText}>
                                <FormattedText
                                    style={style.helpText}
                                    id='channel_modal.headerHelp'
                                    defaultMessage={'Set text that will appear in the header of the channel beside the channel name. For example, include frequently used links by typing [Link Title](http://example.com).'}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAwareScrollView>
                <View style={[style.autocompleteContainer, bottomStyle]}>
                    <Autocomplete
                        cursorPosition={header.length}
                        maxHeight={DEVICE.AUTOCOMPLETE_MAX_HEIGHT}
                        onChangeText={this.onHeaderChangeText}
                        value={header}
                        nestedScrollEnabled={true}
                        onKeyboardOffsetChanged={this.onKeyboardOffsetChanged}
                        offsetY={8}
                        style={style.autocomplete}
                    />
                </View>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        autocomplete: {
            position: undefined,
        },
        autocompleteContainer: {
            position: 'absolute',
            width: '100%',
            flex: 1,
            justifyContent: 'flex-end',
        },
        container: {
            flex: 1,
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            paddingTop: 30,
        },
        errorContainer: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            width: '100%',
        },
        errorWrapper: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        inputContainer: {
            marginTop: 10,
            backgroundColor: theme.centerChannelBg,
        },
        input: {
            color: theme.centerChannelColor,
            fontSize: 14,
            height: 40,
            paddingHorizontal: 15,
        },
        titleContainer30: {
            flexDirection: 'row',
            marginTop: 30,
        },
        titleContainer15: {
            flexDirection: 'row',
            marginTop: 15,
        },
        title: {
            fontSize: 14,
            color: theme.centerChannelColor,
            marginLeft: 15,
        },
        optional: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 14,
            marginLeft: 5,
        },
        helpText: {
            fontSize: 14,
            color: changeOpacity(theme.centerChannelColor, 0.5),
            marginTop: 10,
            marginHorizontal: 15,
        },
        headerHelpText: {
            zIndex: -1,
        },
    };
});
