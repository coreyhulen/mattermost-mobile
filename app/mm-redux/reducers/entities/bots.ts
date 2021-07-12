// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {BotTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {Bot} from '@mm-redux/types/bots';
import {Dictionary} from '@mm-redux/types/utilities';

function accounts(state: Dictionary<Bot> = {}, action: GenericAction) {
    switch (action.type) {
    case BotTypes.RECEIVED_BOT_ACCOUNTS: {
        const newBots = action.data;
        const nextState = {...state};
        for (const bot of newBots) {
            nextState[bot.user_id] = bot;
        }
        return nextState;
    }
    case BotTypes.RECEIVED_BOT_ACCOUNT: {
        const bot = action.data;
        const nextState = {...state};
        nextState[bot.user_id] = bot;
        return nextState;
    }
    default:
        return state;
    }
}

export default combineReducers({
    accounts,
});
