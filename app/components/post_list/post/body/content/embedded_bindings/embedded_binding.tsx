// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import {copyAndFillBindings} from '@utils/apps';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import EmbedText from './embed_text';
import EmbedTitle from './embed_title';
import EmbedSubBindings from './embedded_sub_bindings';

import type {AppBinding} from '@mm-redux/types/apps';
import type {Theme} from '@mm-redux/types/preferences';

type Props = {
    embed: AppBinding;
    postId: string;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme:Theme) => {
    return {
        container: {
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderLeftColor: changeOpacity(theme.linkColor, 0.6),
            borderRightColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderBottomWidth: 1,
            borderLeftWidth: 3,
            borderRightWidth: 1,
            borderTopWidth: 1,
            marginTop: 5,
            padding: 12,
        },
    };
});

const EmbeddedBinding = ({embed, postId, theme}: Props) => {
    const style = getStyleSheet(theme);

    const bindings = copyAndFillBindings(embed)?.bindings;

    return (
        <>
            <View style={style.container}>
                {Boolean(embed.label) &&
                <EmbedTitle
                    theme={theme}
                    value={embed.label}
                />
                }
                {Boolean(embed.description) &&
                <EmbedText
                    value={embed.description!}
                    theme={theme}
                />
                }
                {Boolean(bindings?.length) &&
                <EmbedSubBindings
                    bindings={bindings!}
                    postId={postId}
                    theme={theme}
                />
                }
            </View>
        </>
    );
};

export default EmbeddedBinding;
