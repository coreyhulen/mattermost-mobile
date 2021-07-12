// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {
    Platform,
    View,
} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class PostListRetry extends PureComponent {
    static propTypes = {
        retry: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
    };

    render() {
        const {retry, theme} = this.props;
        const style = getStyleSheet(theme);

        return (
            <View style={style.container}>
                <TouchableWithFeedback
                    onPress={retry}
                    style={style.buttonContainer}
                    type={'opacity'}
                >
                    <View style={style.buttonWrapper}>
                        <CompassIcon
                            name='refresh'
                            size={50}
                            style={style.icon}
                        />
                    </View>
                    <FormattedText
                        id='mobile.post.retry'
                        defaultMessage='Refresh'
                        style={style.text}
                    />
                </TouchableWithFeedback>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        buttonContainer: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        buttonWrapper: {
            height: 60,
            width: 60,
            borderRadius: 30,
            backgroundColor: '#ddd',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        icon: {
            color: theme.linkColor,
            ...Platform.select({
                ios: {
                    marginTop: 5,
                },
            }),
        },
        text: {
            marginTop: 15,
            color: theme.linkColor,
        },
    };
});
