// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment-timezone';

import {loadConfigAndLicense} from '@actions/views/root';
import {Client4} from '@client/rest';
import {setAppCredentials} from '@init/credentials';
import PushNotifications from '@init/push_notifications';
import {GeneralTypes} from '@mm-redux/action_types';
import {getDataRetentionPolicy} from '@mm-redux/actions/general';
import {autoUpdateTimezone} from '@mm-redux/actions/timezone';
import {getSessions} from '@mm-redux/actions/users';
import {getConfig, getLicense} from '@mm-redux/selectors/entities/general';
import {isTimezoneEnabled} from '@mm-redux/selectors/entities/timezone';
import {getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {setCSRFFromCookie} from '@utils/security';
import {getDeviceTimezone} from '@utils/timezone';

export function handleSuccessfulLogin() {
    return async (dispatch, getState) => {
        await dispatch(loadConfigAndLicense());

        const state = getState();
        const config = getConfig(state);
        const license = getLicense(state);
        const token = Client4.getToken();
        const url = Client4.getUrl();
        const deviceToken = state.entities.general.deviceToken;
        const currentUserId = getCurrentUserId(state);

        await setCSRFFromCookie(url);
        setAppCredentials(deviceToken, currentUserId, token, url);

        const enableTimezone = isTimezoneEnabled(state);
        if (enableTimezone) {
            const timezone = getDeviceTimezone();
            dispatch(autoUpdateTimezone(timezone));
        }

        dispatch({
            type: GeneralTypes.RECEIVED_APP_CREDENTIALS,
            data: {
                url,
            },
        });

        if (config.DataRetentionEnableMessageDeletion && config.DataRetentionEnableMessageDeletion === 'true' &&
            license.IsLicensed === 'true' && license.DataRetention === 'true') {
            dispatch(getDataRetentionPolicy());
        } else {
            dispatch({type: GeneralTypes.RECEIVED_DATA_RETENTION_POLICY, data: {}});
        }

        return true;
    };
}

export function scheduleExpiredNotification(intl) {
    return (dispatch, getState) => {
        const state = getState();
        const {currentUserId} = state.entities.users;
        const {deviceToken} = state.entities.general;
        const config = getConfig(state);

        // Once the user logs in we are going to wait for 10 seconds
        // before retrieving the session that belongs to this device
        // to ensure that we get the actual session without issues
        // then we can schedule the local notification for the session expired
        setTimeout(async () => {
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

            const session = sessions.data.find((s) => s.device_id === deviceToken);
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
                PushNotifications.scheduleNotification({
                    fireDate: expiresAt,
                    body: message,
                    userInfo: {
                        local: true,
                    },
                });
            }
        }, 10000);
    };
}

export default {
    handleSuccessfulLogin,
    scheduleExpiredNotification,
};
