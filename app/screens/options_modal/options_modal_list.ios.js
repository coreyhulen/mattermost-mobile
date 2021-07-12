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
        title: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
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
        }, 100);
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
                        style={[style.optionText, item.textStyle, (!item.icon && {textAlign: 'center'})]}
                        {...item.text}
                    />
                );
            } else {
                textComponent = <Text style={[style.optionText, item.textStyle, (!item.icon && {textAlign: 'center'})]}>{item.text}</Text>;
            }

            return (
                <View
                    key={index}
                    style={[(index < items.length - 1 && style.optionBorder)]}
                >
                    <TouchableOpacity
                        onPress={() => this.handleItemPress(item.action)}
                        style={style.option}
                    >
                        {textComponent}
                        {item.icon &&
                        <CompassIcon
                            name={item.icon}
                            size={24}
                            style={optionIconStyle}
                        />
                        }
                    </TouchableOpacity>
                </View>
            );
        });

        let title;
        let titleComponent;
        if (this.props.title) {
            if (this.props.title.hasOwnProperty('id')) {
                titleComponent = (
                    <FormattedText
                        style={style.optionTitleText}
                        {...this.props.title}
                    />
                );
            } else {
                titleComponent = <Text style={style.optionTitleText}>{this.props.title}</Text>;
            }

            title = (
                <View
                    key={items.length}
                    style={[style.option, style.optionBorder]}
                >
                    {titleComponent}
                </View>
            );
        }

        return [
            title,
            ...options,
        ];
    };

    render() {
        return (
            <View style={style.container}>
                <View style={style.wrapper}>
                    <View style={[style.optionContainer]}>
                        {this.renderOptions()}
                    </View>
                    <View style={style.optionContainer}>
                        <TouchableOpacity
                            onPress={this.handleCancelPress}
                            style={style.option}
                        >
                            <FormattedText
                                id='channel_modal.cancel'
                                defaultMessage='Cancel'
                                style={style.optionCancelText}
                            />
                        </TouchableOpacity>
                    </View>
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
        width: '100%',
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    optionCancelText: {
        color: '#CC3239',
        flex: 1,
        fontSize: 20,
        textAlign: 'center',
    },
    optionContainer: {
        alignSelf: 'stretch',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 20,
        marginHorizontal: 20,
    },
    optionIcon: {
        color: '#4E8ACC',
    },
    optionText: {
        color: '#4E8ACC',
        flex: 1,
        fontSize: 20,
    },
    optionTitleText: {
        color: '#7f8180',
        flex: 1,
        textAlign: 'center',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    wrapper: {
        maxWidth: 450,
        width: '100%',
    },
});
