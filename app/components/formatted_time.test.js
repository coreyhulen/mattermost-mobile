// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment-timezone';
import React from 'react';

import {renderWithIntl} from '@test/testing_library';

import FormattedTime from './formatted_time';

describe('FormattedTime', () => {
    const baseProps = {
        value: 1548788533405,
        timezone: 'UTC',
        isMilitaryTime: false,
    };

    it('should render correctly', () => {
        console.error = jest.fn();

        const viewOne = renderWithIntl(
            <FormattedTime {...baseProps}/>,
        );

        expect(viewOne.toJSON()).toMatchSnapshot();
        expect(viewOne.getByText('7:02 PM')).toBeTruthy();

        const viewTwo = renderWithIntl(
            <FormattedTime
                {...baseProps}
                isMilitaryTime={true}
            />,
        );

        expect(viewTwo.toJSON()).toMatchSnapshot();
        expect(viewTwo.getByText('19:02')).toBeTruthy();
    });

    it('should support localization', () => {
        moment.locale('es');
        const esView = renderWithIntl(
            <FormattedTime {...baseProps}/>,
            'es',
        );

        expect(esView.toJSON()).toMatchSnapshot();
        expect(esView.getByText('7:02 PM')).toBeTruthy();

        moment.locale('ko');
        const koViewOne = renderWithIntl(
            <FormattedTime {...baseProps}/>,
            'ko',
        );

        expect(koViewOne.toJSON()).toMatchSnapshot();
        expect(koViewOne.getByText('오후 7:02')).toBeTruthy();

        const koViewTwo = renderWithIntl(
            <FormattedTime
                {...baseProps}
                isMilitaryTime={true}
            />,
            'ko',
        );

        expect(koViewTwo.toJSON()).toMatchSnapshot();
        expect(koViewTwo.getByText('19:02')).toBeTruthy();
    });

    it('should fallback to default short format for unsupported locale of react-intl ', () => {
        moment.locale('es');
        const viewOne = renderWithIntl(
            <FormattedTime
                {...baseProps}
                timezone='NZ-CHAT'
            />,
            'es',
        );

        expect(viewOne.toJSON()).toMatchSnapshot();
        expect(viewOne.getByText('8:47 AM')).toBeTruthy();

        const viewTwo = renderWithIntl(
            <FormattedTime
                {...baseProps}
                timezone='NZ-CHAT'
                isMilitaryTime={true}
            />,
            'es',
        );

        expect(viewTwo.toJSON()).toMatchSnapshot();
        expect(viewTwo.getByText('8:47')).toBeTruthy();
    });
});
