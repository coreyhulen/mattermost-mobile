// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Keyboard} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import EditPost from './edit_post';

describe('EditPost', () => {
    const baseProps = {
        actions: {
            editPost: jest.fn(),
        },
        post: {},
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <EditPost {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should dismiss keyboard on close', () => {
        Keyboard.dismiss = jest.fn();
        expect(Keyboard.dismiss).not.toHaveBeenCalled();

        const wrapper = shallowWithIntl(
            <EditPost {...baseProps}/>,
        );
        wrapper.instance().close();
        expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    });

    test('should handle edit post action error', async () => {
        const error = 'error';
        const props = {
            ...baseProps,
            actions: {
                editPost: jest.fn().mockResolvedValueOnce({error}),
            },
        };

        const wrapper = shallowWithIntl(
            <EditPost {...props}/>,
        );
        const instance = wrapper.instance();
        instance.emitEditing = jest.fn();
        instance.setState = jest.fn();

        await instance.onEditPost();

        expect(instance.emitEditing.mock.calls).toEqual([
            [true],
            [false],
        ]);
        expect(instance.setState.mock.calls).toEqual([
            [{editing: true, error: null, errorExtra: null}],
            [{editing: false, error}, instance.focus],
        ]);
    });

    test('should handle edit post action success', async () => {
        const props = {
            ...baseProps,
            actions: {
                editPost: jest.fn().mockResolvedValueOnce({}),
            },
        };

        const wrapper = shallowWithIntl(
            <EditPost {...props}/>,
        );
        const instance = wrapper.instance();
        instance.emitEditing = jest.fn();
        instance.setState = jest.fn();

        await instance.onEditPost();

        expect(instance.emitEditing.mock.calls).toEqual([
            [true],
            [false],
        ]);
        expect(instance.setState.mock.calls).toEqual([
            [{editing: true, error: null, errorExtra: null}],
            [{editing: false}, instance.close],
        ]);
    });
});
