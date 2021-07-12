// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Text, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class NoResults extends PureComponent {
    static propTypes = {
        description: PropTypes.string,
        iconName: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
        title: PropTypes.string.isRequired,
    };

    render() {
        const {
            description,
            iconName,
            theme,
            title,
        } = this.props;
        const style = getStyleFromTheme(theme);

        return (
            <View style={style.container}>
                <View style={style.iconContainer}>
                    <CompassIcon
                        size={72}
                        name={iconName}
                        style={style.icon}
                    />
                </View>
                <Text style={style.title}>{title}</Text>
                {description &&
                <Text style={style.description}>{description}</Text>
                }
            </View>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            marginLeft: 32,
            marginRight: 32,
            marginBottom: 40,
        },
        title: {
            color: changeOpacity(theme.centerChannelColor, 1),
            fontSize: 20,
            fontWeight: '600',
            marginVertical: 15,
        },
        description: {
            color: changeOpacity(theme.centerChannelColor, 1),
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 24,
        },
        icon: {
            color: theme.buttonBg,
        },
        iconContainer: {
            height: 120,
            width: 120,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 60,
            marginBottom: 4,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
    };
});
