// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import shallowEqual from 'shallow-equals';

import Preferences from '@constants/preferences';
import {isMinimumServerVersion} from '@utils/helpers';

export function emptyFunction(e?: any) {// eslint-disable-line no-empty-function, @typescript-eslint/no-unused-vars
}

// Generates a RFC-4122 version 4 compliant globally unique identifier.
export const generateId = (): string => {
    // implementation taken from http://stackoverflow.com/a/2117523
    let id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    id = id.replace(/[xy]/g, (c) => {
        const r = Math.floor(Math.random() * 16);
        let v;

        if (c === 'x') {
            v = r;
        } else {
            // eslint-disable-next-line no-mixed-operators
            v = (r & 0x3) | 0x8;
        }

        return v.toString(16);
    });
    return id;
};

export const parseTheme = (theme: string) => {
    let parsedTheme: Theme = Preferences.THEMES.default;
    if (theme) {
        try {
            parsedTheme = JSON.parse(theme);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`Unable to parseTheme with input ${parsedTheme}`);
        }
    }
    return parsedTheme;
};

export function memoizeResult<F extends Function>(func: F): any {
    let lastArgs: IArguments | null = null;
    let lastResult: any = null;

    // we reference arguments instead of spreading them for performance reasons
    return function shallowCompare() {
        if (!shallowEqual(lastArgs, arguments)) {//eslint-disable-line prefer-rest-params
            // apply arguments instead of spreading for performance.
            const result = Reflect.apply(func, null, arguments); //eslint-disable-line prefer-rest-params
            if (!shallowEqual(lastResult, result)) {
                lastResult = result;
            }
        }

        lastArgs = arguments; //eslint-disable-line prefer-rest-params
        return lastResult;
    };
}

export function isCustomStatusEnabled(config: ClientConfig) {
    //fixme: isMinimumServerVersion has been modified here - is that correct ?
    return config && config.EnableCustomUserStatuses === 'true' && isMinimumServerVersion(config.Version, 5, 36);
}
