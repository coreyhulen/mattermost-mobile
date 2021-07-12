// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {View} from 'react-native';

import Markdown from '@components/markdown';
import {getMarkdownTextStyles, getMarkdownBlockStyles} from '@utils/markdown';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class DialogIntroductionText extends PureComponent {
    static propTypes = {
        value: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
    };

    render() {
        const {
            value,
            theme,
        } = this.props;

        if (value) {
            const style = getStyleFromTheme(theme);
            const blockStyles = getMarkdownBlockStyles(theme);
            const textStyles = getMarkdownTextStyles(theme);

            return (
                <View style={style.introductionTextView}>
                    <Markdown
                        baseTextStyle={style.introductionText}
                        disableGallery={true}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        value={value}
                        disableHashtags={true}
                        disableAtMentions={true}
                        disableChannelLink={true}
                    />
                </View>
            );
        }

        return null;
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        introductionTextView: {
            marginHorizontal: 15,
        },
        introductionText: {
            color: theme.centerChannelColor,
        },
    };
});
