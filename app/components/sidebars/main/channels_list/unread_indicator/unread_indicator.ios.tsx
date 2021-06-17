// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Fade from 'app/components/fade';

import UnreadIndicatorBase, {getStyleSheet} from './unread_indicator.base';

export default class UnreadIndicatorIOS extends UnreadIndicatorBase {
    render() {
        const {visible, theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <Fade
                visible={visible}
                style={style.container}
                duration={150}
                disableScale={true}
            >
                {this.renderContent()}
            </Fade>
        );
    }
}
