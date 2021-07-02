// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {ShallowWrapper} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';

import AppsFormComponent, {Props, State} from './apps_form_component';
import {shallowWithIntl} from 'test/intl-test-helper';

describe('AppsForm', () => {
    const baseProps: Props = {
        actions: {
            performLookupCall: jest.fn(),
            refreshOnSelect: jest.fn(),
            submit: jest.fn(),
        },
        call: {
            context: {
                app_id: 'app1',
            },
            path: '/create',
        },
        componentId: '',
        form: {
            title: 'Title',
            footer: 'Footer',
            header: 'Header',
            icon: 'Icon',
            fields: [
                {
                    name: 'bool1',
                    type: 'bool',
                },
                {
                    name: 'bool2',
                    type: 'bool',
                    value: false,
                },
                {
                    name: 'bool3',
                    type: 'bool',
                    value: true,
                },
                {
                    name: 'text1',
                    type: 'text',
                    value: 'initial text',
                },
                {
                    name: 'select1',
                    type: 'static_select',
                    options: [
                        {label: 'Label1', value: 'Value1'},
                        {label: 'Label2', value: 'Value2'},
                    ],
                    value: {label: 'Label1', value: 'Value1'},
                },
            ],
        },
        theme: Preferences.THEMES.default,
    };

    test('should set match snapshot', () => {
        const wrapper: ShallowWrapper<Props, State, AppsFormComponent> = shallowWithIntl(
            <AppsFormComponent
                {...baseProps}
            />,
        ) as unknown as ShallowWrapper<Props, State, AppsFormComponent>;

        expect(wrapper).toMatchSnapshot();
    });

    test('should set initial form values', () => {
        const wrapper: ShallowWrapper<Props, State, AppsFormComponent> = shallowWithIntl(
            <AppsFormComponent
                {...baseProps}
            />,
        ) as unknown as ShallowWrapper<Props, State, AppsFormComponent>;

        expect(wrapper.state().values).toEqual({
            bool1: false,
            bool2: false,
            bool3: true,
            text1: 'initial text',
            select1: {label: 'Label1', value: 'Value1'},
        });
    });

    test('it should submit and close the modal', async () => {
        const submit = jest.fn().mockResolvedValue({data: {type: 'ok'}});

        const props: Props = {
            ...baseProps,
            actions: {
                ...baseProps.actions,
                submit,
            },
        };

        const wrapper: ShallowWrapper<Props, State, AppsFormComponent> = shallowWithIntl(
            <AppsFormComponent
                {...props}
            />,
        ) as unknown as ShallowWrapper<Props, State, AppsFormComponent>;

        const hide = jest.fn();
        wrapper.instance().handleHide = hide;

        await wrapper.instance().doSubmit();

        expect(submit).toHaveBeenCalledWith({
            values: {
                bool1: false,
                bool2: false,
                bool3: true,
                text1: 'initial text',
                select1: {label: 'Label1', value: 'Value1'},
            },
        });
        expect(hide).toHaveBeenCalled();
    });
});
