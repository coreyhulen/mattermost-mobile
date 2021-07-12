// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {View, Text, TouchableOpacity, TextInput, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleProp, ViewStyle} from 'react-native';
import {Navigation, NavigationComponent, NavigationComponentProps, OptionsTopBarButton, Options, NavigationButtonPressedEvent} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {dismissModal, showModal, mergeNavigationOptions} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import ClearButton from '@components/custom_status/clear_button';
import Emoji from '@components/emoji';
import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import {CustomStatus, DeviceTypes} from '@constants';
import {ActionFunc, ActionResult} from '@mm-redux/types/actions';
import {Theme} from '@mm-redux/types/preferences';
import {UserCustomStatus} from '@mm-redux/types/users';
import EventEmitter from '@mm-redux/utils/event_emitter';
import CustomStatusSuggestion from '@screens/custom_status/custom_status_suggestion';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, getKeyboardAppearanceFromTheme, makeStyleSheetFromTheme} from '@utils/theme';

type DefaultUserCustomStatus = {
    emoji: string;
    message: string;
    messageDefault: string;
};

const defaultCustomStatusSuggestions: DefaultUserCustomStatus[] = [
    {emoji: 'calendar', message: t('custom_status.suggestions.in_a_meeting'), messageDefault: 'In a meeting'},
    {emoji: 'hamburger', message: t('custom_status.suggestions.out_for_lunch'), messageDefault: 'Out for lunch'},
    {emoji: 'sneezing_face', message: t('custom_status.suggestions.out_sick'), messageDefault: 'Out sick'},
    {emoji: 'house', message: t('custom_status.suggestions.working_from_home'), messageDefault: 'Working from home'},
    {emoji: 'palm_tree', message: t('custom_status.suggestions.on_a_vacation'), messageDefault: 'On a vacation'},
];

interface Props extends NavigationComponentProps {
    intl: typeof intlShape;
    theme: Theme;
    customStatus: UserCustomStatus;
    recentCustomStatuses: UserCustomStatus[];
    isLandscape: boolean;
    actions: {
        setCustomStatus: (customStatus: UserCustomStatus) => Promise<ActionResult>;
        unsetCustomStatus: () => ActionFunc;
        removeRecentCustomStatus: (customStatus: UserCustomStatus) => ActionFunc;
    };
}

type State = {
    emoji: string;
    text: string;
}

class CustomStatusModal extends NavigationComponent<Props, State> {
    rightButton: OptionsTopBarButton = {
        id: 'update-custom-status',
        testID: 'custom_status.done.button',
        enabled: true,
        showAsAction: 'always',
    };

