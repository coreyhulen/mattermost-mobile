// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {PanResponder, TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';

export default class TouchableWithFeedbackIOS extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
        cancelTouchOnPanning: PropTypes.bool,
        type: PropTypes.oneOf(['native', 'opacity', 'none']),
    };

    static defaultProps = {
        type: 'native',
    };

    constructor(props) {
        super(props);

        this.panResponder = PanResponder.create({
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                return this.props.cancelTouchOnPanning && (gestureState.dx >= 5 || gestureState.dy >= 5 || gestureState.vx > 5);
            },
        });
    }

    render() {
        const {testID, children, type, ...props} = this.props;

        switch (type) {
        case 'native':
            return (
                <View
                    testID={testID}
                    {...this.panResponder.panHandlers}
                >
                    <TouchableHighlight
                        {...props}
                    >
                        {children}
                    </TouchableHighlight>
                </View>
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
