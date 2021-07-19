// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {INDICATOR_BAR_HEIGHT} from '@constants/view';

export const INITIAL_BATCH_TO_RENDER = 10;
export const SCROLL_POSITION_CONFIG = {

    // To avoid scrolling the list when new messages arrives
    // if the user is not at the bottom
    minIndexForVisible: 0,

    // If the user is at the bottom or 60px from the bottom
    // auto scroll show the new message
    autoscrollToTopThreshold: 60,
};
export const VIEWABILITY_CONFIG = {
    itemVisiblePercentThreshold: 1,
    minimumViewTime: 100,
};

const HIDDEN_TOP = -400;
const MAX_INPUT = 1;
const MIN_INPUT = 0;
const SHOWN_TOP = 0;
const INDICATOR_BAR_FACTOR = Math.abs(INDICATOR_BAR_HEIGHT / (HIDDEN_TOP - SHOWN_TOP));

export const MORE_MESSAGES = {
    CANCEL_TIMER_DELAY: 400,
    HIDDEN_TOP,
    INDICATOR_BAR_FACTOR,
    MAX_INPUT,
    MIN_INPUT,
    SHOWN_TOP,
    TOP_INTERPOL_CONFIG: {
        inputRange: [
            MIN_INPUT,
            MIN_INPUT + INDICATOR_BAR_FACTOR,
            MAX_INPUT - INDICATOR_BAR_FACTOR,
            MAX_INPUT,
        ],
        outputRange: [
            HIDDEN_TOP - INDICATOR_BAR_HEIGHT,
            HIDDEN_TOP,
            SHOWN_TOP,
            SHOWN_TOP + INDICATOR_BAR_HEIGHT,
        ],
        extrapolate: 'clamp',
    },
};
