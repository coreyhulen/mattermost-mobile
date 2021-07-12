// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import EmbeddedBinding from './embedded_binding';

import type {AppBinding} from '@mm-redux/types/apps';
import type {Theme} from '@mm-redux/types/preferences';

type Props = {
    embeds: AppBinding[];
    postId: string;
    theme: Theme;
}

const EmbeddedBindings = ({embeds, postId, theme}: Props) => {
    const content = [] as React.ReactNode[];

    embeds.forEach((embed, i) => {
        content.push(
            <EmbeddedBinding
                embed={embed}
                key={'binding_' + i.toString()}
                postId={postId}
                theme={theme}
            />,
        );
    });

    return (
        <View style={{flex: 1, flexDirection: 'column'}}>
            {content}
        </View>
    );
};

export default EmbeddedBindings;
