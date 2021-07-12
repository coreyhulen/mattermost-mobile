// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {Alert} from 'react-native';

import {AppCallResponseTypes, AppCallTypes, AppExpandLevels} from '@mm-redux/constants/apps';
import {AppBinding, AppCallResponse} from '@mm-redux/types/apps';
import {Post} from '@mm-redux/types/posts';
import {Theme} from '@mm-redux/types/preferences';
import {UserProfile} from '@mm-redux/types/users';
import {isSystemMessage} from '@mm-redux/utils/post_utils';
import {DoAppCall, PostEphemeralCallResponseForPost} from '@mm-types/actions/apps';
import {createCallContext, createCallRequest} from '@utils/apps';

import PostOption from '../post_option';

type Props = {
    bindings: AppBinding[];
    theme: Theme;
    post: Post;
    currentUser: UserProfile;
    teamID: string;
    closeWithAnimation: (cb?: () => void) => void;
    appsEnabled: boolean;
    intl: typeof intlShape;
    actions: {
        doAppCall: DoAppCall;
        postEphemeralCallResponseForPost: PostEphemeralCallResponseForPost;
    };
}

const Bindings = injectIntl((props: Props) => {
    if (!props.appsEnabled) {
        return null;
    }

    const {bindings, post, ...optionProps} = props;
    if (bindings.length === 0) {
        return null;
    }

    if (isSystemMessage(post)) {
        return null;
    }

    const options = bindings.map((b) => (
        <Option
            key={b.app_id + b.location}
            binding={b}
            post={post}
            {...optionProps}
        />
    ));

    return (
        <>
            {options}
        </>
    );
});

export default Bindings;

type OptionProps = {
    binding: AppBinding;
    theme: Theme;
    post: Post;
    currentUser: UserProfile;
    teamID: string;
    closeWithAnimation: (cb?: () => void) => void;
    intl: typeof intlShape;
    actions: {
        doAppCall: DoAppCall;
        postEphemeralCallResponseForPost: PostEphemeralCallResponseForPost;
    };
}

class Option extends React.PureComponent<OptionProps> {
    onPress = async () => {
        const {closeWithAnimation, post, teamID, binding, intl} = this.props;
        const {doAppCall, postEphemeralCallResponseForPost} = this.props.actions;

        if (!binding.call) {
            return;
        }
        const context = createCallContext(
            binding.app_id,
            binding.location,
            post.channel_id,
            teamID,
            post.id,
            post.root_id,
        );
        const call = createCallRequest(
            binding.call,
            context,
            {
                post: AppExpandLevels.ALL,
            },
        );

        closeWithAnimation(async () => {
            const callPromise = doAppCall(call, AppCallTypes.SUBMIT, intl);
            const res = await callPromise;
            if (res.error) {
                const errorResponse = res.error;
                const title = intl.formatMessage({
                    id: 'mobile.general.error.title',
                    defaultMessage: 'Error',
                });
                const errorMessage = errorResponse.error || intl.formatMessage({
                    id: 'apps.error.unknown',
                    defaultMessage: 'Unknown error occurred.',
                });
                Alert.alert(title, errorMessage);
                return;
            }

            const callResp = (res as {data: AppCallResponse}).data;
            switch (callResp.type) {
            case AppCallResponseTypes.OK:
                if (callResp.markdown) {
                    postEphemeralCallResponseForPost(callResp, callResp.markdown, post);
                }
                break;
            case AppCallResponseTypes.NAVIGATE:
            case AppCallResponseTypes.FORM:
                break;
            default: {
                const title = intl.formatMessage({
                    id: 'mobile.general.error.title',
                    defaultMessage: 'Error',
                });
                const errMessage = intl.formatMessage({
                    id: 'apps.error.responses.unknown_type',
                    defaultMessage: 'App response type not supported. Response type: {type}.',
                }, {
                    type: callResp.type,
                });
                Alert.alert(title, errMessage);
            }
            }
        });
    };

    render() {
        const {binding, theme} = this.props;
        if (!binding.label) {
            return null;
        }

        return (
            <PostOption
                icon={{uri: binding.icon}}
                text={binding.label}
                onPress={this.onPress}
                theme={theme}
            />
        );
    }
}
