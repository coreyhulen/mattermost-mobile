// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import AutocompleteSelector from '@components/autocomplete_selector';
import Markdown from '@components/markdown/markdown';
import BoolSetting from '@components/widgets/settings/bool_setting';
import TextSetting from '@components/widgets/settings/text_setting';
import {ViewTypes} from '@constants/index';
import {AppFieldTypes} from '@mm-redux/constants/apps';
import {AppField, AppFormValue, AppSelectOption} from '@mm-redux/types/apps';
import {DialogOption} from '@mm-redux/types/integrations';
import {Theme} from '@mm-redux/types/preferences';
import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {makeStyleSheetFromTheme} from '@utils/theme';

const TEXT_DEFAULT_MAX_LENGTH = 150;
const TEXTAREA_DEFAULT_MAX_LENGTH = 3000;

export type Props = {
    field: AppField;
    name: string;
    errorText?: string;
    theme: Theme;

    value: AppFormValue;
    onChange: (name: string, value: string | AppSelectOption | boolean) => void;
    performLookup: (name: string, userInput: string) => Promise<AppSelectOption[]>;
}

type State = {
    selected: DialogOption | null;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        markdownFieldContainer: {
            marginTop: 15,
            marginBottom: 10,
            marginLeft: 15,
        },
        markdownFieldText: {
            fontSize: 14,
            color: theme.centerChannelColor,
        },
    };
});

export default class AppsFormField extends React.PureComponent<Props, State> {
    state = {
        selected: null,
    };

    handleAutocompleteSelect = (selected: DialogOption) => {
        if (!selected) {
            return;
        }
        const {
            field,
        } = this.props;

        this.setState({selected});

        const selectedOption = {
            label: selected.text,
            value: selected.value,
        };

        this.props.onChange(field.name, selectedOption);
    };

    getDynamicOptions = async (userInput = ''): Promise<{data: DialogOption[]}> => {
        const options = await this.props.performLookup(this.props.field.name, userInput);
        return {
            data: options.map((option) => ({
                text: option.label,
                value: option.value,
            })),
        };
    };

    render() {
        const {
            field,
            name,
            value,
            onChange,
            errorText,
            theme,
        } = this.props;

        const placeholder = field.hint || '';
        const displayName = (field.modal_label || field.label) as string;

        switch (field.type) {
        case AppFieldTypes.TEXT: {
            let keyboardType = 'default';
            let multiline = false;
            let secureTextEntry = false;

            const subtype = field.subtype || 'text';

            let maxLength = field.max_length;
            if (!maxLength) {
                if (subtype === 'textarea') {
                    maxLength = TEXTAREA_DEFAULT_MAX_LENGTH;
                } else {
                    maxLength = TEXT_DEFAULT_MAX_LENGTH;
                }
            }

            let textType = 'input';
            if (subtype && TextSetting.validTypes.includes(subtype)) {
                textType = subtype;
            }

            switch (textType) {
            case 'email':
                keyboardType = 'email-address';
                break;
            case 'number':
                keyboardType = 'numeric';
                break;
            case 'tel':
                keyboardType = 'phone-pad';
                break;
            case 'url':
                keyboardType = 'url';
                break;
            case 'password':
                secureTextEntry = true;
                break;
            case 'textarea':
                multiline = true;
                break;
            }

            const textValue = value as string;
            return (
                <TextSetting
                    id={name}
                    label={displayName}
                    maxLength={maxLength}
                    value={textValue || ''}
                    placeholder={placeholder}
                    helpText={field.description}
                    errorText={errorText}
                    onChange={onChange}
                    optional={!field.is_required}
                    showRequiredAsterisk={true}
                    resizable={false}
                    theme={theme}
                    multiline={multiline}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    disabled={field.readonly}
                />
            );
        }
        case AppFieldTypes.USER:
        case AppFieldTypes.CHANNEL:
        case AppFieldTypes.STATIC_SELECT:
        case AppFieldTypes.DYNAMIC_SELECT: {
            let dataSource = '';
            let options: DialogOption[] = [];

            switch (field.type) {
            case AppFieldTypes.USER:
                dataSource = ViewTypes.DATA_SOURCE_USERS;
                break;
            case AppFieldTypes.CHANNEL:
                dataSource = ViewTypes.DATA_SOURCE_CHANNELS;
                break;
            case AppFieldTypes.DYNAMIC_SELECT:
                dataSource = ViewTypes.DATA_SOURCE_DYNAMIC;
                break;
            case AppFieldTypes.STATIC_SELECT:
                if (field.options) {
                    options = field.options.map((option) => ({text: option.label, value: option.value}));
                }
            }

            return (
                <AutocompleteSelector
                    id={name}
                    label={displayName}
                    dataSource={dataSource}
                    options={options}
                    optional={!field.is_required}
                    onSelected={this.handleAutocompleteSelect}
                    getDynamicOptions={this.getDynamicOptions}
                    helpText={field.description}
                    errorText={errorText}
                    placeholder={placeholder}
                    showRequiredAsterisk={true}
                    selected={this.state.selected}
                    roundedBorders={false}
                    disabled={field.readonly}
                />
            );
        }
        case AppFieldTypes.BOOL: {
            const boolValue = value as boolean;
            return (
                <BoolSetting
                    id={name}
                    label={displayName}
                    value={boolValue || false}
                    placeholder={placeholder}
                    helpText={field.description}
                    errorText={errorText}
                    optional={!field.is_required}
                    theme={theme}
                    onChange={onChange}
                    disabled={field.readonly}
                />
            );
        }
        case AppFieldTypes.MARKDOWN: {
            if (!field.description) {
                return null;
            }
            const style = getStyleSheet(theme);

            return (
                <View
                    style={style.markdownFieldContainer}
                >
                    <Markdown
                        value={field.description}
                        mentionKeys={[]}
                        blockStyles={getMarkdownBlockStyles(theme)}
                        textStyles={getMarkdownTextStyles(theme)}
                        baseTextStyle={style.markdownFieldText}
                        theme={theme}
                    />
                </View>
            );
        }
        }

        return null;
    }
}
