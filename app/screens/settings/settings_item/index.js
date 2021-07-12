// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {changeOpacity} from '@utils/theme';

import getStyleSheet from './style';

export default class SettingsItem extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        defaultMessage: PropTypes.string.isRequired,
        messageValues: PropTypes.object,
        i18nId: PropTypes.string,
        iconName: PropTypes.string,
        isLink: PropTypes.bool,
        isDestructor: PropTypes.bool,
        centered: PropTypes.bool,
        onPress: PropTypes.func,
        rightComponent: PropTypes.node,
        separator: PropTypes.bool,
        showArrow: PropTypes.bool,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        isDestructor: false,
        separator: true,
        isLink: false,
    };

    renderText = () => {
        const {
            centered,
            defaultMessage,
            messageValues,
            i18nId,
            isDestructor,
            isLink,
            theme,
        } = this.props;
        const style = getStyleSheet(theme);

        const textStyle = [style.label];

        if (isDestructor) {
            textStyle.push(style.destructor);
        }

        if (centered) {
            textStyle.push(style.centerLabel);
        }

        if (isLink) {
            textStyle.push(style.linkContainer);
        }

        if (!i18nId) {
            return <Text style={textStyle}>{defaultMessage}</Text>;
        }

        return (
            <FormattedText
                values={messageValues}
                id={i18nId}
                defaultMessage={defaultMessage}
                style={textStyle}
            />
        );
    };

    render() {
        const {
            testID,
            iconName,
            onPress,
            rightComponent,
            separator,
            showArrow,
            theme,
            isDestructor,
        } = this.props;
        const style = getStyleSheet(theme);

        let divider;
        if (separator) {
            divider = (
                <View style={style.dividerContainer}>
                    <View style={style.divider}/>
                </View>
            );
        }

        let icon;
        if (iconName) {
            const iconStyle = [style.icon, {color: changeOpacity(theme.centerChannelColor, 0.64)}];
            if (isDestructor) {
                iconStyle.push(style.destructor);
            }
            icon = (
                <CompassIcon
                    name={iconName}
                    style={iconStyle}
                />
            );
        }

        let additionalComponent;
        if (showArrow) {
            additionalComponent = (
                <CompassIcon
                    name='chevron-right'
                    style={style.arrow}
                />
            );
        } else if (rightComponent) {
            additionalComponent = rightComponent;
        }

        return (
            <TouchableOpacity
                testID={testID}
                onPress={onPress}
            >
                <View style={style.container}>
                    {icon &&
                    <View style={style.iconContainer}>
                        {icon}
                    </View>
                    }
                    <View style={style.wrapper}>
                        <View style={style.labelContainer}>
                            {this.renderText()}
                            {Boolean(additionalComponent) &&
                            <View style={style.arrowContainer}>
                                {additionalComponent}
                            </View>
                            }
                        </View>
                    </View>
                </View>
                {divider}
            </TouchableOpacity>
        );
    }
}
