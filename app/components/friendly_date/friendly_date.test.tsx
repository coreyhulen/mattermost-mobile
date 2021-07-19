// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {renderWithIntl} from 'test/testing_library';

import FriendlyDate from './index';

describe('Friendly Date', () => {
    it('should render correctly', () => {
        const justNow = new Date();
        justNow.setSeconds(justNow.getSeconds() - 10);
        const justNowText = renderWithIntl(
            <FriendlyDate value={justNow}/>,
        );
        expect(justNowText.getByText('Now')).toBeTruthy();

        const minutesAgo = new Date();
        minutesAgo.setMinutes(minutesAgo.getMinutes() - 1);
        const minutesAgoText = renderWithIntl(
            <FriendlyDate value={minutesAgo}/>,
        );
        expect(minutesAgoText.getByText('1 min ago')).toBeTruthy();

        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - 4);
        const hoursAgoText = renderWithIntl(
            <FriendlyDate value={hoursAgo}/>,
        );
        expect(hoursAgoText.getByText('4 hours ago')).toBeTruthy();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayText = renderWithIntl(
            <FriendlyDate value={yesterday}/>,
        );
        expect(yesterdayText.getByText('Yesterday')).toBeTruthy();

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - 10);
        const daysAgoText = renderWithIntl(
            <FriendlyDate value={daysAgo}/>,
        );
        expect(daysAgoText.getByText('10 days ago')).toBeTruthy();

        // Difference is less than 30 days
        const daysEdgeCase = new Date('2020/02/28');
        const daysEdgeCaseTodayDate = new Date('2020/03/28');
        const daysEdgeCaseText = renderWithIntl(
            <FriendlyDate
                sourceDate={daysEdgeCaseTodayDate}
                value={daysEdgeCase}
            />,
        );
        expect(daysEdgeCaseText.getByText('1 month ago')).toBeTruthy();

        const daysAgoMax = new Date('2020/03/06');
        const daysAgoMaxTodayDate = new Date('2020/04/05');
        const daysAgoMaxText = renderWithIntl(
            <FriendlyDate
                sourceDate={daysAgoMaxTodayDate}
                value={daysAgoMax}
            />,
        );
        expect(daysAgoMaxText.getByText('30 days ago')).toBeTruthy();

        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - 2);
        const monthsAgoText = renderWithIntl(
            <FriendlyDate value={monthsAgo}/>,
        );
        expect(monthsAgoText.getByText('2 months ago')).toBeTruthy();

        const yearsAgo = new Date();
        yearsAgo.setFullYear(yearsAgo.getFullYear() - 2);
        const yearsAgoText = renderWithIntl(
            <FriendlyDate value={yearsAgo}/>,
        );
        expect(yearsAgoText.getByText('2 years ago')).toBeTruthy();
    });
});
