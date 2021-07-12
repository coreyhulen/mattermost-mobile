// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Text} from 'react-native';

import FormattedText from '@components/formatted_text';
import {makeStyleSheetFromTheme} from '@utils/theme';

import {GlobalStyles} from 'app/styles';

export default class ErrorText extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        theme: PropTypes.object.isRequired,
    };

    render() {
        const {testID, error, textStyle, theme} = this.props;
        if (!error) {
            return null;
        }

        const style = getStyleSheet(theme);

        const {intl} = error;
        if (intl) {
            return (
                <FormattedText
                    testID={testID}
                    id={intl.id}
                    defaultMessage={intl.defaultMessage}
                    values={intl.values}
                    style={[GlobalStyles.errorLabel, style.errorLabel, textStyle]}
                />
            );
        }

        return (
            <Text
                testID={testID}
                style={[GlobalStyles.errorLabel, style.errorLabel, textStyle]}
            >
                {error.message || error}
            </Text>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        errorLabel: {
            color: (theme.errorTextColor || '#DA4A4A'),
        },
    };
});
