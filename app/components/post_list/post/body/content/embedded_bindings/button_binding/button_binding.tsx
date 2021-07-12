// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef} from 'react';
import {intlShape, injectIntl} from 'react-intl';
import Button from 'react-native-button';

import {AppExpandLevels, AppBindingLocations, AppCallTypes, AppCallResponseTypes} from '@mm-redux/constants/apps';
import {AppBinding} from '@mm-redux/types/apps';
import {Post} from '@mm-redux/types/posts';
import {Theme} from '@mm-redux/types/preferences';
import {DoAppCall, PostEphemeralCallResponseForPost} from '@mm-types/actions/apps';
import {createCallContext, createCallRequest} from '@utils/apps';
import {getStatusColors} from '@utils/message_attachment_colors';
import {preventDoubleTap} from '@utils/tap';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

import ButtonBindingText from './button_binding_text';

type Props = {
    binding: AppBinding;
    doAppCall: DoAppCall;
    intl: typeof intlShape;
    post: Post;
    postEphemeralCallResponseForPost: PostEphemeralCallResponseForPost;
    teamID: string;
    theme: Theme;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    const STATUS_COLORS = getStatusColors(theme);
    return {
        button: {
            borderRadius: 4,
            borderColor: changeOpacity(STATUS_COLORS.default, 0.25),
            borderWidth: 2,
            opacity: 1,
            alignItems: 'center',
            marginTop: 12,
            justifyContent: 'center',
            height: 36,
        },
        buttonDisabled: {backgroundColor: changeOpacity(theme.buttonBg, 0.3)},
        text: {
            color: STATUS_COLORS.default,
            fontSize: 15,
            fontWeight: '600',
            lineHeight: 17,
        },
    };
});

const ButtonBinding = ({binding, doAppCall, intl, post, postEphemeralCallResponseForPost, teamID, theme}: Props) => {
    const pressed = useRef(false);
    const style = getStyleSheet(theme);

    const onPress = useCallback(preventDoubleTap(async () => {
        if (!binding.call || pressed.current) {
            return;
        }

        pressed.current = true;

        const context = createCallContext(
            binding.app_id,
            AppBindingLocations.IN_POST + binding.location,
            post.channel_id,
            teamID,
            post.id,
        );

        const call = createCallRequest(
            binding.call,
            context,
            {post: AppExpandLevels.EXPAND_ALL},
        );

        const res = await doAppCall(call, AppCallTypes.SUBMIT, intl);
        pressed.current = false;

        if (res.error) {
            const errorResponse = res.error;
            const errorMessage = errorResponse.error || intl.formatMessage({
                id: 'apps.error.unknown',
                defaultMessage: 'Unknown error occurred.',
            });
            postEphemeralCallResponseForPost(errorResponse, errorMessage, post);
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
    }), []);

    return (
        <Button
            containerStyle={[style.button]}
            disabledContainerStyle={style.buttonDisabled}
            onPress={onPress}
        >
            <ButtonBindingText
                message={binding.label}
                style={style.text}
            />
        </Button>
    );
};

export default injectIntl(ButtonBinding);
