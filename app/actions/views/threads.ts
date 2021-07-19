// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {ViewTypes} from '@constants';

export const handleViewingGlobalThreadsScreen = () => (
    {
        type: ViewTypes.VIEWING_GLOBAL_THREADS_SCREEN,
    }
);

export const handleNotViewingGlobalThreadsScreen = () => ({
    type: ViewTypes.NOT_VIEWING_GLOBAL_THREADS_SCREEN,
});

export const handleViewingGlobalThreadsAll = () => ({
    type: ViewTypes.VIEWING_GLOBAL_THREADS_ALL,
});

export const handleViewingGlobalThreadsUnreads = () => ({
    type: ViewTypes.VIEWING_GLOBAL_THREADS_UNREADS,
});
