// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import FormattedText from '@components/formatted_text';
import {shallowWithIntl} from '@test/intl-test-helper';

import LoginOptions from './login_options';

describe('Login options', () => {
    const baseProps = {
        config: {
            Version: '5.32.0',
        },
        license: {
            IsLicensed: 'true',
        },
    };

    test('should show google signin button only when enabled', () => {
        const basicWrapper = shallowWithIntl(<LoginOptions {...baseProps}/>);
        expect(basicWrapper.find(FormattedText).find({id: 'signup.google'}).exists()).toBe(false);

        const props = {
            ...baseProps,
            config: {
                ...baseProps.config,
                EnableSignUpWithGoogle: 'true',
            },
        };
        const configuredWrapper = shallowWithIntl(<LoginOptions {...props}/>);
        expect(configuredWrapper.find(FormattedText).find({id: 'signup.google'}).exists()).toBe(true);
    });

    test('should show open id button only when enabled and from version 5.33', () => {
        const basicWrapper = shallowWithIntl(<LoginOptions {...baseProps}/>);
        expect(basicWrapper.find(FormattedText).find({id: 'signup.openid'}).exists()).toBe(false);

        const newVersionProps = {
            ...baseProps,
            config: {
                ...baseProps.config,
                EnableSignUpWithOpenId: 'true',
                Version: '5.33.0',
            },
        };
        const newVersionWrapper = shallowWithIntl(<LoginOptions {...newVersionProps}/>);
        expect(newVersionWrapper.find(FormattedText).find({id: 'signup.openid'}).exists()).toBe(true);

        const oldVersionProps = {
            ...baseProps,
            config: {
                ...baseProps.config,
                EnableSignUpWithOpenId: 'true',
                Version: '5.30.0',
            },
        };
        const oldVersionWrapper = shallowWithIntl(<LoginOptions {...oldVersionProps}/>);
        expect(oldVersionWrapper.find(FormattedText).find({id: 'signup.openid'}).exists()).toBe(false);
    });
});
