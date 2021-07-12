// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';

export function dismissBanner(text) {
    return {
        type: ViewTypes.ANNOUNCEMENT_BANNER,
        data: text,
    };
}
