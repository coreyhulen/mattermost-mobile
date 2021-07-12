// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Dimensions,
    StyleSheet,
    View,
    TouchableOpacity,
} from 'react-native';

import Config from '@assets/config.json';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';

import GeneralError from './general_error';

const {width: deviceWidth} = Dimensions.get('window');

const style = StyleSheet.create({
    closeButton: {
        height: 20,
        width: 20,
        borderRadius: 10,
        marginBottom: 5,
        borderColor: '#fff',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
    },
    closeButtonText: {
        color: '#fff',
    },
    container: {
        paddingTop: 15,
        paddingBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 75,
    },
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: deviceWidth,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 116, 92, 1)',
        zIndex: 99999,
    },
});

export default class ErrorList extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            dismissError: PropTypes.func.isRequired,
            clearErrors: PropTypes.func.isRequired,
        }).isRequired,
        errors: PropTypes.array.isRequired,
    }

    renderErrorsList() {
        const {errors} = this.props;
        if (Config.ShowErrorsList) {
            return errors.map((error, index) => (
                <GeneralError
                    key={index}
                    dismiss={() => this.props.actions.dismissError(index)}
                    error={error.error}
                />
            ));
        }
        const lastErrorIndex = errors.length - 1;
        const lastError = errors[lastErrorIndex];
        if (lastError) {
            return (
                <GeneralError
                    dismiss={() => this.props.actions.dismissError(lastErrorIndex)}
                    error={lastError.error}
                />
            );
        }
        return null;
    }

    renderDismissAll() {
        if (this.props.errors.length <= 1 || !Config.ShowErrorsList) {
            return null;
        }
        return (
            <TouchableOpacity
                style={style.closeButtonContainer}
                onPress={() => this.props.actions.clearErrors()}
            >
                <View style={style.closeButton}>
                    <CompassIcon
                        name='close'
                        size={10}
                        color='#fff'
                    />
                </View>
                <FormattedText
                    id='mobile.components.error_list.dismiss_all'
                    defaultMessage='Dismiss All'
                    style={style.closeButtonText}
                />
            </TouchableOpacity>
        );
    }

    render() {
        const wrapperStyle = [style.wrapper];
        if (!this.props.errors.length) {
            wrapperStyle.push({height: 0});
        }
        return (
            <View style={wrapperStyle}>
                <View style={style.container}>
                    {this.renderErrorsList()}
                    {this.renderDismissAll()}
                </View>
            </View>
        );
    }
}
