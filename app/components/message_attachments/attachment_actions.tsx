// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import ActionMenu from './action_menu';
import ActionButton from './action_button';
import {PostAction} from '@mm-redux/types/integration_actions';

type Props = {
    actions?: PostAction[];
    postId: string;
}
export default function AttachmentActions(props: Props) {
    const {
        actions,
        postId,
    } = props;

    if (!actions?.length) {
        return null;
    }

    const content = [] as JSX.Element[];

    actions.forEach((action) => {
        if (!action.id || !action.name) {
            return;
        }

        switch (action.type) {
        case 'select':
            content.push(
                <ActionMenu
                    key={action.id}
                    id={action.id}
                    name={action.name}
                    dataSource={action.data_source}
                    defaultOption={action.default_option}
                    options={action.options}
                    postId={postId}
                    disabled={action.disabled}
                />,
            );
            break;
        case 'button':
        default:
            content.push(
                <ActionButton
                    key={action.id}
                    id={action.id}
                    cookie={action.cookie}
                    name={action.name}
                    postId={postId}
                    disabled={action.disabled}
                    buttonColor={action.style}
                />,
            );
            break;
        }
    });

    return content.length ? (<>{content}</>) : null;
}
