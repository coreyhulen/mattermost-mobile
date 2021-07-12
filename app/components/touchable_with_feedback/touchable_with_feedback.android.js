// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable new-cap */

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {TouchableNativeFeedback, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';

export default class TouchableWithFeedbackAndroid extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
        underlayColor: PropTypes.string,
        type: PropTypes.oneOf(['native', 'opacity', 'none']),
    };

    static defaultProps = {
        type: 'native',
    };

    render() {
        const {testID, children, underlayColor, type, ...props} = this.props;

        switch (type) {
        case 'native':
            return (
                <TouchableNativeFeedback
                    testID={testID}
                    {...props}
                    background={TouchableNativeFeedback.Ripple(underlayColor || '#000', false)}
                >
                    <View>
                        {children}
                    </View>
                </TouchableNativeFeedback>
            );
        case 'opacity':
            return (
                <TouchableOpacity
                    testID={testID}
                    {...props}
                >
                    {children}
                </TouchableOpacity>
            );
        case 'none':
            return (
                <TouchableWithoutFeedback
                    testID={testID}
                    {...props}
                >
                    {children}
                </TouchableWithoutFeedback>
            );
        }

        return null;
    }
}
