// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable max-nested-callbacks */

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import DateSeparator from './date_separator';

describe('DateHeader', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        timezone: null,
    };

    describe('component should match snapshot', () => {
        it('without suffix', () => {
            const props = {
                ...baseProps,
                date: 1531152392,
            };
            const wrapper = shallowWithIntl(
                <DateSeparator {...props}/>,
            );

            expect(wrapper.getElement()).toMatchSnapshot();
        });

        it('with suffix', () => {
            const props = {
                ...baseProps,
                date: 1531152392,
            };
            const wrapper = shallowWithIntl(
                <DateSeparator {...props}/>,
            );

            expect(wrapper.getElement()).toMatchSnapshot();
        });

        it('when timezone is set', () => {
            const props = {
                ...baseProps,
                date: 1531152392,
                timezone: 'America/New_York',
            };
            const wrapper = shallowWithIntl(
                <DateSeparator {...props}/>,
            );

            expect(wrapper.getElement()).toMatchSnapshot();
        });

        it('when timezone is UserTimezone automatic', () => {
            const props = {
                ...baseProps,
                date: 1531152392,
                timezone: {
                    useAutomaticTimezone: true,
                    automaticTimezone: 'America/New_York',
                    manualTimezone: 'America/Santiago',
                },
            };
            const wrapper = shallowWithIntl(
                <DateSeparator {...props}/>,
            );

            expect(wrapper.getElement()).toMatchSnapshot();
        });

        it('when timezone is UserTimezone manual', () => {
            const props = {
                ...baseProps,
                date: 1531152392,
                timezone: {
                    useAutomaticTimezone: false,
                    automaticTimezone: 'America/New_York',
                    manualTimezone: 'America/Santiago',
                },
            };
            const wrapper = shallowWithIntl(
                <DateSeparator {...props}/>,
            );

            expect(wrapper.getElement()).toMatchSnapshot();
        });
    });
});
