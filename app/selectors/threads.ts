// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {GlobalState} from '@mm-redux/types/store';

export function getViewingGlobalThreads(state: GlobalState): boolean {
    return state.views.threads.viewingGlobalThreads;
}

export function getViewingGlobalThreadsUnread(state: GlobalState): boolean {
    return state.views.threads.viewingGlobalThreadsUnreads;
}
