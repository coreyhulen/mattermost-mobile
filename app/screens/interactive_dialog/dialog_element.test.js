// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import AutocompleteSelector from '@components/autocomplete_selector';
import BoolSetting from '@components/widgets/settings/bool_setting';
import RadioSetting from '@components/widgets/settings/radio_setting';
import Preferences from '@mm-redux/constants/preferences';

import DialogElement from './dialog_element.js';

describe('DialogElement', () => {
    const baseDialogProps = {
        displayName: 'Testing',
        name: 'testing',
        type: 'text',
    };

    const theme = Preferences.THEMES.default;
    test('secureTextEntry is true and multiline is false when subtype is password', () => {
        const wrapper = shallow(
            <DialogElement
                {...baseDialogProps}
                theme={theme}
                subtype='password'
            />,
        );
        expect(wrapper.find({secureTextEntry: true}).exists()).toBe(true);
        expect(wrapper.find({multiline: false}).exists()).toBe(true);
    });
    test('secureTextEntry is false when subtype is not password', () => {
        const wrapper = shallow(
            <DialogElement
                {...baseDialogProps}
                theme={theme}
                subtype='email'
            />,
        );
        expect(wrapper.find({secureTextEntry: false}).exists()).toBe(true);
    });

    describe('radioSetting', () => {
        const radioOptions = [
            {value: 'foo', text: 'foo-text'},
            {value: 'bar', text: 'bar-text'},
        ];

        test('The default value can be specified from the list', () => {
            const wrapper = shallow(
                <DialogElement
                    {...baseDialogProps}
                    theme={theme}
                    type='radio'
                    options={radioOptions}
                    value={radioOptions[1].value}
                />,
            );
            expect(wrapper.find(RadioSetting).find({options: radioOptions, default: radioOptions[1].value}).exists()).toBe(true);
        });
    });

    describe('boolSetting', () => {
        test('propagates when false', () => {
            const wrapper = shallow(
                <DialogElement
                    {...baseDialogProps}
                    theme={theme}
                    type='bool'
                    value={false}
                />,
            );
            expect(wrapper.find(BoolSetting).find({value: false}).exists()).toBe(true);
        });

        test('propagates when true', () => {
            const wrapper = shallow(
                <DialogElement
                    {...baseDialogProps}
                    theme={theme}
                    type='bool'
                    value={true}
                />,
            );
            expect(wrapper.find(BoolSetting).find({value: true}).exists()).toBe(true);
        });

        test('propagates when null', () => {
            const wrapper = shallow(
                <DialogElement
                    {...baseDialogProps}
                    theme={theme}
                    type='bool'
                    value={null}
                />,
            );
            expect(wrapper.find(BoolSetting).find({value: false}).exists()).toBe(true);
        });
    });

    describe('select', () => {
        const baseProps = {
            ...baseDialogProps,
            theme,
            display_name: 'Select',
            name: 'select',
            optional: false,
            type: 'select',
            options: [
                {name: 'name1', value: 'value1'},
                {name: 'name2', value: 'value2'},
                {name: 'name3', value: 'value3'},
            ],
        };

        test('handles unknown value', () => {
            const wrapper = shallow(
                <DialogElement
                    {...baseProps}
                    value={'unknown'}
                />,
            );
            expect(wrapper.find(AutocompleteSelector).find({selected: null}).exists()).toBe(true);
        });

        test('handles known value', () => {
            const wrapper = shallow(
                <DialogElement
                    {...baseProps}
                    value={'value2'}
                />,
            );
            expect(wrapper.find(AutocompleteSelector).find({selected: {name: 'name2', value: 'value2'}}).exists()).toBe(true);
        });
    });
});
