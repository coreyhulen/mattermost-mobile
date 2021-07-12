// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {ICON_SIZE} from '@constants/post_draft';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class InputQuickAction extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        disabled: PropTypes.bool,
        inputType: PropTypes.oneOf(['at', 'slash']).isRequired,
        onTextChange: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
        value: PropTypes.string,
    };

    static defaultProps = {
        value: '',
    };

    constructor(props) {
        super(props);

        this.value = '';
    }

    onPress = () => {
        const {inputType, onTextChange, value} = this.props;

        let newValue = '/';
        if (inputType === 'at') {
            newValue = `${value}@`;
        }

        onTextChange(newValue);
    }

    renderInput = () => {
        const {disabled, inputType, theme} = this.props;
        const name = inputType === 'at' ? inputType : 'slash-forward-box-outline';
        const color = disabled ?
            changeOpacity(theme.centerChannelColor, 0.16) :
            changeOpacity(theme.centerChannelColor, 0.64);

        return (
            <CompassIcon
                name={name}
                color={color}
                size={ICON_SIZE}
            />
        );
    }

    render() {
        const {testID, disabled, theme} = this.props;
        const actionTestID = disabled ?
            `${testID}.disabled` :
            testID;
        const style = getStyleSheet(theme);

        return (
            <TouchableWithFeedback
                testID={actionTestID}
                disabled={disabled}
                onPress={this.onPress}
                style={style.icon}
                type={'opacity'}
            >
                {this.renderInput()}
            </TouchableWithFeedback>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        disabled: {
            tintColor: changeOpacity(theme.centerChannelColor, 0.16),
        },
        icon: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
        },
    };
});
