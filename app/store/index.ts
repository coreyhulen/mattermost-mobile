// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AsyncStorage from '@react-native-community/async-storage';

import DeviceInfo from 'react-native-device-info';
import * as redux from 'redux';
import {createPersistoid, createTransform, persistReducer, persistStore, Persistor, PersistConfig} from 'redux-persist';
import {createBlacklistFilter} from 'redux-persist-transform-filter';

import {General} from '@mm-redux/constants';
import serviceReducer from '@mm-redux/reducers';
import {GenericAction} from '@mm-redux/types/actions';
import {GlobalState} from '@mm-redux/types/store';
import initialState from '@store/initial_state';

import appReducer from 'app/reducers';

import {createReducer, getStoredState} from './helpers';
import {createMiddlewares} from './middlewares';
import Store from './store';
import {transformSet, serialize} from './utils';

/**
 * Configures and constructs the redux store. Accepts the following parameters:
 * preloadedState - Any preloaded state to be applied to the store after it is initially configured.
 * appReducer - An object containing any app-specific reducer functions that the client needs.
 * persistConfig - Configuration for redux-persist.
 * getAppReducer - A function that returns the appReducer as defined above. Only used in development to enable hot reloading.
 * clientOptions - An object containing additional options used when configuring the redux store. The following options are available:
 *     additionalMiddleware - func | array - Allows for single or multiple additional middleware functions to be passed in from the client side.
 *     enableBuffer - bool - default = true - If true, the store will buffer all actions until offline state rehydration occurs.
 *     enableThunk - bool - default = true - If true, include the thunk middleware automatically. If false, thunk must be provided as part of additionalMiddleware.
 */

export type ReduxStore = {
    store: redux.Store;
    persistor: Persistor;
}

type ClientOptions = {
    enableBuffer: boolean;
    enableThunk: boolean;
}

type V4Store = {
    storeKeys: Array<string>;
    restoredState: any;
}

const usersSetTransform = [
    'profilesInChannel',
    'profilesNotInChannel',
    'profilesInTeam',
    'profilesNotInTeam',
];

const channelSetTransform = [
    'channelsInTeam',
];

const rolesSetTransform = [
    'pending',
];

const setTransforms = [
    ...usersSetTransform,
    ...channelSetTransform,
    ...rolesSetTransform,
];

const viewsBlackListFilter = createBlacklistFilter(
    'views',
    ['extension', 'root'],
);

const typingBlackListFilter = createBlacklistFilter(
    'entities',
    ['typing'],
);

const channelViewBlackList: any = {loading: true, refreshing: true, loadingPosts: true, retryFailed: true, loadMorePostsVisible: true};
const channelViewBlackListFilter = createTransform(
    (inboundState: any) => {
        const channel: any = {};
        const keys: Array<string> = inboundState.channel ? Object.keys(inboundState.channel) : [];

        for (const channelKey of keys) {
            if (!channelViewBlackList[channelKey]) {
                channel[channelKey] = inboundState.channel[channelKey];
            }
        }

        return {
            ...inboundState,
            channel,
        };
    },
    null,
    {whitelist: ['views']}, // Only run this filter on the views state (or any other entry that ends up being named views)
);

const emojiBlackList: any = {nonExistentEmoji: true};
const emojiBlackListFilter = createTransform(
    (inboundState: any) => {
        const emojis: any = {};
        const keys: Array<string> = inboundState.emojis ? Object.keys(inboundState.emojis) : [];

        for (const emojiKey of keys) {
            if (!emojiBlackList[emojiKey]) {
                emojis[emojiKey] = inboundState.emojis[emojiKey];
            }
        }

        return {
            ...inboundState,
            emojis,
        };
    },
    null,
    {whitelist: ['entities']}, // Only run this filter on the entities state (or any other entry that ends up being named entities)
);

