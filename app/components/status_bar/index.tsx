// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Platform, StatusBar as NativeStatusBar, StatusBarStyle} from 'react-native';
import tinyColor from 'tinycolor2';

type StatusBarProps = {
    theme: Theme;
    headerColor?: string;
};

const StatusBar = ({theme, headerColor}: StatusBarProps) => {
    const headerBarStyle = tinyColor(headerColor ?? theme.sidebarHeaderBg);
    let barStyle: StatusBarStyle = 'light-content';
    if (headerBarStyle.isLight() && Platform.OS === 'ios') {
        barStyle = 'dark-content';
    }

    return <NativeStatusBar barStyle={barStyle}/>;
};

export default StatusBar;
