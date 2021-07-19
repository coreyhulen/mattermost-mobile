// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CustomStatusDuration} from '@mm-redux/types/users';
import {t} from '@utils/i18n';

const {
    DONT_CLEAR,
    THIRTY_MINUTES,
    ONE_HOUR,
    FOUR_HOURS,
    TODAY,
    THIS_WEEK,
    DATE_AND_TIME,
} = CustomStatusDuration;

export const durationValues = {
    [DONT_CLEAR]: {
        id: t('custom_status.expiry_dropdown.dont_clear'),
        defaultMessage: "Don't clear",
    },
    [THIRTY_MINUTES]: {
        id: t('custom_status.expiry_dropdown.thirty_minutes'),
        defaultMessage: '30 minutes',
    },
    [ONE_HOUR]: {
        id: t('custom_status.expiry_dropdown.one_hour'),
        defaultMessage: '1 hour',
    },
    [FOUR_HOURS]: {
        id: t('custom_status.expiry_dropdown.four_hours'),
        defaultMessage: '4 hours',
    },
    [TODAY]: {
        id: t('custom_status.expiry_dropdown.today'),
        defaultMessage: 'Today',
    },
    [THIS_WEEK]: {
        id: t('custom_status.expiry_dropdown.this_week'),
        defaultMessage: 'This week',
    },
    [DATE_AND_TIME]: {
        id: t('custom_status.expiry_dropdown.date_and_time'),
        defaultMessage: 'Date and Time',
    },
};
export const CUSTOM_STATUS_TEXT_CHARACTER_LIMIT = 100;
export const SET_CUSTOM_STATUS_FAILURE = 'set_custom_status_failure';
