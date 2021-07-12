// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {View} from 'react-native';

import Markdown from '@components/markdown';
import {Theme} from '@mm-redux/types/preferences';
import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {makeStyleSheetFromTheme} from '@utils/theme';

type Props = {
    value: string;
    theme: Theme;
}

export default class DialogIntroductionText extends PureComponent<Props> {
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

const getStyleFromTheme = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        introductionTextView: {
            marginHorizontal: 15,
        },
        introductionText: {
            color: theme.centerChannelColor,
        },
    };
});
