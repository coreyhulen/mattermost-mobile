// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {createTransform} from 'redux-persist';
import {AsyncNodeStorage} from 'redux-persist-node-storage';

import configureStore from '@store';

export default async function testConfigureStore(preloadedState) {
    const storageTransform = createTransform(
        () => ({}),
        () => ({}),
    );

    const persistConfig = {
        key: 'root',
        storage: new AsyncNodeStorage('./.tmp'),
        whitelist: [],
        serialize: true,
        deserialize: true,
        transforms: [
            storageTransform,
        ],
    };
    const {store} = configureStore(null, preloadedState, persistConfig, {enableBuffer: false});

    const wait = () => new Promise((resolve) => setTimeout(resolve), 300); //eslint-disable-line
    await wait();

    return store;
}

// This should probably be replaced by redux-mock-store like the web app
export function mockDispatch(dispatch) {
    const mocked = (action) => {
        dispatch(action);

        mocked.actions.push(action);
    };

    mocked.actions = [];

    return mocked;
}
