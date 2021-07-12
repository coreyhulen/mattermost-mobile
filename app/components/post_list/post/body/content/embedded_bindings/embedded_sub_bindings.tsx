// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import ButtonBinding from './button_binding';
import BindingMenu from './menu_binding';

import type {AppBinding} from '@mm-redux/types/apps';
import type {Theme} from '@mm-redux/types/preferences';

type Props = {
    bindings: AppBinding[];
    postId: string;
    theme: Theme;
}

const EmbeddedSubBindings = ({bindings, postId, theme}: Props) => {
    const content = [] as React.ReactNode[];

    bindings.forEach((binding) => {
        if (!binding.app_id || !binding.call) {
            return;
        }

        if (binding.bindings?.length) {
            content.push(
                <BindingMenu
                    key={binding.location}
                    binding={binding}
                    postId={postId}
                />,
            );
            return;
        }

        content.push(
            <ButtonBinding
                key={binding.location}
                binding={binding}
                postId={postId}
                theme={theme}
            />,
        );
    });

    return content.length ? (<>{content}</>) : null;
};

export default EmbeddedSubBindings;
