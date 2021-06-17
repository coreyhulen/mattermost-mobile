// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import UnreadIndicatorBase, {getStyleSheet} from './unread_indicator.base';

export default class UnreadIndicatorAndroid extends UnreadIndicatorBase {
    render() {
        const {visible, theme} = this.props;
        const style = getStyleSheet(theme);

        if (!visible) {
            return null;
        }

        return (
            <View style={style.container}>
                {this.renderContent()}
            </View>
        );
    }
}
