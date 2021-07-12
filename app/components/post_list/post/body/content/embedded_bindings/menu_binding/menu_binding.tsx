// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {intlShape, injectIntl} from 'react-intl';

import AutocompleteSelector from '@components/autocomplete_selector';
import {AppExpandLevels, AppBindingLocations, AppCallTypes, AppCallResponseTypes} from '@mm-redux/constants/apps';
import {createCallContext, createCallRequest} from '@utils/apps';

import type {AppBinding} from '@mm-redux/types/apps';
import type {PostActionOption} from '@mm-redux/types/integration_actions';
import type {Post} from '@mm-redux/types/posts';
import type {DoAppCall, PostEphemeralCallResponseForPost} from '@mm-types/actions/apps';

type Props = {
    binding: AppBinding;
    doAppCall: DoAppCall;
    intl: typeof intlShape;
    post: Post;
    postEphemeralCallResponseForPost: PostEphemeralCallResponseForPost;
    teamID: string;
}

const MenuBinding = ({binding, doAppCall, intl, post, postEphemeralCallResponseForPost, teamID}: Props) => {
    const [selected, setSelected] = useState<PostActionOption>();

    const onSelect = useCallback(async (picked?: PostActionOption) => {
        if (!picked) {
            return;
        }
        setSelected(picked);

        const bind = binding.bindings?.find((b) => b.location === picked.value);
        if (!bind) {
            console.debug('Trying to select element not present in binding.'); //eslint-disable-line no-console
            return;
        }

        if (!bind.call) {
            return;
        }

        const context = createCallContext(
            bind.app_id,
            AppBindingLocations.IN_POST + bind.location,
            post.channel_id,
            teamID,
            post.id,
        );

        const call = createCallRequest(
            bind.call,
            context,
            {post: AppExpandLevels.EXPAND_ALL},
        );

        const res = await doAppCall(call, AppCallTypes.SUBMIT, intl);
        if (res.error) {
            const errorResponse = res.error;
            const errorMessage = errorResponse.error || intl.formatMessage({
                id: 'apps.error.unknown',
                defaultMessage: 'Unknown error occurred.',
            });
            postEphemeralCallResponseForPost(res.error, errorMessage, post);
            return;
        }

        const callResp = res.data!;
        switch (callResp.type) {
        case AppCallResponseTypes.OK:
            if (callResp.markdown) {
                postEphemeralCallResponseForPost(callResp, callResp.markdown, post);
            }
            return;
        case AppCallResponseTypes.NAVIGATE:
        case AppCallResponseTypes.FORM:
            return;
        default: {
            const errorMessage = intl.formatMessage({
                id: 'apps.error.responses.unknown_type',
                defaultMessage: 'App response type not supported. Response type: {type}.',
            }, {
                type: callResp.type,
            });
            postEphemeralCallResponseForPost(callResp, errorMessage, post);
        }
        }
    }, []);

    const options = binding.bindings?.map<PostActionOption>((b:AppBinding) => {
        return {text: b.label, value: b.location || ''};
    });

    return (
        <AutocompleteSelector
            placeholder={binding.label}
            options={options}
            selected={selected}
            onSelected={onSelect}
        />
    );
};

export default injectIntl(MenuBinding);
