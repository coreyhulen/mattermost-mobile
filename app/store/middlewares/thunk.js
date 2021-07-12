// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    captureMessage,
    cleanUrlForLogging,
    LOGGER_JAVASCRIPT_WARNING,
} from '@utils/sentry';

// Creates middleware that mimics thunk while catching network errors thrown by Client4 that haven't
// been otherwise handled.
export default (store) => (next) => (action) => {
    if (typeof action === 'function') {
        const result = action(store.dispatch, store.getState);

        if (result instanceof Promise) {
            return result.catch((error) => {
                if (error.url) {
                    // This is a connection error from app/mm-redux. This should've been handled
                    // within the action itself, so we'll log to Sentry enough to identify where
                    // that handling is missing.
                    captureMessage(
                        `Caught Client4 error "${error.message}" from "${cleanUrlForLogging(error.url)}"`,
                        LOGGER_JAVASCRIPT_WARNING,
                        store,
                    );

                    return {error};
                }

                throw error;
            });
        }

        return result;
    }

    return next(action);
};
