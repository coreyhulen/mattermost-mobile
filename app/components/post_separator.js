// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {View} from 'react-native';

import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const SEPARATOR_HEIGHT = 3;

export default class PostSeparator extends PureComponent {
    static propTypes = {
        theme: PropTypes.object.isRequired,
    };

    render() {
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        return (
            <View style={[style.separatorContainer, style.postsSeparator]}>
                <View style={style.separator}/>
            </View>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        separatorContainer: {
            justifyContent: 'center',
            flex: 1,
            height: SEPARATOR_HEIGHT,
        },
        postsSeparator: {
            height: 15,
        },
        separator: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
        },
    };
});
