// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Q} from '@nozbe/watermelondb';
import moment from 'moment-timezone';
import {IntlShape} from 'react-intl';

import {Client4} from '@client/rest';
import {MM_TABLES} from '@constants/database';
import DatabaseConnectionException from '@database/exceptions/database_connection_exception';
import DatabaseManager from '@database/manager';
import PushNotifications from '@init/push_notifications';
import {getSessions} from '@requests/remote/user';
import System from '@typings/database/system';
import {isMinimumServerVersion} from '@utils/helpers';

const MAJOR_VERSION = 5;
const MINOR_VERSION = 24;

const sortByNewest = (a: any, b: any) => {
    if (a.create_at > b.create_at) {
        return -1;
    }

    return 1;
};

export const scheduleExpiredNotification = async (intl: IntlShape) => {
    const database = DatabaseManager.getActiveServerDatabase();
    if (!database) {
        throw new DatabaseConnectionException(
            'DatabaseManager.getActiveServerDatabase returned undefined',
        );
    }

    const systemRecords = (await database.collections.
        get(MM_TABLES.SERVER.SYSTEM).
        query(Q.where('name', Q.oneOf(['currentUserId', 'config']))).
        fetch()) as System[];

    const config = systemRecords.find((record) => record.name === 'config')?.value ?? {};
    const currentUserId = systemRecords.find((record) => record.name === 'currentUserId')?.value ?? '';
    if (isMinimumServerVersion(Client4.serverVersion, MAJOR_VERSION, MINOR_VERSION) && config.ExtendSessionLengthWithActivity === 'true') {
        PushNotifications.cancelAllLocalNotifications();
        return;
    }

    const timeOut = setTimeout(async () => {
        clearTimeout(timeOut);
        let sessions: any;

        try {
            sessions = await getSessions(currentUserId);
        } catch (e) {
            // console.warn('Failed to get current session', e);
            return;
        }

        if (!Array.isArray(sessions?.data)) {
            return;
        }

        const session = sessions.data.sort(sortByNewest)[0];
        const expiresAt = session?.expires_at || 0; //eslint-disable-line camelcase
        const expiresInDays = parseInt(String(Math.ceil(Math.abs(moment.duration(moment().diff(expiresAt)).asDays()))), 10);

        const message = intl.formatMessage(
            {
                id: 'mobile.session_expired',
                defaultMessage: 'Session Expired: Please log in to continue receiving notifications. Sessions for {siteName} are configured to expire every {daysCount, number} {daysCount, plural, one {day} other {days}}.'},
            {
                siteName: config.SiteName,
                daysCount: expiresInDays,
            },
        );

        if (expiresAt) {
            PushNotifications.scheduleNotification({
                fireDate: expiresAt,
                body: message,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                userInfo: {
                    local: true,
                },
            });
        }
    }, 20000);
};
