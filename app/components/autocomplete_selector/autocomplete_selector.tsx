// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {Text, View} from 'react-native';
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
import {ActionResult} from '@mm-redux/types/actions';
import {Channel} from '@mm-redux/types/channels';
import {DialogOption} from '@mm-redux/types/integrations';
import {UserProfile} from '@mm-redux/types/users';
import {Theme} from '@mm-redux/types/preferences';

type Selection = DialogOption | Channel | UserProfile | DialogOption[] | Channel[] | UserProfile[];

type Props = {
    actions: {
        setAutocompleteSelector: (dataSource: any, onSelect: any, options: any, getDynamicOptions: any) => Promise<ActionResult>;
    },
    getDynamicOptions?: (term: string) => Promise<ActionResult>;
    label?: string;
    placeholder?: string;
    dataSource?: string;
    options?: DialogOption[];
    selected?: DialogOption | DialogOption[];
    optional?: boolean;
    showRequiredAsterisk?: boolean;
    teammateNameDisplay?: string;
    theme: Theme;
    onSelected?: ((item: DialogOption) => void) | ((item: DialogOption[]) => void);
    helpText?: string;
    errorText?: string;
    roundedBorders?: boolean;
    disabled?: boolean;
    isMultiselect?: boolean;
}

type State = {
    selectedText: string;
    selected?: DialogOption | DialogOption[];
}

export default class AutocompleteSelector extends PureComponent<Props, State> {
    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        optional: false,
        showRequiredAsterisk: false,
        roundedBorders: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            selectedText: '',
        };
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        if (!props.selected || props.selected === state.selected) {
            return null;
        }

        if (!props.isMultiselect) {
            return {
                selectedText: (props.selected as DialogOption).text,
                selected: props.selected,
            };
        }

        const options = props.selected as DialogOption[];
        let selectedText = '';
        const selected: DialogOption[] = [];

        options.forEach((option) => {
            if (selectedText !== '') {
                selectedText += ', ';
            }
            selectedText += option.text;
            selected.push(option);
        });

        return {
            selectedText,
            selected,
        };
    }

    handleSelect = (selected: Selection) => {
        if (!selected) {
            return;
        }

        const {
            dataSource,
            teammateNameDisplay,
        } = this.props;

        if (!this.props.isMultiselect) {
            let selectedText: string;
            let selectedValue: string;
            switch (dataSource) {
            case ViewTypes.DATA_SOURCE_USERS: {
                const typedSelected = selected as UserProfile;
                selectedText = displayUsername(typedSelected, teammateNameDisplay || '');
                selectedValue = typedSelected.id;
                break;
            }
            case ViewTypes.DATA_SOURCE_CHANNELS: {
                const typedSelected = selected as Channel;
                selectedText = typedSelected.display_name;
                selectedValue = typedSelected.id;
                break;
            }
            default: {
                const typedSelected = selected as DialogOption;
                selectedText = typedSelected.text;
                selectedValue = typedSelected.value;
            }
            }

            this.setState({selectedText});

            if (this.props.onSelected) {
                (this.props.onSelected as (opt: DialogOption) => void)({text: selectedText, value: selectedValue});
            }
            return;
        }

        let selectedText = '';
        const selectedOptions: DialogOption[] = [];
        switch (dataSource) {
        case ViewTypes.DATA_SOURCE_USERS: {
            const typedSelected = selected as UserProfile[];
            typedSelected.forEach((option) => {
                if (selectedText !== '') {
                    selectedText += ', ';
                }
                const text = displayUsername(option, teammateNameDisplay || '');
                selectedText += text;
                selectedOptions.push({text, value: option.id});
            });
            break;
        }
        case ViewTypes.DATA_SOURCE_CHANNELS: {
            const typedSelected = selected as Channel[];
            typedSelected.forEach((option) => {
                if (selectedText !== '') {
                    selectedText += ', ';
                }
                const text = option.display_name;
                selectedText += text;
                selectedOptions.push({text, value: option.id});
            });
            break;
        }
        default: {
            const typedSelected = selected as DialogOption[];
            typedSelected.forEach((option) => {
                if (selectedText !== '') {
                    selectedText += ', ';
                }
                selectedText += option.text;
                selectedOptions.push(option);
            });
            break;
        }
        }

        this.setState({selectedText});

        if (this.props.onSelected) {
            (this.props.onSelected as (opt: DialogOption[]) => void)(selectedOptions);
        }
    };

    goToSelectorScreen = preventDoubleTap(async () => {
        const closeButton = await CompassIcon.getImageSource('close', 24, this.props.theme.sidebarHeaderTextColor);

        const {formatMessage} = this.context.intl;
        const {actions, dataSource, options, placeholder, getDynamicOptions, theme} = this.props;
        const screen = 'SelectorScreen';
        const title = placeholder || formatMessage({id: 'mobile.action_menu.select', defaultMessage: 'Select an option'});

        actions.setAutocompleteSelector(dataSource, this.handleSelect, options, getDynamicOptions);
        let screenOptions = {};
        if (this.props.isMultiselect) {
            screenOptions = {
                topBar: {
                    leftButtons: [{
                        id: 'close-dialog',
                        icon: closeButton,
                    }],
                    rightButtons: [{
                        id: 'submit-form',
                        showAsAction: 'always',
                        text: 'Select',
                    }],
                    rightButtonColor: theme.sidebarHeaderTextColor,
                },
            };
        }
        goToScreen(screen, title, {isMultiselect: this.props.isMultiselect, selected: this.state.selected}, screenOptions);
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
                        <CompassIcon
                            name='chevron-down'
                            color={changeOpacity(theme.centerChannelColor, 0.5)}
                            style={style.icon}
                        />
                    </View>
                </TouchableWithFeedback>
                {helpTextContent}
                {errorTextContent}
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
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
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        dropdownSelected: {
            top: 3,
            marginLeft: 5,
            color: theme.centerChannelColor,
        },
        icon: {
            position: 'absolute',
            top: 13,
            right: 12,
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
