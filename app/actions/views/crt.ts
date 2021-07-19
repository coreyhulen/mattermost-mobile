// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PreferenceTypes} from '@mm-redux/action_types';
import {General, Preferences} from '@mm-redux/constants';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getCollapsedThreadsPreference} from '@mm-redux/selectors/entities/preferences';
import type {ActionResult, DispatchFunc, GetStateFunc} from '@mm-redux/types/actions';
import type {PreferenceType} from '@mm-redux/types/preferences';

import EventEmitter from '@mm-redux/utils/event_emitter';

export function handleCRTPreferenceChange(preferences: PreferenceType[]) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        const state = getState();
        const newCRTPreference = preferences.find((preference) => preference.name === Preferences.COLLAPSED_REPLY_THREADS);
        if (newCRTPreference && getConfig(state).CollapsedThreads !== undefined) {
            const newCRTValue = newCRTPreference.value;
            const oldCRTValue = getCollapsedThreadsPreference(state);
            if (newCRTValue !== oldCRTValue) {
                dispatch({
                    type: PreferenceTypes.RECEIVED_PREFERENCES,
                    data: preferences,
                });
                EventEmitter.emit(General.CRT_PREFERENCE_CHANGED, newCRTValue);
                return {data: true};
            }
        }
        return {data: false};
    };
}
