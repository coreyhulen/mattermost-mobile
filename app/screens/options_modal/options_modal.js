// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import {dismissModal} from '@actions/navigation';
import {NavigationTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {emptyFunction} from '@utils/general';

import OptionsModalList from './options_modal_list';

const {View: AnimatedView} = Animated;
const DURATION = 200;

export default class OptionsModal extends PureComponent {
    static propTypes = {
        items: PropTypes.array.isRequired,
        deviceHeight: PropTypes.number.isRequired,
        deviceWidth: PropTypes.number.isRequired,
        onCancelPress: PropTypes.func,
        title: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
    };

    static defaultProps = {
        onCancelPress: emptyFunction,
    };

    constructor(props) {
        super(props);

        this.state = {
            top: new Animated.Value(props.deviceHeight),
        };
    }

    componentDidMount() {
        EventEmitter.on(NavigationTypes.NAVIGATION_CLOSE_MODAL, this.close);
        Animated.timing(this.state.top, {
            toValue: 0,
            duration: DURATION,
            useNativeDriver: false,
        }).start();
    }

    componentWillUnmount() {
        EventEmitter.off(NavigationTypes.NAVIGATION_CLOSE_MODAL, this.close);
    }

    handleCancel = () => {
        this.props.onCancelPress();
        this.close();
    };

    close = () => {
        Animated.timing(this.state.top, {
            toValue: this.props.deviceHeight,
            duration: DURATION,
            useNativeDriver: false,
        }).start(() => {
            dismissModal();
        });
    };

    onItemPress = () => {
        if (Platform.OS === 'android') {
            this.close();
        } else {
            dismissModal();
        }
    };

    render() {
        const {
            items,
            title,
        } = this.props;

        return (
            <TouchableWithoutFeedback onPress={this.handleCancel}>
                <View style={style.wrapper}>
                    <AnimatedView style={{height: this.props.deviceHeight, left: 0, top: this.state.top, width: this.props.deviceWidth}}>
                        <OptionsModalList
                            items={items}
                            onCancelPress={this.handleCancel}
                            onItemPress={this.onItemPress}
                            title={title}
                        />
                    </AnimatedView>
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const style = StyleSheet.create({
    wrapper: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
    },
});
