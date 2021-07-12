// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import {PureComponent} from 'react';
import {Platform} from 'react-native';
import {Navigation} from 'react-native-navigation';

import {Preferences} from '@mm-redux/constants';
import {getEmailInterval} from '@mm-redux/utils/notify_props';

export default class NotificationSettingsEmailBase extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            savePreferences: PropTypes.func.isRequired,
            updateMe: PropTypes.func.isRequired,
        }),
        currentUser: PropTypes.object.isRequired,
        notifyProps: PropTypes.object.isRequired,
        emailInterval: PropTypes.string.isRequired,
        enableEmailBatching: PropTypes.bool.isRequired,
        sendEmailNotifications: PropTypes.bool.isRequired,
        theme: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        const {
            notifyProps,
            emailInterval,
            enableEmailBatching,
            sendEmailNotifications,
        } = props;

        this.state = {
            emailInterval,
            newInterval: this.computeEmailInterval(notifyProps?.email === 'true' && sendEmailNotifications, enableEmailBatching, emailInterval),
            showEmailNotificationsModal: false,
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidDisappear() {
        if (this.getPlatformOS() === 'ios') {
            this.saveEmailNotifyProps();
        }
    }

    componentDidUpdate(prevProps) {
        this.setEmailIntervalIfNeeded(prevProps);
    }

    setEmailIntervalIfNeeded = (prevProps) => {
        const {
            notifyProps,
            sendEmailNotifications,
            enableEmailBatching,
            emailInterval,
        } = this.props;

        if (
            sendEmailNotifications !== prevProps.sendEmailNotifications ||
            enableEmailBatching !== prevProps.enableEmailBatching ||
            emailInterval !== prevProps.emailInterval ||
            notifyProps?.email !== prevProps.notifyProps?.email
        ) {
            this.setState({
                emailInterval,
                newInterval: this.computeEmailInterval(notifyProps?.email === 'true' && sendEmailNotifications, enableEmailBatching, emailInterval),
            });
        }
    }

    getPlatformOS = () => {
        return Platform.OS;
    }

    setEmailInterval = (value) => {
        this.setState({newInterval: value});
    };

    saveEmailNotifyProps = () => {
        const {emailInterval, newInterval} = this.state;

        if (emailInterval !== newInterval) {
            const {
                actions,
                currentUser,
                notifyProps,
                sendEmailNotifications,
            } = this.props;

            let email = 'false';
            if (sendEmailNotifications && newInterval !== Preferences.INTERVAL_NEVER.toString()) {
                email = 'true';
            }

            actions.updateMe({notify_props: {...notifyProps, email}});

            const emailIntervalPreference = {category: Preferences.CATEGORY_NOTIFICATIONS, user_id: currentUser.id, name: Preferences.EMAIL_INTERVAL, value: newInterval};
            actions.savePreferences(currentUser.id, [emailIntervalPreference]);
        }
    };

    computeEmailInterval = (sendEmailNotifications, enableEmailBatching, emailInterval) => {
        return getEmailInterval(
            sendEmailNotifications,
            enableEmailBatching,
            parseInt(emailInterval, 10),
        ).toString();
    }
}
