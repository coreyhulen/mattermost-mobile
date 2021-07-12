// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useRef} from 'react';

import {UPDATE_NATIVE_SCROLLVIEW} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';

export const useResetNativeScrollView = (scrollViewNativeID: string | undefined, postIds: string[]) => {
    const prevPostCount = useRef(postIds.length);

    useEffect(() => {
        if (scrollViewNativeID) {
            EventEmitter.emit(UPDATE_NATIVE_SCROLLVIEW, scrollViewNativeID);
        }
    }, [scrollViewNativeID]);

    useEffect(() => {
        if (!prevPostCount.current && postIds.length) {
            EventEmitter.emit(UPDATE_NATIVE_SCROLLVIEW, scrollViewNativeID);
        }

        prevPostCount.current = postIds.length;
    }, [postIds]);
};
