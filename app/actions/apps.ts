// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Client4} from '@client/rest';

import {ActionFunc, DispatchFunc} from '@mm-redux/types/actions';
import {AppCallResponse, AppCallRequest, AppCallType, AppContext} from '@mm-redux/types/apps';
import {Post} from '@mm-redux/types/posts';

import {AppCallTypes, AppCallResponseTypes} from '@mm-redux/constants/apps';
import {makeCallErrorResponse} from '@utils/apps';
import {sendEphemeralPost} from '@actions/views/post';
import {CommandArgs} from '@mm-redux/types/integrations';

export function doAppCall<Res=unknown>(call: AppCallRequest, type: AppCallType, intl: any): ActionFunc {
    return async () => {
        try {
            const res = await Client4.executeAppCall(call, type) as AppCallResponse<Res>;
            const responseType = res.type || AppCallResponseTypes.OK;

            switch (responseType) {
            case AppCallResponseTypes.OK:
                return {data: res};
            case AppCallResponseTypes.ERROR:
                return {error: res};
            case AppCallResponseTypes.FORM: {
                if (!res.form) {
                    const errMsg = intl.formatMessage({
                        id: 'apps.error.responses.form.no_form',
                        defaultMessage: 'Response type is `form`, but no form was included in response.',
                    });
                    return {error: makeCallErrorResponse(errMsg)};
                }

                return {data: res};
            }
            case AppCallResponseTypes.NAVIGATE:
                if (!res.navigate_to_url) {
                    const errMsg = intl.formatMessage({
                        id: 'apps.error.responses.navigate.no_url',
                        defaultMessage: 'Response type is `navigate`, but no url was included in response.',
                    });
                    return {error: makeCallErrorResponse(errMsg)};
                }

                if (type !== AppCallTypes.SUBMIT) {
                    const errMsg = intl.formatMessage({
                        id: 'apps.error.responses.navigate.no_submit',
                        defaultMessage: 'Response type is `navigate`, but the call was not a submission.',
                    });
                    return {error: makeCallErrorResponse(errMsg)};
                }

                return {data: res};
            default: {
                const errMsg = intl.formatMessage({
                    id: 'apps.error.responses.unknown_type',
                    defaultMessage: 'App response type not supported. Response type: {type}.',
                }, {
                    type: responseType,
                });
                return {error: makeCallErrorResponse(errMsg)};
            }
            }
        } catch (error) {
            const errMsg = error.message || intl.formatMessage({
                id: 'apps.error.responses.unexpected_error',
                defaultMessage: 'Received an unexpected error.',
            });
            return {error: makeCallErrorResponse(errMsg)};
        }
    };
}

export function postEphemeralCallResponseForPost(response: AppCallResponse, message: string, post: Post): ActionFunc {
    return (dispatch: DispatchFunc) => {
        return dispatch(sendEphemeralPost(
            message,
            post.channel_id,
            post.root_id || post.id,
            response.app_metadata?.bot_user_id,
        ));
    };
}

export function postEphemeralCallResponseForChannel(response: AppCallResponse, message: string, channelID: string): ActionFunc {
    return (dispatch: DispatchFunc) => {
        return dispatch(sendEphemeralPost(
            message,
            channelID,
            '',
            response.app_metadata?.bot_user_id,
        ));
    };
}

export function postEphemeralCallResponseForContext(response: AppCallResponse, message: string, context: AppContext): ActionFunc {
    return (dispatch: DispatchFunc) => {
        return dispatch(sendEphemeralPost(
            message,
            context.channel_id,
            context.root_id || context.post_id,
            response.app_metadata?.bot_user_id,
        ));
    };
}

export function postEphemeralCallResponseForCommandArgs(response: AppCallResponse, message: string, args: CommandArgs): ActionFunc {
    return (dispatch: DispatchFunc) => {
        return dispatch(sendEphemeralPost(
            message,
            args.channel_id,
            args.root_id,
            response.app_metadata?.bot_user_id,
        ));
    };
}
