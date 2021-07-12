// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {StyleSheet} from 'react-native';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';

export default class UploadRetry extends PureComponent {
    static propTypes = {
        file: PropTypes.object.isRequired,
        onPress: PropTypes.func.isRequired,
    };

    handleOnPress = () => {
        const {file, onPress} = this.props;

        onPress(file);
    };

    render() {
        return (
            <TouchableWithFeedback
                style={style.failed}
                onPress={this.handleOnPress}
                type='opacity'
            >
                <CompassIcon
                    name='refresh'
                    size={25}
                    color='#fff'
                />
            </TouchableWithFeedback>
        );
    }
}

const style = StyleSheet.create({
    failed: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        position: 'absolute',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
    },
});
