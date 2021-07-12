// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {TouchableOpacity} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {Theme} from '@mm-redux/types/preferences';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

interface Props {
    handlePress: () => void;
    size?: number;
    containerSize?: number;
    theme: Theme;
    testID?: string;
    iconName: string;
}

const ClearButton = ({handlePress, iconName, size, containerSize, theme, testID}: Props) => {
    const style = getStyleSheet(theme);

    return (
        <TouchableOpacity
            onPress={preventDoubleTap(handlePress)}
            style={[style.container, {height: containerSize, width: containerSize}]}
            testID={testID}
        >
            <CompassIcon
                name={iconName}
                size={size}
                style={style.button}
            />
        </TouchableOpacity>
    );
};

ClearButton.defaultProps = {
    size: 20,
    containerSize: 40,
    iconName: 'close-circle',
};

export default ClearButton;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        button: {
            borderRadius: 1000,
            color: changeOpacity(theme.centerChannelColor, 0.52),
        },
    };
});