const setTransformer = createTransform(
    (inboundState: any, key: string) => {
        if (key === 'entities') {
            const state = {...inboundState};
            for (const prop in state) {
                if (state.hasOwnProperty(prop)) {
                    state[prop] = transformSet(state[prop], setTransforms);
                }
            }

            return state;
        }

        return inboundState;
    },
    (outboundState: any, key: string) => {
        if (key === 'entities') {
            const state = {...outboundState};
            for (const prop in state) {
                if (state.hasOwnProperty(prop)) {
                    state[prop] = transformSet(state[prop], setTransforms, false);
                }
            }

            return state;
        }

        return outboundState;
    },
);

/**
 * Function to configure the redux store with persistence
 * @param storage the storage engine to use
 * @param preloadedState (optional) the initial state to use (applies to tests)
 * @param optionalConfig (optional) persist configuration (applies to tests)
 * @param optionalOptions (optional) middleware configuration (applies to tests)
 */
export default function configureStore(storage: any, preloadedState: any = {}, optionalConfig: any = {}, optionalOptions = {}): ReduxStore {
    const defaultOptions: ClientOptions = {
        enableBuffer: true,
        enableThunk: true,
    };

    const defaultConfig: PersistConfig<GlobalState> = {
        key: 'root',
        storage,
        serialize,
        deserialize: false,
        blacklist: ['device', 'navigation', 'requests', '_persist'],
        transforms: [
            setTransformer,
            viewsBlackListFilter,
            typingBlackListFilter,
            channelViewBlackListFilter,
            emojiBlackListFilter,
        ],
        throttle: 100,
        timeout: 60000,
    };

    const persistConfig: PersistConfig<GlobalState> = Object.assign({}, defaultConfig, optionalConfig);
    const baseState: any = Object.assign({}, initialState, preloadedState);
    const baseReducer: any = createReducer(serviceReducer as any, appReducer as any);
    const rootReducer: any = (state: GlobalState, action: GenericAction) => {
        if (action.type === General.OFFLINE_STORE_PURGE) {
            // eslint-disable-next-line no-underscore-dangle
            if (action.data?._persist) {
                // eslint-disable-next-line no-underscore-dangle
                delete action?.data?._persist;
            }
            return baseReducer(action.data, action as any);
        }
        return baseReducer(state as any, action as any);
    };
    const persistedReducer = persistReducer({...persistConfig}, rootReducer);
    const options: ClientOptions = Object.assign({}, defaultOptions, optionalOptions);

    const store = redux.createStore(
        persistedReducer,
        baseState,
        redux.compose(
            redux.applyMiddleware(
                ...createMiddlewares(options),
            ),
        ),
    );

    const persistor = persistStore(store, null);

    getStoredState().then(({storeKeys, restoredState}: V4Store) => {
        if (Object.keys(restoredState).length) {
            const {app} = restoredState;
            app.previousVersion = app.version;
            app.build = DeviceInfo.getBuildNumber();
            app.version = DeviceInfo.getVersion();

            const state = {
                ...restoredState,
                app: {
                    ...app,
                },
                views: {
                    ...restoredState.views,
                    root: {
                        hydrationComplete: false,
                    },
                },
                _persist: persistor.getState(),
            };

            store.dispatch({
                type: General.OFFLINE_STORE_PURGE,
                data: state,
            });

            console.log('HYDRATED FROM v4', storeKeys); // eslint-disable-line no-console
            const persistoid = createPersistoid(persistConfig);
            store.subscribe(() => {
                persistoid.update(store.getState());
            });
            store.dispatch({type: General.REHYDRATED});
            AsyncStorage.multiRemove(storeKeys);
        } else if (store.getState()._persist?.rehydrated) { // eslint-disable-line no-underscore-dangle
            store.dispatch({type: General.REHYDRATED});
        } else {
            let executed = false;
            const unsubscribe = store.subscribe(() => {
                if (store.getState()._persist?.rehydrated && !executed) { // eslint-disable-line no-underscore-dangle
                    unsubscribe();
                    executed = true;
                    store.dispatch({type: General.REHYDRATED});
                }
            });
        }
    });

    Store.redux = store;
    Store.persistor = persistor;

    return {store, persistor};
}
