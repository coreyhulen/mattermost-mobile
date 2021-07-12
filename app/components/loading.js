// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
    ViewPropTypes,
} from 'react-native';

export default class Loading extends PureComponent {
    static propTypes = {
        size: PropTypes.string,
        color: PropTypes.string,
        style: ViewPropTypes.style,
    };

    static defaultProps = {
        size: 'large',
        color: 'grey',
        style: {},
    };

    render() {
        return (
            <View style={styles.container}>
                <ActivityIndicator
                    style={[styles.loading, this.props.style]}
                    animating={true}
                    size={this.props.size}
                    color={this.props.color}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loading: {
        marginLeft: 3,
    },
});
