// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {
    Image,
    Switch,
    Text,
    TouchableHighlight,
    View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {isValidUrl} from '@utils/url';

function createTouchableComponent(children, action) {
    return (
        <TouchableHighlight onPress={action}>
            {children}
        </TouchableHighlight>
    );
}

function channelInfoRow(props) {
    const {testID, action, defaultMessage, detail, icon, iconColor, image, imageTintColor, rightArrow, textColor, textId, togglable, theme, shouldRender} = props;

    if (!shouldRender) {
        return null;
    }

    const style = getStyleSheet(theme);

    let iconElement = null;
    if (image == null) {
        iconElement = (
            <CompassIcon
                name={icon}
                size={24}
                color={iconColor || changeOpacity(theme.centerChannelColor, 0.64)}
            />
        );
    } else if (image.uri) {
        iconElement = isValidUrl(image.uri) && (
            <FastImage
                source={image}
                style={{width: 24, height: 24}}
            />
        );
    } else {
        iconElement = (
            <Image
                source={image}
                style={{width: 15, height: 15, tintColor: imageTintColor || changeOpacity(theme.centerChannelColor, 0.5)}}
            />
        );
    }

    let actionElement = null;
    if (togglable) {
        const switchTestID = `${testID}.switch.${detail}`;
        actionElement = (
            <Switch
                testID={switchTestID}
                onValueChange={action}
                value={detail}
            />
        );
    } else if (rightArrow) {
        actionElement = (
            <CompassIcon
                name='chevron-right'
                size={24}
                style={style.rightIcon}
            />
        );
    }

    const RowComponent = (
        <View
            testID={testID}
            style={style.container}
        >
            {iconElement}
            <FormattedText
                style={[style.label, {color: textColor || theme.centerChannelColor}]}
                id={textId}
                defaultMessage={defaultMessage}
            />
            <Text style={style.detail}>{detail}</Text>
            {actionElement}
        </View>
    );

    if (togglable) {
        return RowComponent;
    }

    return createTouchableComponent(RowComponent, action);
}

channelInfoRow.propTypes = {
    testID: PropTypes.string,
    action: PropTypes.func.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    detail: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool,
    ]),
    icon: PropTypes.string,
    iconColor: PropTypes.string,
    image: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.object,
    ]),
    imageTintColor: PropTypes.string,
    isLandscape: PropTypes.bool,
    rightArrow: PropTypes.bool,
    textId: PropTypes.string.isRequired,
    togglable: PropTypes.bool,
    textColor: PropTypes.string,
    theme: PropTypes.object.isRequired,
};

channelInfoRow.defaultProps = {
    rightArrow: true,
    togglable: false,
    shouldRender: true,
};

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            backgroundColor: theme.centerChannelBg,
            paddingHorizontal: 15,
            flexDirection: 'row',
            alignItems: 'center',
        },
        detail: {
            marginHorizontal: 7,
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 15,
        },
        label: {
            flex: 1,
            marginLeft: 15,
            fontSize: 15,
            paddingVertical: 15,
        },
        rightIcon: {
            color: changeOpacity(theme.centerChannelColor, 0.32),
            marginRight: -4,
        },
    };
});

export default channelInfoRow;
