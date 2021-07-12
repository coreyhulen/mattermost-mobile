// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {View} from 'react-native';

import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class MarkdownTableRow extends React.PureComponent {
    static propTypes = {
        children: PropTypes.node,
        isLastRow: PropTypes.bool,
        isFirstRow: PropTypes.bool,
        theme: PropTypes.object.isRequired,
    };

    render() {
        const style = getStyleSheet(this.props.theme);

        const rowStyle = [style.row];
        if (!this.props.isLastRow) {
            rowStyle.push(style.rowBottomBorder);
        }

        if (this.props.isFirstRow) {
            rowStyle.push(style.rowTopBackground);
        }

        // Add an extra prop to the last cell so that it knows not to render a right border since the container
        // will handle that
        const children = React.Children.toArray(this.props.children);
        children[children.length - 1] = React.cloneElement(children[children.length - 1], {
            isLastCell: true,
        });

        return <View style={rowStyle}>{children}</View>;
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        row: {
            flex: 1,
            flexDirection: 'row',
        },
        rowTopBackground: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
        rowBottomBorder: {
            borderColor: changeOpacity(theme.centerChannelColor, 0.2),
            borderBottomWidth: 1,
        },
    };
});
