// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import ErrorText from '@components/error_text';
import Preferences from '@mm-redux/constants/preferences';
import DialogElement from '@screens/interactive_dialog/dialog_element';

import InteractiveDialog from './interactive_dialog';

describe('InteractiveDialog', () => {
    const baseProps = {
        url: 'http://mattermost.com',
        callbackId: 'someid',
        elements: [
            {type: 'text', name: 'name1', default: 'defaulttext', display_name: 'Name1'},
        ],
        notifyOnCancel: false,
        state: 'somestate',
        theme: Preferences.THEMES.default,
        actions: {
            submitInteractiveDialog: jest.fn(() => ({})),
            dismissModal: jest.fn(),
        },
        componentId: 'component-id',
    };

    test('should set default values', async () => {
        const wrapper = shallow(
            <InteractiveDialog
                {...baseProps}
            />,
        );

        expect(wrapper.state().values.name1).toBe('defaulttext');
    });

    test('should submit dialog', async () => {
        const wrapper = shallow(
            <InteractiveDialog
                {...baseProps}
            />,
        );

        const dialog = {
            url: baseProps.url,
            callback_id: baseProps.callbackId,
            state: baseProps.state,
            submission: {name1: 'defaulttext'},
        };

        wrapper.instance().handleSubmit();
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledTimes(1);
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledWith(dialog);
    });

    test('should submit dialog on cancel', async () => {
        const wrapper = shallow(
            <InteractiveDialog
                {...baseProps}
                notifyOnCancel={true}
            />,
        );

        const dialog = {
            url: baseProps.url,
            callback_id: baseProps.callbackId,
            state: baseProps.state,
            cancelled: true,
        };

        wrapper.instance().navigationButtonPressed({buttonId: 'close-dialog'});
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledTimes(1);
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledWith(dialog);
    });

    test('should not submit dialog on cancel', async () => {
        const wrapper = shallow(
            <InteractiveDialog
                {...baseProps}
                notifyOnCancel={false}
            />,
        );

        wrapper.instance().navigationButtonPressed({buttonId: 'close-dialog'});
        expect(baseProps.actions.submitInteractiveDialog).not.toHaveBeenCalled();
    });

    test('should handle display with no elements', async () => {
        baseProps.elements = null;

        const wrapper = shallow(
            <InteractiveDialog
                {...baseProps}
                notifyOnCancel={false}
            />,
        );

        const dialog = {
            url: baseProps.url,
            callback_id: baseProps.callbackId,
            state: baseProps.state,
            submission: {},
        };

        wrapper.instance().handleSubmit();
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledTimes(1);
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledWith(dialog);
    });

    test('should display introduction text if present', async () => {
        baseProps.introductionText = '**Some** _introduction_ text';

        const wrapper = shallow(
            <InteractiveDialog
                {...baseProps}
                notifyOnCancel={false}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('introduction text should not affect submission', async () => {
        baseProps.introductionText = '**Some** _introduction_ text';

        const wrapper = shallow(
            <InteractiveDialog
                {...baseProps}
                notifyOnCancel={false}
            />,
        );

        const dialog = {
            url: baseProps.url,
            callback_id: baseProps.callbackId,
            state: baseProps.state,
            submission: {},
        };

        wrapper.instance().handleSubmit();
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledTimes(1);
        expect(baseProps.actions.submitInteractiveDialog).toHaveBeenCalledWith(dialog);
    });

    describe('generic error message', () => {
        test('should show error when submit returns an error', async () => {
            const props = {
                ...baseProps,
                actions: {
                    ...baseProps.actions,
                    submitInteractiveDialog: async () => ({
                        data: {error: 'This is an error message.'},
                    }),
                },
            };

            const wrapper = shallow(
                <InteractiveDialog {...props}/>,
            );
            wrapper.instance().scrollView = {current: {scrollTo: jest.fn()}};

            await wrapper.instance().handleSubmit();
            expect(wrapper.find(ErrorText).find({error: 'This is an error message.'})).toHaveLength(1);
            expect(wrapper.instance().scrollView.current.scrollTo).toHaveBeenCalledWith({x: 0, y: 0});
        });

        test('should show no error when submit does not return an error', async () => {
            const wrapper = shallow(
                <InteractiveDialog {...baseProps}/>,
            );
            wrapper.instance().scrollView = {current: {scrollTo: jest.fn()}};

            await wrapper.instance().handleSubmit();
            expect(wrapper.find(ErrorText)).not.toExist();
            expect(wrapper.instance().scrollView.current.scrollTo).not.toHaveBeenCalled();
        });
    });

    describe('bool element should handle', () => {
        const element = {
            data_source: '',
            display_name: 'Boolean Selector',
            name: 'somebool',
            optional: false,
            type: 'bool',
            placeholder: 'Subscribe?',
        };
        const {elements, ...rest} = baseProps;
        const props = {
            ...rest,
            elements: [
                ...elements,
                element,
            ],
        };

        const testCases = [
            {description: 'no default', expectedChecked: false},
            {description: 'unknown default', default: 'unknown', expectedChecked: false},
            {description: 'default of "false"', default: 'false', expectedChecked: false},
            {description: 'default of true', default: true, expectedChecked: true},
            {description: 'default of "true"', default: 'True', expectedChecked: true},
            {description: 'default of "True"', default: 'True', expectedChecked: true},
            {description: 'default of "TRUE"', default: 'TRUE', expectedChecked: true},
        ];

        testCases.forEach((testCase) => test(`should interpret ${testCase.description}`, () => {
            if (testCase.default === undefined) {
                delete element.default;
            } else {
                element.default = testCase.default;
            }

            const wrapper = shallow(<InteractiveDialog {...props}/>);
            wrapper.instance().scrollView = {current: {scrollTo: jest.fn()}};

            expect(wrapper.find(DialogElement).at(1).props().value).toBe(testCase.expectedChecked);
        }));
    });
});
