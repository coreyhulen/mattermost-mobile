// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';

export function handleSearchDraftChanged(text) {
    return {
        type: ViewTypes.SEARCH_DRAFT_CHANGED,
        text,
    };
}
