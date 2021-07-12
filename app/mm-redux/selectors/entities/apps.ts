// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {AppBinding} from '@mm-redux/types/apps';
import {GlobalState} from '@mm-redux/types/store';

export function getAppsBindings(state: GlobalState, location?: string): AppBinding[] {
    if (!state.entities.apps.bindings) {
        return [];
    }

    if (location) {
        const bindings = state.entities.apps.bindings.filter((b) => b.location === location);
        return bindings.reduce((accum: AppBinding[], current: AppBinding) => accum.concat(current.bindings || []), []);
    }
    return state.entities.apps.bindings;
}
