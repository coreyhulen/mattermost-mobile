// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import moment from 'moment-timezone';

import Preferences from '@mm-redux/constants/preferences';
import * as PreferenceSelectors from '@mm-redux/selectors/entities/preferences';
import {renderWithReduxIntl} from 'test/testing_library';
import CustomStatusExpiry from './custom_status_expiry';

jest.mock('@mm-redux/selectors/entities/preferences');

describe('components/custom_status/custom_status_expiry', () => {
    const date = moment().endOf('day');

    const baseProps = {
        theme: Preferences.THEMES.default,
        time: date.toDate(),
    };

    (PreferenceSelectors.getBool as jest.Mock).mockReturnValue(false);
    it('should match snapshot', () => {
        const wrapper = renderWithReduxIntl(
            <CustomStatusExpiry
                {...baseProps}
            />,
        );
        expect(wrapper.toJSON()).toMatchSnapshot();
        expect(wrapper.getByText('Today')).toBeDefined();
    });

    it('should match snapshot with prefix and brackets', () => {
        const props = {
            ...baseProps,
            showPrefix: true,
            withinBrackets: true,
        };
        const wrapper = renderWithReduxIntl(
            <CustomStatusExpiry
                {...props}
            />,
        );
        expect(wrapper.toJSON()).toMatchSnapshot();
        expect(wrapper.getByText('Until')).toBeDefined();
        expect(wrapper.getByText('Today')).toBeDefined();
    });

    it("should render Tomorrow if given tomorrow's date", () => {
        const props = {
            ...baseProps,
            time: moment().add(1, 'day').endOf('day').toDate(),
        };
        const wrapper = renderWithReduxIntl(
            <CustomStatusExpiry
                {...props}
            />,
        );
        expect(wrapper.getByText('Tomorrow')).toBeDefined();
    });
});