    static options(): Options {
        return {
            topBar: {
                title: {
                    alignment: 'center',
                },
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.rightButton.text = props.intl.formatMessage({id: 'mobile.custom_status.modal_confirm', defaultMessage: 'Done'});
        this.rightButton.color = props.theme.sidebarHeaderTextColor;

        const options: Options = {
            topBar: {
                rightButtons: [this.rightButton],
            },
        };

        mergeNavigationOptions(props.componentId, options);

        this.state = {
            emoji: props.customStatus?.emoji,
            text: props.customStatus?.text || '',
        };
    }

    componentDidMount() {
        Navigation.events().bindComponent(this);
    }

    navigationButtonPressed({buttonId}: NavigationButtonPressedEvent) {
        switch (buttonId) {
        case 'update-custom-status':
            this.handleSetStatus();
            break;
        }
    }

    handleSetStatus = async () => {
        const {emoji, text} = this.state;
        const isStatusSet = emoji || text;
        const {customStatus} = this.props;
        if (isStatusSet) {
            const isStatusSame = customStatus?.emoji === emoji && customStatus?.text === text;
            if (!isStatusSame) {
                const status = {
                    emoji: emoji || 'speech_balloon',
                    text: text.trim(),
                };
                const {error} = await this.props.actions.setCustomStatus(status);
                if (error) {
                    EventEmitter.emit(CustomStatus.SET_CUSTOM_STATUS_FAILURE);
                }
            }
        } else if (customStatus?.emoji) {
            this.props.actions.unsetCustomStatus();
        }
        Keyboard.dismiss();
        dismissModal();
    };

    handleTextChange = (value: string) => this.setState({text: value});

    handleRecentCustomStatusClear = (status: UserCustomStatus) => this.props.actions.removeRecentCustomStatus(status);

    clearHandle = () => {
        this.setState({emoji: '', text: ''});
    };

    handleSuggestionClick = (status: UserCustomStatus) => {
        const {emoji, text} = status;
        this.setState({emoji, text});
    };

    renderRecentCustomStatuses = (style: Record<string, StyleProp<ViewStyle>>) => {
        const {recentCustomStatuses, theme} = this.props;
        const recentStatuses = recentCustomStatuses.map((status: UserCustomStatus, index: number) => (
            <CustomStatusSuggestion
                key={status.text}
                handleSuggestionClick={this.handleSuggestionClick}
                handleClear={this.handleRecentCustomStatusClear}
                emoji={status.emoji}
                text={status.text}
                theme={theme}
                separator={index !== recentCustomStatuses.length - 1}
            />
        ));

        if (recentStatuses.length === 0) {
            return null;
        }

        return (
            <>
                <View style={style.separator}/>
                <View testID='custom_status.recents'>
                    <FormattedText
                        id='custom_status.suggestions.recent_title'
                        defaultMessage='RECENT'
                        style={style.title}
                    />
                    <View style={style.block}>
                        {recentStatuses}
                    </View>
                </View >
            </>
        );
    };

    renderCustomStatusSuggestions = (style: Record<string, StyleProp<ViewStyle>>) => {
        const {recentCustomStatuses, theme, intl} = this.props;
        const recentCustomStatusTexts = recentCustomStatuses.map((status: UserCustomStatus) => status.text);
        const customStatusSuggestions = defaultCustomStatusSuggestions.
            map((status) => ({
                emoji: status.emoji,
                text: intl.formatMessage({id: status.message, defaultMessage: status.messageDefault}),
            })).
            filter((status: UserCustomStatus) => !recentCustomStatusTexts.includes(status.text)).
            map((status: UserCustomStatus, index: number, arr: UserCustomStatus[]) => (
                <CustomStatusSuggestion
                    key={status.text}
                    handleSuggestionClick={this.handleSuggestionClick}
                    emoji={status.emoji}
                    text={status.text}
                    theme={theme}
                    separator={index !== arr.length - 1}
                />
            ));

        if (customStatusSuggestions.length === 0) {
            return null;
        }

        return (
            <>
                <View style={style.separator}/>
                <View testID='custom_status.suggestions'>
                    <FormattedText
                        id='custom_status.suggestions.title'
                        defaultMessage='SUGGESTIONS'
                        style={style.title}
                    />
                    <View style={style.block}>
                        {customStatusSuggestions}
                    </View>
                </View>
            </>
        );
    };

    openEmojiPicker = () => {
        const {theme, intl} = this.props;
        CompassIcon.getImageSource('close', 24, theme.sidebarHeaderTextColor).then((source) => {
            const screen = 'AddReaction';
            const title = intl.formatMessage({id: 'mobile.custom_status.choose_emoji', defaultMessage: 'Choose an emoji'});
            const passProps = {
                closeButton: source,
                onEmojiPress: this.handleEmojiClick,
            };

            showModal(screen, title, passProps);
        });
    };

    handleEmojiClick = (emoji: string) => {
        dismissModal();
        this.setState({emoji});
    }

    render() {
        const {emoji, text} = this.state;
        const {theme, isLandscape} = this.props;

        const isStatusSet = emoji || text;
        const style = getStyleSheet(theme);
        const customStatusEmoji = (
            <TouchableOpacity
                testID={`custom_status.emoji.${isStatusSet ? (emoji || 'speech_balloon') : 'default'}`}
                onPress={preventDoubleTap(this.openEmojiPicker)}
                style={style.iconContainer}
            >
                {isStatusSet ? (
                    <Text style={style.emoji}>
                        <Emoji
                            emojiName={emoji || 'speech_balloon'}
                            size={20}
                        />
                    </Text>
                ) : (
                    <CompassIcon
                        name='emoticon-happy-outline'
                        size={24}
                        style={style.icon}
                    />
                )}
            </TouchableOpacity>
        );

        const customStatusInput = (
            <View style={style.inputContainer}>
                <TextInput
                    testID='custom_status.input'
                    autoCapitalize='none'
                    autoCorrect={false}
                    blurOnSubmit={false}
                    disableFullscreenUI={true}
                    keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                    keyboardType='default'
                    maxLength={CustomStatus.CUSTOM_STATUS_TEXT_CHARACTER_LIMIT}
                    onChangeText={this.handleTextChange}
                    placeholder={this.props.intl.formatMessage({id: 'custom_status.set_status', defaultMessage: 'Set a Status'})}
                    placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                    returnKeyType='go'
                    style={style.input}
                    secureTextEntry={false}
                    underlineColorAndroid='transparent'
                    value={text}
                />
                {customStatusEmoji}
                {isStatusSet ? (
                    <View
                        style={style.clearButton}
                        testID='custom_status.input.clear.button'
                    >
                        <ClearButton
                            handlePress={this.clearHandle}
                            theme={theme}
                        />
                    </View>
                ) : null}
            </View>
        );

        let keyboardOffset = DeviceTypes.IS_IPHONE_WITH_INSETS ? 110 : 60;
        if (isLandscape) {
            keyboardOffset = DeviceTypes.IS_IPHONE_WITH_INSETS ? 0 : 10;
        }

        return (
            <SafeAreaView
                testID='custom_status.screen'
                style={style.container}
            >
                <KeyboardAvoidingView
                    behavior='padding'
                    style={style.container}
                    keyboardVerticalOffset={keyboardOffset}
                    enabled={Platform.OS === 'ios'}
                >
                    <ScrollView
                        bounces={false}
                    >
                        <StatusBar/>
                        <View style={style.scrollView}>
                            {customStatusInput}
                            {this.renderRecentCustomStatuses(style)}
                            {this.renderCustomStatusSuggestions(style)}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }
}

export default injectIntl(CustomStatusModal);

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
            paddingTop: 32,
        },
        inputContainer: {
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
            backgroundColor: theme.centerChannelBg,
        },
        input: {
            alignSelf: 'stretch',
            color: theme.centerChannelColor,
            width: '100%',
            fontSize: 17,
            paddingHorizontal: 52,
            textAlignVertical: 'center',
            height: 48,
        },
        icon: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
        },
        emoji: {
            color: theme.centerChannelColor,
        },
        iconContainer: {
            position: 'absolute',
            left: 14,
            top: 12,
        },
        separator: {
            marginTop: 32,
        },
        block: {
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderTopWidth: 1,
        },
        title: {
            fontSize: 17,
            marginBottom: 12,
            color: changeOpacity(theme.centerChannelColor, 0.5),
            marginLeft: 16,
        },
        clearButton: {
            position: 'absolute',
            top: 3,
            right: 14,
        },
    };
});
