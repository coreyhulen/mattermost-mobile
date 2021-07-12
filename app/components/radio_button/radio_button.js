// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Animated, Text, View} from 'react-native';
import {connect} from 'react-redux';

import CompassIcon from '@components/compass_icon';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {makeStyleSheetFromTheme} from '@utils/theme';

const DISABLED_OPACITY = 0.26;
const DEFAULT_OPACITY = 1;

class RadioButton extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        label: PropTypes.string,
        theme: PropTypes.object,
        value: PropTypes.string,
        checked: PropTypes.bool,
        disabled: PropTypes.bool,
        onCheck: PropTypes.func,
    };

    constructor(props) {
        super(props);
        this.state = {
            scaleValue: new Animated.Value(0),
            opacityValue: new Animated.Value(0),
        };

        this.responder = {
            onStartShouldSetResponder: () => true,
            onResponderGrant: this.highlight,
            onResponderRelease: this.handleResponderEnd,
            onResponderTerminate: this.unHighlight,
        };
    }

    highlight = () => {
        Animated.timing(
            this.state.scaleValue,
            {
                toValue: 1,
                duration: 150,
            },
        ).start();
        Animated.timing(
            this.state.opacityValue,
            {
                toValue: 0.1,
                duration: 100,
            },
        ).start();
    };

    unHighlight = () => {
        Animated.timing(
            this.state.scaleValue,
            {
                toValue: 0.001,
                duration: 1500,
            },
        ).start();
        Animated.timing(
            this.state.opacityValue,
            {
                toValue: 0,
            },
        ).start();
    };

    handleResponderEnd = () => {
        const {checked, disabled, onCheck, value} = this.props;

        if (!checked && !disabled && onCheck) {
            onCheck(value);
        }

        this.unHighlight();
    };

    render() {
        const {scaleValue, opacityValue} = this.state;
        const {testID, theme, checked, disabled} = this.props;
        const styles = getStyleSheet(theme);

        const color = checked ? theme.buttonBg : theme.centerChannelColor;
        const opacity = disabled ? DISABLED_OPACITY : DEFAULT_OPACITY;

        return (
            <View
                testID={testID}
                style={styles.container}
                {...this.responder}
            >
                <Animated.View
                    style={[
                        styles.ripple,
                        {
                            transform: [
                                {scale: scaleValue},
                            ],
                            opacity: opacityValue,
                            backgroundColor: color,
                        },
                    ]}
                />
                <CompassIcon
                    name={checked ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24}
                    color={color}
                    style={{
                        opacity,
                    }}
                />
                <View style={styles.labelContainer}>
                    <Text
                        style={[
                            styles.label,
                            {opacity: disabled ? DISABLED_OPACITY : DEFAULT_OPACITY},
                        ]}
                    >
                        {this.props.label}
                    </Text>
                </View>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.centerChannelBg,
            marginBottom: 15,
        },
        ripple: {
            position: 'absolute',
            width: 48,
            height: 48,
            borderRadius: 56,
            top: 6,
        },
        labelContainer: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
        },
        label: {
            color: theme.centerChannelColor,
            flex: 1,
            fontSize: 17,
            marginLeft: 15,
            textAlignVertical: 'center',
            includeFontPadding: false,
        },
    };
});

function mapStateToProps(state, ownProps) {
    return {
        ...ownProps,
        theme: getTheme(state),
    };
}

export default connect(mapStateToProps)(RadioButton);
