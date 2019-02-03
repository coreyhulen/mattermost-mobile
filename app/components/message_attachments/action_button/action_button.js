// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {Text} from 'react-native';
import PropTypes from 'prop-types';
import Button from 'react-native-button';

import {preventDoubleTap} from 'app/utils/tap';
import {makeStyleSheetFromTheme} from 'app/utils/theme';

export default class ActionButton extends PureComponent {
    state= {isDisabled: false};
    static propTypes = {
        actions: PropTypes.shape({
            doPostAction: PropTypes.func.isRequired,
        }).isRequired,
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        postId: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
    };

    handleActionPress = preventDoubleTap(() => {
        const {actions, id, postId} = this.props;
        this.handleDisableButtonState();
        actions.doPostAction(postId, id);
    });

    handleDisableButtonState = () => {
        this.setState({isDisabled: true});
        setTimeout(() => this.setState({isDisabled: false}), 4000);
    }

    render() {
        const {name, theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <Button
                containerStyle={style.button}
                onPress={this.handleActionPress}
                disabled={this.state.isDisabled}
            >
                <Text style={style.text}>{name}</Text>
            </Button>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        button: {
            borderRadius: 2,
            backgroundColor: theme.buttonBg,
            alignItems: 'center',
            marginBottom: 2,
            marginRight: 5,
            marginTop: 10,
            paddingHorizontal: 10,
            paddingVertical: 7,
        },
        text: {
            color: theme.buttonColor,
            fontSize: 12,
            fontWeight: '600',
        },
    };
});
