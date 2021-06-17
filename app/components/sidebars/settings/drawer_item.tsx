// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {TouchableOpacity, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class DrawerItem extends PureComponent {
	public props: any;
	public testID: any;
	public centered: any;
	public defaultMessage: any;
	public i18nId: any;
	public iconName: any;
	public isDestructor: any;
	public labelComponent: any;
	public leftComponent: any;
	public onPress: any;
	public separator: any;
	public theme: any;
    static propTypes = {
        testID: PropTypes.string,
        centered: PropTypes.bool,
        defaultMessage: PropTypes.string,
        i18nId: PropTypes.string,
        iconName: PropTypes.string,
        isDestructor: PropTypes.bool,
        labelComponent: PropTypes.node,
        leftComponent: PropTypes.node,
        onPress: PropTypes.func,
        separator: PropTypes.bool,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        defaultMessage: '',
        isDestructor: false,
        separator: true,
    };

    render() {
        const {
            testID,
            centered,
            defaultMessage,
            i18nId,
            iconName,
            isDestructor,
            labelComponent,
            leftComponent,
            onPress,
            separator,
            theme,
        } = this.props;
        const style = getStyleSheet(theme);

        const destructor = {};
        if (isDestructor) {
            destructor.color = theme.errorTextColor;
        }

        let divider;
        if (separator) {
            divider = (<View style={style.divider}/>);
        }

        let icon;
        if (leftComponent) {
            icon = leftComponent;
        } else if (iconName) {
            icon = (
                <CompassIcon
                    name={iconName}
                    style={[style.icon, destructor]}
                />
            );
        }

        let label;
        if (labelComponent) {
            label = labelComponent;
        } else if (i18nId) {
            label = (
                <FormattedText
                    id={i18nId}
                    defaultMessage={defaultMessage}
                    style={[style.label, destructor, centered ? style.centerLabel : {}]}
                />
            );
        }

        return (
            <TouchableOpacity
                testID={testID}
                onPress={onPress}
            >
                <View style={style.container}>
                    {icon && (
                        <View style={style.iconContainer}>
                            {icon}
                        </View>
                    )}
                    <View style={style.wrapper}>
                        <View style={style.labelContainer}>
                            {label}
                        </View>
                        {divider}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            backgroundColor: theme.centerChannelBg,
            flexDirection: 'row',
            minHeight: 50,
        },
        iconContainer: {
            width: 45,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 5,
        },
        icon: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            fontSize: 24,
        },
        wrapper: {
            flex: 1,
        },
        labelContainer: {
            flex: 1,
            justifyContent: 'center',
            paddingTop: 14,
            paddingBottom: 14,
        },
        centerLabel: {
            textAlign: 'center',
            textAlignVertical: 'center',
        },
        label: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 17,
            textAlignVertical: 'center',
            includeFontPadding: false,
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            height: 1,
        },
    };
});
