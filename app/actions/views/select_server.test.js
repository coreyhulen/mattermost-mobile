// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {batchActions} from 'redux-batched-actions';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {handleServerUrlChanged} from '@actions/views/select_server';
import {ViewTypes} from '@constants';
import {GeneralTypes} from '@mm-redux/action_types';

const mockStore = configureStore([thunk]);

describe('Actions.Views.SelectServer', () => {
    let store;

    beforeEach(() => {
        store = mockStore({});
    });

    test('handleServerUrlChanged', () => {
        const serverUrl = 'https://mattermost.example.com';
        const actions = batchActions([
            {type: GeneralTypes.CLIENT_CONFIG_RESET},
            {type: GeneralTypes.CLIENT_LICENSE_RESET},
            {type: ViewTypes.SERVER_URL_CHANGED, serverUrl},
        ], 'BATCH_SERVER_URL_CHANGED');

        store.dispatch(handleServerUrlChanged(serverUrl));
        expect(store.getActions()).toEqual([actions]);
    });
});
