// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {IntegrationTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {Command, AutocompleteSuggestion} from '@mm-redux/types/integrations';
import {Dictionary, IDMappedObjects} from '@mm-redux/types/utilities';

function commands(state: IDMappedObjects<Command> = {}, action: GenericAction) {
    switch (action.type) {
    case IntegrationTypes.RECEIVED_COMMANDS: {
        const nextState = {...state};
        for (const command of action.data) {
            if (command.id) {
                const id = command.id;
                nextState[id] = command;
            }
        }

        return nextState;
    }
    case IntegrationTypes.RECEIVED_COMMAND:
        if (action.data.id) {
            return {
                ...state,
                [action.data.id]: action.data,
            };
        }

        return state;
    case IntegrationTypes.RECEIVED_COMMAND_TOKEN: {
        const {id, token} = action.data;
        return {
            ...state,
            [id]: {
                ...state[id],
                token,
            },
        };
    }
    case IntegrationTypes.DELETED_COMMAND: {
        const nextState = {...state};
        Reflect.deleteProperty(nextState, action.data.id);
        return nextState;
    }

    default:
        return state;
    }
}

function systemCommands(state: IDMappedObjects<Command> = {}, action: GenericAction) {
    switch (action.type) {
    case IntegrationTypes.RECEIVED_COMMANDS: {
        const nextCommands: Dictionary<Command> = {};
        for (const command of action.data) {
            if (!command.id) {
                nextCommands[command.trigger] = command;
            }
        }
        return nextCommands;
    }
    case IntegrationTypes.RECEIVED_COMMAND:
        if (!action.data.id) {
            return {
                ...state,
                [action.data.trigger]: action.data,
            };
        }

        return state;

    default:
        return state;
    }
}

function commandAutocompleteSuggestions(state: Array<AutocompleteSuggestion> = [], action: GenericAction) {
    switch (action.type) {
    case IntegrationTypes.RECEIVED_COMMAND_SUGGESTIONS:
        return action.data;
    case IntegrationTypes.RECEIVED_COMMAND_SUGGESTIONS_FAILURE:
        return [];
    default:
        return state;
    }
}

function dialogTriggerId(state = '', action: GenericAction) {
    switch (action.type) {
    case IntegrationTypes.RECEIVED_DIALOG_TRIGGER_ID:
        return action.data;
    default:
        return state;
    }
}

function dialog(state = '', action: GenericAction) {
    switch (action.type) {
    case IntegrationTypes.RECEIVED_DIALOG:
        return action.data;
    default:
        return state;
    }
}

export default combineReducers({

    // object to represent installed slash commands for a current team
    commands,

    // object to represent built-in slash commands
    systemCommands,

    // trigger ID for interactive dialogs
    dialogTriggerId,

    // data for an interactive dialog to display
    dialog,

    // object represents slash command autocomplete suggestions
    commandAutocompleteSuggestions,
});
