// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {Text, View} from 'react-native';
import PropTypes from 'prop-types';
import {intlShape} from 'react-intl';

import {displayUsername} from '@mm-redux/utils/user_utils';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import Markdown from '@components/markdown';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {preventDoubleTap} from '@utils/tap';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';
import {ViewTypes} from '@constants';
import {goToScreen} from '@actions/navigation';

export default class AutocompleteSelector extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            setAutocompleteSelector: PropTypes.func.isRequired,
        }).isRequired,
        getDynamicOptions: PropTypes.func,
        label: PropTypes.string,
        placeholder: PropTypes.string.isRequired,
        dataSource: PropTypes.string,
        options: PropTypes.arrayOf(PropTypes.object),
        selected: PropTypes.object,
        optional: PropTypes.bool,
        showRequiredAsterisk: PropTypes.bool,
        teammateNameDisplay: PropTypes.string,
        theme: PropTypes.object.isRequired,
        onSelected: PropTypes.func,
        onClear: PropTypes.func,
        helpText: PropTypes.node,
        errorText: PropTypes.node,
        roundedBorders: PropTypes.bool,
        disabled: PropTypes.bool,
    };

    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        optional: false,
        showRequiredAsterisk: false,
        roundedBorders: true,
    };

    constructor(props) {
        super(props);

        this.state = {
            selectedText: null,
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.selected && props.selected !== state.selected) {
            return {
                selectedText: props.selected.text,
                selected: props.selected,
            };
        }

        return null;
    }

    handleClear = () => {
        this.setState({selectedText: ''});
        this.props.onClear();
    }

    handleSelect = (selected) => {
        if (!selected) {
            return;
        }

        const {
            dataSource,
            teammateNameDisplay,
        } = this.props;

        let selectedText;
        let selectedValue;
        if (dataSource === ViewTypes.DATA_SOURCE_USERS) {
            selectedText = displayUsername(selected, teammateNameDisplay);
            selectedValue = selected.id;
        } else if (dataSource === ViewTypes.DATA_SOURCE_CHANNELS) {
            selectedText = selected.display_name;
            selectedValue = selected.id;
        } else {
            selectedText = selected.text;
            selectedValue = selected.value;
        }

        this.setState({selectedText});

        if (this.props.onSelected) {
            this.props.onSelected({text: selectedText, value: selectedValue});
        }
    };

    goToSelectorScreen = preventDoubleTap(() => {
        const {formatMessage} = this.context.intl;
        const {actions, dataSource, options, placeholder, getDynamicOptions} = this.props;
        const screen = 'SelectorScreen';
        const title = placeholder || formatMessage({id: 'mobile.action_menu.select', defaultMessage: 'Select an option'});

        actions.setAutocompleteSelector(dataSource, this.handleSelect, options, getDynamicOptions);
        goToScreen(screen, title);
    });

    render() {
        const {intl} = this.context;
        const {
            placeholder,
            theme,
            label,
            helpText,
            errorText,
            optional,
            showRequiredAsterisk,
            roundedBorders,
            disabled,
            selected,
            onClear,
        } = this.props;
        const {selectedText} = this.state;
        const style = getStyleSheet(theme);
        const textStyles = getMarkdownTextStyles(theme);
        const blockStyles = getMarkdownBlockStyles(theme);

        let text = placeholder || intl.formatMessage({id: 'mobile.action_menu.select', defaultMessage: 'Select an option'});
        let selectedStyle = style.dropdownPlaceholder;

        if (selectedText) {
            text = selectedText;
            selectedStyle = style.dropdownSelected;
        }

        let inputStyle = style.input;
        if (roundedBorders) {
            inputStyle = style.roundedInput;
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
        } else if (showRequiredAsterisk) {
            asterisk = <Text style={style.asterisk}>{' *'}</Text>;
        }

        let labelContent;
        if (label) {
            labelContent = (
                <View style={style.labelContainer}>
                    <Text style={style.label}>
                        {label}
                    </Text>
                    {asterisk}
                    {optionalContent}
                </View>

            );
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
                        disableAtChannelMentionHighlight={true}
                        disableHashtags={true}
                    />
                </View>
            );
        }

        const noediting = disabled ? style.disabled : null;

        return (
            <View style={style.container}>
                {labelContent}
                <TouchableWithFeedback
                    onPress={this.goToSelectorScreen}
                    type={'opacity'}
                    disabled={disabled}
                >
                    <View style={[inputStyle, noediting]}>
                        <Text
                            style={selectedStyle}
                            numberOfLines={1}
                        >
                            {text}
                        </Text>
                        {!disabled && onClear && selected && (
                            <CompassIcon
                                name='close-circle'
                                color={changeOpacity(theme.centerChannelColor, 0.5)}
                                style={style.clearx}
                                size={20}
                                onPress={this.handleClear}
                            />
                        )}
                    </View>
                </TouchableWithFeedback>
                {helpTextContent}
                {errorTextContent}
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    const input = {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.1),
        backgroundColor: changeOpacity(theme.centerChannelBg, 0.9),
        paddingLeft: 10,
        paddingRight: 30,
        paddingVertical: 7,
        height: 40,
    };

    return {
        container: {
            width: '100%',
            marginBottom: 2,
            marginRight: 8,
            marginTop: 10,
        },
        roundedInput: {
            ...input,
            borderRadius: 5,
        },
        input,
        dropdownPlaceholder: {
            top: 3,
            marginLeft: 5,
            paddingRight: 55,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        dropdownSelected: {
            top: 3,
            marginLeft: 5,
            paddingRight: 55,
            color: theme.centerChannelColor,
        },
        clearx: {
            position: 'absolute',
            top: 1,
            right: 5,
            padding: 8,
            paddingRight: 20,
            paddingLeft: 40,
        },
        labelContainer: {
            flexDirection: 'row',
            marginTop: 15,
            marginBottom: 10,
        },
        label: {
            fontSize: 14,
            color: theme.centerChannelColor,
            marginLeft: 15,
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
        disabled: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
    };
});
