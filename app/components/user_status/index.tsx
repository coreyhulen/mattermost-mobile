// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React from 'react';

import CompassIcon from '@components/compass_icon';
import {MM_TABLES} from '@constants/database';
import General from '@constants/general';
import {useTheme} from '@context/theme';
import {changeOpacity} from '@utils/theme';

import type {Database} from '@nozbe/watermelondb';
import type UserModel from '@typings/database/models/servers/user';

type UserStatusInputProps = {
    size: number;
    status: string;
    userId?: string;
};

type UserStatusProps = UserStatusInputProps & {
    user?: UserModel;
    database: Database;
};

const ConnectedUserStatus = ({size = 6, status = General.OFFLINE, user}: UserStatusProps) => {
    let iconName;
    let iconColor;
    const theme = useTheme();
    switch (user?.status) {
        case General.AWAY:
            iconName = 'clock';
            iconColor = theme.awayIndicator;
            break;
        case General.DND:
            iconName = 'minus-circle';
            iconColor = theme.dndIndicator;
            break;
        case General.ONLINE:
            iconName = 'check-circle';
            iconColor = theme.onlineIndicator;
            break;
        default:
            iconName = 'circle-outline';
            iconColor = changeOpacity('#B8B8B8', 0.64);
            break;
    }

    return (
        <CompassIcon
            name={iconName}
            style={{fontSize: size, color: iconColor}}
            testID={`user_status.icon.${status}`}
        />
    );
};

const UserStatus: React.FunctionComponent<UserStatusInputProps> = withDatabase(
    withObservables(['userId'], ({userId, database}: { userId?: string; database: Database }) => ({
        ...(userId && {user: database.collections.get(MM_TABLES.SERVER.USER).findAndObserve(userId)}),
    }))(ConnectedUserStatus),
);

export default UserStatus;
