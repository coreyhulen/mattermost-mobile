// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isMinimumServerVersion} from '@utils/helpers';

export function isCustomStatusEnabled(config: ClientConfig) {
    const serverVersion = config.Version;
    return config?.EnableCustomUserStatuses === 'true' && isMinimumServerVersion(serverVersion, 5, 36);
}

