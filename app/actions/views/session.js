// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment-timezone';

import {Client4} from '@client/rest';
import PushNotifications from '@init/push_notifications';
import {getSessions} from '@mm-redux/actions/users';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';

const sortByNewest = (a, b) => {
    if (a.create_at > b.create_at) {
        return -1;
    }

    return 1;
};

export function scheduleExpiredNotification(intl) {
    return async (dispatch, getState) => {
        const state = getState();
        const {currentUserId} = state.entities.users;
        const config = getConfig(state);

        if (isMinimumServerVersion(Client4.serverVersion, 5, 24) && config.ExtendSessionLengthWithActivity === 'true') {
            PushNotifications.cancelAllLocalNotifications();
            return;
        }

        let sessions;
        try {
            sessions = await dispatch(getSessions(currentUserId));
        } catch (e) {
            console.warn('Failed to get current session', e); // eslint-disable-line no-console
            return;
        }

        if (!Array.isArray(sessions.data)) {
            return;
        }

        const session = sessions.data.sort(sortByNewest)[0];
        const expiresAt = session?.expires_at || 0; //eslint-disable-line camelcase
        const expiresInDays = parseInt(Math.ceil(Math.abs(moment.duration(moment().diff(expiresAt)).asDays())), 10);

        const message = intl.formatMessage({
            id: 'mobile.session_expired',
            defaultMessage: 'Session Expired: Please log in to continue receiving notifications. Sessions for {siteName} are configured to expire every {daysCount, number} {daysCount, plural, one {day} other {days}}.',
        }, {
            siteName: config.SiteName,
            daysCount: expiresInDays,
        });

        if (expiresAt) {
            // eslint-disable-next-line no-console
            console.log('Schedule Session Expiry Local Push Notification', expiresAt);
            PushNotifications.scheduleNotification({
                fireDate: expiresAt,
                body: message,
                userInfo: {
                    local: true,
                },
            });
        }
    };
}
