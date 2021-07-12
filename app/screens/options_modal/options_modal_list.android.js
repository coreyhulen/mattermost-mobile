// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {preventDoubleTap} from '@utils/tap';

export default class OptionsModalList extends PureComponent {
    static propTypes = {
        items: PropTypes.array.isRequired,
        onCancelPress: PropTypes.func,
        onItemPress: PropTypes.func,
    };

    static defaultProps = {
        items: [],
    };

    handleCancelPress = preventDoubleTap(() => {
        if (this.props.onCancelPress) {
            this.props.onCancelPress();
        }
    });

    handleItemPress = preventDoubleTap((action) => {
        this.props.onItemPress();
        setTimeout(() => {
            if (typeof action === 'function') {
                action();
            }
        }, 250);
    });

    renderOptions = () => {
        const {items} = this.props;

        const options = items.map((item, index) => {
            let textComponent;
            let optionIconStyle = style.optionIcon;
            if (typeof item.iconStyle !== 'undefined') {
                optionIconStyle = item.iconStyle;
            }

            if (item.text.hasOwnProperty('id')) {
                textComponent = (
                    <FormattedText
                        style={[style.optionText, item.textStyle]}
                        {...item.text}
                    />
                );
            } else {
                textComponent = <Text style={[style.optionText, item.textStyle]}>{item.text}</Text>;
            }

            return (
                <View
                    key={index}
                    style={style.optionBorder}
                >
                    <TouchableOpacity
                        onPress={() => this.handleItemPress(item.action)}
                        style={style.option}
                    >
                        {textComponent}
                        {item.icon &&
                        <CompassIcon
                            name={item.icon}
                            size={18}
                            style={optionIconStyle}
                        />
                        }
                    </TouchableOpacity>
                </View>
            );
        });

        const cancel = (
            <TouchableOpacity
                key={items.length}
                onPress={this.handleCancelPress}
                style={style.option}
            >
                <FormattedText
                    id='channel_modal.cancel'
                    defaultMessage='Cancel'
                    style={style.optionText}
                />
            </TouchableOpacity>
        );

        return [
            ...options,
            cancel,
        ];
    };

    render() {
        return (
            <View style={style.wrapper}>
                <View style={style.optionContainer}>
                    {this.renderOptions()}
                </View>
            </View>
        );
    }
}

const style = StyleSheet.create({
    option: {
        alignSelf: 'stretch',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    optionContainer: {
        alignSelf: 'stretch',
        backgroundColor: 'white',
        borderRadius: 2,
        marginHorizontal: 30,
    },
    optionIcon: {
        color: '#7f8180',
    },
    optionText: {
        color: '#000',
        flex: 1,
        fontSize: 16,
    },
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
