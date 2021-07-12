// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {View} from 'react-native';

import RadioButton from './radio_button';

export default class RadioButtonGroup extends PureComponent {
    static propTypes = {
        options: PropTypes.array,
        name: PropTypes.string.isRequired,
        onSelect: PropTypes.func,
    };

    static defaultProps = {
        options: [],
    };

    onChange = (value) => {
        const {onSelect} = this.props;
        if (onSelect) {
            onSelect(value);
        }
    };

    render = () => {
        let options;
        if (this.props.options.length) {
            options = this.props.options.map((option) => {
                const {
                    testID,
                    value,
                    label,
                    disabled,
                    ...other
                } = option;

                const {name} = this.props;

                return (
                    <RadioButton
                        testID={testID}
                        {...other}
                        name={name}
                        key={`${name}-${value}`}
                        value={value}
                        label={label}
                        disabled={disabled}
                        onCheck={this.onChange}
                        checked={option.checked}
                    />
                );
            });
        }

        return (
            <View>
                {options}
            </View>
        );
    };
}
