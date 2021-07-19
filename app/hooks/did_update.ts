// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useRef, useEffect, EffectCallback, DependencyList} from 'react';

function useDidUpdate(callback: EffectCallback, deps?: DependencyList) {
    const hasMount = useRef(false);

    useEffect(() => {
        if (hasMount.current) {
            callback();
        } else {
            hasMount.current = true;
        }
    }, deps);
}

export default useDidUpdate;
