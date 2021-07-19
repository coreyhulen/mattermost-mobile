// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {intlShape} from 'react-intl';
import React, {PureComponent} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {EventSubscription, Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from 'react-native-button';

import {AppCallResponseTypes} from '@mm-redux/constants/apps';
import {AppCallRequest, AppField, AppForm, AppFormValue, AppFormValues, AppLookupResponse, AppSelectOption, FormResponseData} from '@mm-redux/types/apps';
import {DialogElement} from '@mm-redux/types/integrations';
import {Theme} from '@mm-redux/types/preferences';
import {checkDialogElementForError, checkIfErrorsMatchElements} from '@mm-redux/utils/integration_utils';
import {ActionResult} from '@mm-redux/types/actions';

import StatusBar from '@components/status_bar';
import Markdown from '@components/markdown';

import {dismissModal} from '@actions/navigation';
import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {DoAppCallResult} from 'types/actions/apps';
import {GlobalStyles} from 'app/styles';

import AppsFormField from './apps_form_field';
import DialogIntroductionText from './dialog_introduction_text';

export type Props = {
    call: AppCallRequest;
    form: AppForm;
    actions: {
        submit: (submission: {
            values: {
                [name: string]: string;
            };
        }) => Promise<DoAppCallResult<FormResponseData>>;
        performLookupCall: (field: AppField, values: AppFormValues, userInput: string) => Promise<DoAppCallResult<AppLookupResponse>>;
        refreshOnSelect: (field: AppField, values: AppFormValues, value: AppFormValue) => Promise<DoAppCallResult<FormResponseData>>;
        handleGotoLocation: (href: string, intl: any) => Promise<ActionResult>;
    };
    theme: Theme;
    componentId: string;
}

type State = {
    values: {[name: string]: string};
    formError: string | null;
    fieldErrors: {[name: string]: string};
    form: AppForm;
}

const initFormValues = (form: AppForm): {[name: string]: string} => {
    const values: {[name: string]: any} = {};
    if (form && form.fields) {
        form.fields.forEach((f) => {
            values[f.name] = f.value || null;
        });
    }

    return values;
};

export default class AppsFormComponent extends PureComponent<Props, State> {
    private scrollView: React.RefObject<ScrollView>;
    navigationEventListener?: EventSubscription;

    private submitting = false;
    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props: Props) {
        super(props);

        const {form} = props;
        const values = initFormValues(form);

        this.state = {
            values,
            formError: null,
            fieldErrors: {},
            form,
        };

        this.scrollView = React.createRef();
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.form !== prevState.form) {
            return {
                values: initFormValues(nextProps.form),
                form: nextProps.form,
            };
        }

        return null;
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    navigationButtonPressed({buttonId}: {buttonId: string}) {
        switch (buttonId) {
        case 'submit-form':
            this.handleSubmit();
            return;
        case 'close-dialog':
            this.handleHide();
        }
    }

    doSubmit = async (button?: string) => {
        if (this.submitting) {
            return;
        }

        const {fields} = this.props.form;
        const values = this.state.values;
        const fieldErrors: {[name: string]: string} = {};

        const elements = fieldsAsElements(fields);
        elements?.forEach((element) => {
            const error = checkDialogElementForError( // TODO: make sure all required values are present in `element`
                element,
                values[element.name],
            );
            if (error) {
                fieldErrors[element.name] = this.context.intl.formatMessage(error.id, error.defaultMessage, error.values);
            }
        });

        this.setState({fieldErrors});

        if (Object.keys(fieldErrors).length !== 0) {
            return;
        }

        const submission = {
            values,
        };

        if (button && this.props.form.submit_buttons) {
            submission.values[this.props.form.submit_buttons] = button;
        }

        this.submitting = true;
        const res = await this.props.actions.submit(submission);

        if (res.error) {
            const errorResponse = res.error;
            const errorMessage = errorResponse.error;
            const hasErrors = this.updateErrors(elements, errorResponse.data?.errors, errorMessage);
            if (!hasErrors) {
                this.handleHide();
                return;
            }
            this.submitting = false;
            return;
        }

        const callResponse = res.data!;
        switch (callResponse.type) {
        case AppCallResponseTypes.OK:
        case AppCallResponseTypes.NAVIGATE:
            await this.handleHide();
            this.props.actions.handleGotoLocation(callResponse.navigate_to_url!, this.context.intl);
            return;
        case AppCallResponseTypes.FORM:
            this.submitting = false;
            return;
        default:
            this.updateErrors([], undefined, this.context.intl.formatMessage({
                id: 'apps.error.responses.unknown_type',
                defaultMessage: 'App response type not supported. Response type: {type}.',
            }, {
                type: callResponse.type,
            }));
            this.submitting = false;
        }
    }

    handleSubmit = preventDoubleTap(this.doSubmit);

    updateErrors = (elements: DialogElement[], fieldErrors?: {[x: string]: string}, formError?: string): boolean => {
        let hasErrors = false;
        const state = {} as State;
        if (formError) {
            hasErrors = true;
            state.formError = formError;
        }

        if (fieldErrors && Object.keys(fieldErrors).length >= 0) {
            hasErrors = true;
            if (checkIfErrorsMatchElements(fieldErrors as any, elements)) {
                state.fieldErrors = fieldErrors;
            } else if (!state.formError) {
                const field = Object.keys(fieldErrors)[0];
                state.formError = this.context.intl.formatMessage({
                    id: 'apps.error.responses.unknown_field_error',
                    defaultMessage: 'Received an error for an unkown field. Field name: `{field}`. Error: `{error}`.',
                }, {
                    field,
                    error: fieldErrors[field],
                });
            }
        }

        if (hasErrors) {
            this.setState(state);
            if (state.formError && this.scrollView?.current) {
                this.scrollView.current.scrollTo({x: 0, y: 0});
            }
        }
        return hasErrors;
    }

    performLookup = async (name: string, userInput: string): Promise<AppSelectOption[]> => {
        const intl = this.context.intl;
        const field = this.props.form.fields.find((f) => f.name === name);
        if (!field) {
            return [];
        }

        const res = await this.props.actions.performLookupCall(field, this.state.values, userInput);
        if (res.error) {
            const errorResponse = res.error;
            const errMsg = errorResponse.error || intl.formatMessage({
                id: 'apps.error.unknown',
                defaultMessage: 'Unknown error.',
            });
            this.setState({
                fieldErrors: {
                    ...this.state.fieldErrors,
                    [field.name]: errMsg,
                },
            });
            return [];
        }

        const callResp = res.data!;
        switch (callResp.type) {
        case AppCallResponseTypes.OK:
            return callResp.data?.items || [];
        case AppCallResponseTypes.FORM:
        case AppCallResponseTypes.NAVIGATE: {
            const errMsg = intl.formatMessage({
                id: 'apps.error.responses.unexpected_type',
                defaultMessage: 'App response type was not expected. Response type: {type}.',
            }, {
                type: callResp.type,
            },
            );
            this.setState({
                fieldErrors: {
                    ...this.state.fieldErrors,
                    [field.name]: errMsg,
                },
            });
            return [];
        }
        default: {
            const errMsg = intl.formatMessage({
                id: 'apps.error.responses.unknown_type',
                defaultMessage: 'App response type not supported. Response type: {type}.',
            }, {
                type: callResp.type,
            },
            );
            this.setState({
                fieldErrors: {
                    ...this.state.fieldErrors,
                    [field.name]: errMsg,
                },
            });
            return [];
        }
        }
    }

    handleHide = async () => {
        await dismissModal();
    }

    onChange = (name: string, value: any) => {
        const field = this.props.form.fields.find((f) => f.name === name);
        if (!field) {
            return;
        }

        const values = {...this.state.values, [name]: value};

        if (field.refresh) {
            this.props.actions.refreshOnSelect(field, values, value).then((res) => {
                if (res.error) {
                    const errorResponse = res.error;
                    const errorMsg = errorResponse.error;
                    const errors = errorResponse.data?.errors;
                    const elements = fieldsAsElements(this.props.form.fields);
                    this.updateErrors(elements, errors, errorMsg);
                    return;
                }

                const callResponse = res.data!;
                switch (callResponse.type) {
                case AppCallResponseTypes.FORM:
                    return;
                case AppCallResponseTypes.OK:
                case AppCallResponseTypes.NAVIGATE:
                    this.updateErrors([], undefined, this.context.intl.formatMessage({
                        id: 'apps.error.responses.unexpected_type',
                        defaultMessage: 'App response type was not expected. Response type: {type}.',
                    }, {
                        type: callResponse.type,
                    }));
                    return;
                default:
                    this.updateErrors([], undefined, this.context.intl.formatMessage({
                        id: 'apps.error.responses.unknown_type',
                        defaultMessage: 'App response type not supported. Response type: {type}.',
                    }, {
                        type: callResponse.type,
                    }));
                }
            });
        }

        this.setState({values});
    };

    render() {
        const {theme, form} = this.props;
        const {fields, header} = form;
        const {formError, fieldErrors, values} = this.state;
        const style = getStyleFromTheme(theme);

        const submitButtons = fields && fields.find((f) => f.name === form.submit_buttons);

        return (
            <SafeAreaView
                testID='interactive_dialog.screen'
                style={style.container}
            >
                <ScrollView
                    ref={this.scrollView}
                    style={style.scrollView}
                >
                    <StatusBar/>
                    {formError && (
                        <View style={style.errorContainer} >
                            <Markdown
                                baseTextStyle={style.errorLabel}
                                textStyles={getMarkdownTextStyles(theme)}
                                blockStyles={getMarkdownBlockStyles(theme)}
                                value={formError}
                            />
                        </View>
                    )}
                    {header &&
                        <DialogIntroductionText
                            value={header}
                            theme={theme}
                        />
                    }
                    {fields && fields.filter((f) => f.name !== form.submit_buttons).map((field) => {
                        return (
                            <AppsFormField
                                field={field}
                                key={field.name}
                                name={field.name}
                                errorText={fieldErrors[field.name]}
                                value={values[field.name]}
                                performLookup={this.performLookup}
                                onChange={this.onChange}
                                theme={theme}
                            />
                        );
                    })}
                    <View
                        style={{marginHorizontal: 5}}
                    >
                        {submitButtons?.options?.map((o) => (
                            <Button
                                key={o.value}
                                onPress={() => this.handleSubmit(o.value)}
                                containerStyle={GlobalStyles.signupButton}
                            >
                                <Text style={GlobalStyles.signupButtonText}>{o.label}</Text>
                            </Button>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }
}

function fieldsAsElements(fields?: AppField[]): DialogElement[] {
    return fields?.map((f) => ({
        name: f.name,
        type: f.type,
        subtype: f.subtype,
        optional: !f.is_required,
    })) as DialogElement[];
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
        },
        errorContainer: {
            marginTop: 15,
            marginLeft: 15,
            fontSize: 14,
            fontWeight: 'bold',
        },
        scrollView: {
            marginBottom: 20,
            marginTop: 10,
        },
        button: {
            alignSelf: 'stretch',
            backgroundColor: theme.sidebarHeaderBg,
            borderRadius: 3,
            padding: 15,
        },
        errorLabel: {
            fontSize: 12,
            textAlign: 'left',
            color: (theme.errorTextColor || '#DA4A4A'),
        },
    };
});
