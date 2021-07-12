// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default class MarkdownListItem extends PureComponent {
    static propTypes = {
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
        ordered: PropTypes.bool.isRequired,
        continue: PropTypes.bool,
        index: PropTypes.number.isRequired,
        bulletWidth: PropTypes.number,
        bulletStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        level: PropTypes.number,
    };

    render() {
        let bullet;
        if (this.props.continue) {
            bullet = '';
        } else if (this.props.ordered) {
            bullet = this.props.index + '.';
        } else if (this.props.level % 2 === 0) {
            bullet = '◦';
        } else {
            bullet = '•';
        }

        return (
            <View style={style.container}>
                <View style={[{width: this.props.bulletWidth}, style.bullet]}>
                    <Text style={this.props.bulletStyle}>
                        {bullet}
                    </Text>
                </View>
                <View style={style.contents}>
                    {this.props.children}
                </View>
            </View>
        );
    }
}

const style = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bullet: {
        alignItems: 'flex-end',
        marginRight: 5,
    },
    contents: {
        flex: 1,
    },
});
