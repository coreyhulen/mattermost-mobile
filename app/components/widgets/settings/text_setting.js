// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    View,
    Text,
    TextInput,
    Platform,
} from 'react-native';

import FormattedText from '@components/formatted_text';
import Markdown from '@components/markdown';
import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

export default class TextSetting extends PureComponent {
    static validTypes = ['input', 'textarea', 'number', 'email', 'tel', 'url', 'password'];

    static propTypes = {
        id: PropTypes.string.isRequired,
        label: PropTypes.oneOfType([
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                defaultMessage: PropTypes.string.isRequired,
            }),
            PropTypes.string,
        ]),
        placeholder: PropTypes.string,
        helpText: PropTypes.node,
        errorText: PropTypes.node,
        disabled: PropTypes.bool,
        disabledText: PropTypes.string,
        maxLength: PropTypes.number,
        optional: PropTypes.bool,
        theme: PropTypes.object.isRequired,
        onChange: PropTypes.func.isRequired,
        value: PropTypes.string.isRequired,
        multiline: PropTypes.bool,
        keyboardType: PropTypes.oneOf([
            'default',
            'number-pad',
            'decimal-pad',
            'numeric',
            'email-address',
            'phone-pad',
            'url',
        ]),
        secureTextEntry: PropTypes.bool,
        testID: PropTypes.string,
    };

    static defaultProps = {
        optional: false,
        disabled: false,
        multiline: false,
        keyboardType: 'default',
        secureTextEntry: false,
    };

    onChangeText = (value) => {
        const {id, onChange} = this.props;
        onChange(id, value);
    };

    render() {
        const {
            theme,
            label,
            placeholder,
            helpText,
            optional,
            disabled,
            disabledText,
            errorText,
            value,
            multiline,
            secureTextEntry,
            testID,
        } = this.props;
        const style = getStyleSheet(theme);
        const textStyles = getMarkdownTextStyles(theme);
        const blockStyles = getMarkdownBlockStyles(theme);

        let labelContent = label;
        if (label && label.defaultMessage) {
            labelContent = (
                <FormattedText
                    style={style.title}
                    id={label.id}
                    defaultMessage={label.defaultMessage}
                    testID={`${testID}.label_content`}
                />
            );
        } else if (typeof label === 'string') {
            labelContent = (
                <Text
                    style={style.title}
                    testID={`${testID}.label`}
                >
                    {label}
                </Text>);
        }

        let optionalContent;
        let asterisk;
        if (optional) {
            optionalContent = (
                <FormattedText
                    style={style.optional}
                    id='channel_modal.optional'
                    defaultMessage='(optional)'
                />
            );
        } else {
            asterisk = <Text style={style.asterisk}>{' *'}</Text>;
        }

        let {keyboardType} = this.props;
        if (Platform.OS === 'android' && keyboardType === 'url') {
            keyboardType = 'default';
        }

        let inputStyle = style.input;
        if (multiline) {
            inputStyle = style.multiline;
        }

        let helpTextContent;
        if (helpText) {
            helpTextContent = (
                <View style={style.helpTextContainer} >
                    <Markdown
                        baseTextStyle={style.helpText}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        value={helpText}
                    />
                </View>
            );
        }

        let errorTextContent;
        if (errorText) {
            errorTextContent = (
                <View style={style.errorTextContainer} >
                    <Markdown
                        baseTextStyle={style.errorText}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        value={errorText}
                    />
                </View>
            );
        }

        let disabledTextContent;
        if (disabled && disabledText) {
            disabledTextContent = (
                <View style={style.helpTextContainer} >
                    <Markdown
                        baseTextStyle={style.helpText}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        value={disabledText}
                    />
                </View>
            );
        }

        const noediting = disabled ? style.disabled : null;

        return (
            <View testID={testID}>
                <View style={style.titleContainer}>
                    {labelContent}
                    {asterisk}
                    {optionalContent}
                </View>
                <View style={[style.inputContainer, noediting]}>
                    <View>
                        <TextInput
                            value={value}
                            placeholder={placeholder}
                            placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                            onChangeText={this.onChangeText}
                            style={inputStyle}
                            autoCapitalize='none'
                            autoCorrect={false}
                            maxLength={this.props.maxLength}
                            editable={!disabled}
                            underlineColorAndroid='transparent'
                            disableFullscreenUI={true}
                            multiline={multiline}
                            keyboardType={keyboardType}
                            secureTextEntry={secureTextEntry}
                            keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                            testID={`${testID}.input`}
                        />
                    </View>
                </View>
                <View>
                    {disabledTextContent}
                    {helpTextContent}
                    {errorTextContent}
                </View>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    const input = {
        color: theme.centerChannelColor,
        fontSize: 14,
        paddingHorizontal: 15,
    };

    return {
        inputContainer: {
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
            backgroundColor: theme.centerChannelBg,
        },
        input: {
            ...input,
            height: 40,
        },
        multiline: {
            ...input,
            paddingTop: 10,
            paddingBottom: 13,
            height: 125,
        },
        disabled: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
        title: {
            fontSize: 14,
            color: theme.centerChannelColor,
            marginLeft: 15,
        },
        titleContainer: {
            flexDirection: 'row',
            marginTop: 15,
            marginBottom: 10,
        },
        optional: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 14,
            marginLeft: 5,
        },
        helpTextContainer: {
            marginHorizontal: 15,
            marginTop: 10,
        },
        helpText: {
            fontSize: 12,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        errorTextContainer: {
            marginHorizontal: 15,
            marginVertical: 10,
        },
        errorText: {
            fontSize: 12,
            color: theme.errorTextColor,
        },
        asterisk: {
            color: theme.errorTextColor,
            fontSize: 14,
        },
    };
});
