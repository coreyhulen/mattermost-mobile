// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import shallowEqual from 'shallow-equals';

// Returns a function that will construct a memoized array of its arguments for use as
// the extraData prop for a ListView so that its rows can be re-rendered even if the items
// themselves don't change.
export function makeExtraData() {
    let lastArgs: any[] = [];

    // Returns an array containing the arguments provided to this function.
    // If this function is called twice in a row with the same arguments,
    // it will return the exact same array.
    return (...args: any[]) => {
        if (!shallowEqual(lastArgs, args)) {
            lastArgs = args;
        }

        return lastArgs;
    };
}
