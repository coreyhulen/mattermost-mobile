// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';

import {Theme} from '@mm-redux/types/preferences';
import {ActionResult} from '@mm-redux/types/actions';
import {AppCallResponse, AppCallRequest, AppField, AppForm, AppFormValues, FormResponseData, AppLookupResponse} from '@mm-redux/types/apps';
import {AppCallResponseTypes, AppCallTypes} from '@mm-redux/constants/apps';
import AppsFormComponent from './apps_form_component';
import {makeCallErrorResponse} from '@utils/apps';
import {DoAppCall, DoAppCallResult, PostEphemeralCallResponseForContext} from 'types/actions/apps';

export type Props = {
    form?: AppForm;
    call?: AppCallRequest;
    actions: {
        doAppCall: DoAppCall<any>;
        postEphemeralCallResponseForContext: PostEphemeralCallResponseForContext;
        handleGotoLocation: (href: string, intl: any) => Promise<ActionResult>;
    };
    theme: Theme;
    componentId: string;
};

export type State = {
    form?: AppForm;
}

export default class AppsFormContainer extends PureComponent<Props, State> {
    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props: Props) {
        super(props);
        this.state = {form: props.form};
    }

    handleSubmit = async (submission: {values: AppFormValues}): Promise<{data?: AppCallResponse<FormResponseData>, error?: AppCallResponse<FormResponseData>}> => {
        const intl = this.context.intl;
        const makeErrorMsg = (msg: string) => {
            return intl.formatMessage(
                {
                    id: 'apps.error.form.submit.pretext',
                    defaultMessage: 'There has been an error submitting the modal. Contact the app developer. Details: {details}',
                },
                {details: msg},
            );
        };

        const {form} = this.state;
        if (!form) {
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage(
                {
                    id: 'apps.error.form.no_form',
                    defaultMessage: '`form` is not defined',
                },
            )))};
        }

        const call = this.getCall();
        if (!call) {
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage(
                {
                    id: 'apps.error.form.no_call',
                    defaultMessage: '`call` is not defined',
                },
            )))};
        }

        const res = await this.props.actions.doAppCall({
            ...call,
            values: submission.values,
        }, AppCallTypes.SUBMIT, intl);

        if (res.error) {
            return res;
        }

        const callResp = res.data!;
        switch (callResp.type) {
        case AppCallResponseTypes.OK:
            if (callResp.markdown) {
                this.props.actions.postEphemeralCallResponseForContext(callResp, callResp.markdown, call.context);
            }
            break;
        case AppCallResponseTypes.FORM:
            this.setState({form: callResp.form});
            break;
        case AppCallResponseTypes.NAVIGATE:
            break;
        default:
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage(
                {
                    id: 'apps.error.responses.unknown_type',
                    defaultMessage: 'App response type not supported. Response type: {type}.',
                }, {
                    type: callResp.type,
                },
            )))};
        }
        return res;
    }

    refreshOnSelect = async (field: AppField, values: AppFormValues): Promise<DoAppCallResult<FormResponseData>> => {
        const intl = this.context.intl;
        const makeErrorMsg = (message: string) => intl.formatMessage(
            {
                id: 'apps.error.form.refresh',
                defaultMessage: 'There has been an error updating the modal. Contact the app developer. Details: {details}',
            },
            {details: message},
        );
        const {form} = this.state;
        if (!form) {
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage({
                id: 'apps.error.form.no_form',
                defaultMessage: '`form` is not defined.',
            })))};
        }

        const call = this.getCall();
        if (!call) {
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage({
                id: 'apps.error.form.no_call',
                defaultMessage: '`call` is not defined.',
            })))};
        }

        if (!field.refresh) {
            // Should never happen
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage({
                id: 'apps.error.form.refresh_no_refresh',
                defaultMessage: 'Called refresh on no refresh field.',
            })))};
        }

        const res = await this.props.actions.doAppCall({
            ...call,
            selected_field: field.name,
            values,

        }, AppCallTypes.FORM, intl);

        if (res.error) {
            return res;
        }
        const callResp = res.data!;
        switch (callResp.type) {
        case AppCallResponseTypes.FORM:
            this.setState({form: callResp.form});
            break;
        case AppCallResponseTypes.OK:
        case AppCallResponseTypes.NAVIGATE:
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage({
                id: 'apps.error.responses.unexpected_type',
                defaultMessage: 'App response type was not expected. Response type: {type}.',
            }, {
                type: callResp.type,
            },
            )))};
        default:
            return {error: makeCallErrorResponse(makeErrorMsg(intl.formatMessage({
                id: 'apps.error.responses.unknown_type',
                defaultMessage: 'App response type not supported. Response type: {type}.',
            }, {
                type: callResp.type,
            },
            )))};
        }
        return res;
    };

    performLookupCall = async (field: AppField, values: AppFormValues, userInput: string): Promise<DoAppCallResult<AppLookupResponse>> => {
        const intl = this.context.intl;
        const makeErrorMsg = (message: string) => intl.formatMessage(
            {
                id: 'apps.error.form.refresh',
                defaultMessage: 'There has been an error fetching the select fields. Contact the app developer. Details: {details}',
            },
            {details: message},
        );
        const call = this.getCall();
        if (!call) {
            return makeErrorMsg(intl.formatMessage({id: 'apps.error.form.no_lookup_call', defaultMessage: 'performLookupCall props.call is not defined'}));
        }

        return this.props.actions.doAppCall({
            ...call,
            values,
            selected_field: field.name,
            query: userInput,
        }, AppCallTypes.LOOKUP, intl);
    }

    getCall = (): AppCallRequest | null => {
        const {form} = this.state;

        const {call} = this.props;
        if (!call) {
            return null;
        }

        return {
            ...call,
            ...form?.call,
            context: {
                ...call.context,
            },
            values: {
                ...call.values,
            },
        };
    }

    render() {
        const {form} = this.state;
        if (!form) {
            return null;
        }

        const call = this.getCall();
        if (!call) {
            return null;
        }

        return (
            <AppsFormComponent
                form={form}
                call={call}
                actions={{
                    submit: this.handleSubmit,
                    performLookupCall: this.performLookupCall,
                    refreshOnSelect: this.refreshOnSelect,
                    handleGotoLocation: this.props.actions.handleGotoLocation,
                }}
                theme={this.props.theme}
                componentId={this.props.componentId}
            />
        );
    }
}
