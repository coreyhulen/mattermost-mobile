// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {sendEphemeralPost} from '@actions/views/post';
import {Client4} from '@client/rest';
import CompassIcon from '@components/compass_icon';
import {handleGotoLocation} from '@mm-redux/actions/integrations';
import {AppCallTypes, AppCallResponseTypes} from '@mm-redux/constants/apps';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {ActionFunc, DispatchFunc} from '@mm-redux/types/actions';
import {AppCallResponse, AppForm, AppCallRequest, AppCallType, AppContext} from '@mm-redux/types/apps';
import {CommandArgs} from '@mm-redux/types/integrations';
import {Post} from '@mm-redux/types/posts';
import {Theme} from '@mm-redux/types/preferences';
import EphemeralStore from '@store/ephemeral_store';
import {makeCallErrorResponse} from '@utils/apps';

import {showModal} from './navigation';

export function doAppCall<Res=unknown>(call: AppCallRequest, type: AppCallType, intl: any): ActionFunc {
    return async (dispatch, getState) => {
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

                const screen = EphemeralStore.getNavigationTopComponentId();
                if (type === AppCallTypes.SUBMIT && screen !== 'AppForm') {
                    showAppForm(res.form, call, getTheme(getState()));
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

                dispatch(handleGotoLocation(res.navigate_to_url, intl));

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

const showAppForm = async (form: AppForm, call: AppCallRequest, theme: Theme) => {
    const closeButton = await CompassIcon.getImageSource('close', 24, theme.sidebarHeaderTextColor);

    let submitButtons;
    const customSubmitButtons = form.submit_buttons && form.fields.find((f) => f.name === form.submit_buttons)?.options;

    if (!customSubmitButtons?.length) {
        submitButtons = [{
            id: 'submit-form',
            showAsAction: 'always',
            text: 'Submit',
        }];
    }

    const options = {
        topBar: {
            leftButtons: [{
                id: 'close-dialog',
                icon: closeButton,
            }],
            rightButtons: submitButtons,
        },
    };

    const passProps = {form, call};
    showModal('AppForm', form.title, passProps, options);
};

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
