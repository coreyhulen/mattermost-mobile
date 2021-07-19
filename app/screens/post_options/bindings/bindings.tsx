// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Alert} from 'react-native';
import {intlShape, injectIntl} from 'react-intl';

import {isSystemMessage} from '@mm-redux/utils/post_utils';

import PostOption from '../post_option';
import {ActionResult} from '@mm-redux/types/actions';
import {AppBinding, AppCallResponse} from '@mm-redux/types/apps';
import {Theme} from '@mm-redux/types/preferences';
import {Post} from '@mm-redux/types/posts';
import {UserProfile} from '@mm-redux/types/users';
import {AppCallResponseTypes, AppCallTypes, AppExpandLevels} from '@mm-redux/constants/apps';
import {showAppForm} from '@actions/navigation';
import {createCallContext, createCallRequest} from '@utils/apps';
import {DoAppCall, PostEphemeralCallResponseForPost} from 'types/actions/apps';

type Props = {
    bindings: AppBinding[],
    theme: Theme,
    post: Post,
    currentUser: UserProfile,
    teamID: string,
    closeWithAnimation: (cb?: () => void) => void,
    appsEnabled: boolean,
    intl: typeof intlShape,
    actions: {
        doAppCall: DoAppCall;
        postEphemeralCallResponseForPost: PostEphemeralCallResponseForPost;
        handleGotoLocation: (href: string, intl: any) => Promise<ActionResult>;
    }
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
    binding: AppBinding,
    theme: Theme,
    post: Post,
    currentUser: UserProfile,
    teamID: string,
    closeWithAnimation: (cb?: () => void) => void,
    intl: typeof intlShape,
    actions: {
        doAppCall: DoAppCall;
        postEphemeralCallResponseForPost: PostEphemeralCallResponseForPost;
        handleGotoLocation: (href: string, intl: any) => Promise<ActionResult>;
    },
}

class Option extends React.PureComponent<OptionProps> {
    onPress = async () => {
        const {post, teamID, binding, intl, theme} = this.props;
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

        const callPromise = doAppCall(call, AppCallTypes.SUBMIT, intl);
        await this.close();

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
            this.props.actions.handleGotoLocation(callResp.navigate_to_url!, intl);
            break;
        case AppCallResponseTypes.FORM:
            showAppForm(callResp.form, call, theme);
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
    };

    close = (): Promise<void> => {
        return new Promise((resolve) => {
            this.props.closeWithAnimation(resolve);
        });
    }

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
