// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

export default class RadioSetting extends PureComponent {
    static propTypes = {
        id: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired,
        options: PropTypes.array.isRequired,
        default: PropTypes.string,
        onChange: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
        helpText: PropTypes.node,
        errorText: PropTypes.node,
    };

    constructor(props) {
        super(props);

        this.state = {
            value: typeof props.default === 'undefined' ? props.options[0] : props.default,
        };
    }

    handleChange = (item) => {
        const {onChange, id} = this.props;
        onChange(id, item);
        this.setState({value: item});
    }

    renderCheckMark = (value, style) => {
        if (value === this.state.value) {
            return (
                <CompassIcon
                    name='check'
                    style={style}
                />
            );
        }
        return null;
    }

    renderRowSeparator = (idx, separatorStyle) => {
        const {options} = this.props;
        if (idx === options.length - 1) {
            return null;
        }
        return <View style={separatorStyle}/>;
    }

    render() {
        const {
            theme,
            label,
            helpText,
            errorText,
        } = this.props;
        const style = getStyleSheet(theme);

        let helpTextContent;
        if (helpText) {
            helpTextContent = (
                <Text style={style.helpText}>
                    {helpText}
                </Text>
            );
        }
        let errorTextContent;
        if (errorText) {
            errorTextContent = (
                <Text style={style.errorText}>
                    {errorText}
                </Text>
            );
        }

        let additionalTextContent;
        if (errorText || helpText) {
            additionalTextContent = (
                <View >
                    {helpTextContent}
                    {errorTextContent}
                </View>
            );
        }

        const options = [];
        for (const [i, {value, text}] of this.props.options.entries()) {
            options.push(
                <TouchableOpacity
                    onPress={() => this.handleChange(value)}
                    key={value}
                >
                    <View style={style.container}>
                        <View style={style.rowContainer}>
                            <Text>{text}</Text>
                        </View>
                        {this.renderCheckMark(value, style.checkMark)}
                    </View>
                    {this.renderRowSeparator(i, style.separator)}
                </TouchableOpacity>,
            );
        }
        return (
            <View>
                <View style={style.titleContainer}>
                    <Text style={style.title}>{label}</Text>
                    <Text style={style.asterisk}>{' *'}</Text>
                </View>

                <View style={style.items}>
                    {options}
                </View>
                {additionalTextContent}
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
        },
        rowContainer: {
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            height: 45,
        },
        items: {
            backgroundColor: theme.centerChannelBg,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
        helpText: {
            fontSize: 12,
            color: changeOpacity(theme.centerChannelColor, 0.5),
            marginHorizontal: 15,
            marginVertical: 10,
        },
        errorText: {
            fontSize: 12,
            color: theme.errorTextColor,
            marginHorizontal: 15,
            marginTop: 10,
        },
        asterisk: {
            color: theme.errorTextColor,
            fontSize: 14,
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
        separator: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            flex: 1,
            height: 1,
            marginLeft: 15,
        },
        checkMark: {
            fontSize: 12,
            color: theme.linkColor,
        },
    };
});
