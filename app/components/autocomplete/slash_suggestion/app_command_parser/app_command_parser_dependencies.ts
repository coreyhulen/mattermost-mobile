// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type {
    AppCallRequest,
    AppBinding,
    AppField,
    AppSelectOption,
    AppCallResponse,
    AppCallValues,
    AppContext,
    AppForm,
    AutocompleteElement,
    AutocompleteDynamicSelect,
    AutocompleteStaticSelect,
    AutocompleteUserSelect,
    AutocompleteChannelSelect,
    AppLookupResponse,
    UserAutocomplete,
} from '@mm-redux/types/apps';

export type {
    DoAppCallResult,
} from 'types/actions/apps';

import type {
    AutocompleteSuggestion,
} from '@mm-redux/types/integrations';
export type {AutocompleteSuggestion};

export type {
    Channel,
} from '@mm-redux/types/channels';

export type {
    GlobalState,
} from '@mm-redux/types/store';

import {
    ActionFunc,
    DispatchFunc,
} from '@mm-redux/types/actions';
export type {
    DispatchFunc,
};

export type {
    UserProfile,
} from '@mm-redux/types/users';

export {
    AppBindingLocations,
    AppCallTypes,
    AppFieldTypes,
    AppCallResponseTypes,
    COMMAND_SUGGESTION_ERROR,
    COMMAND_SUGGESTION_CHANNEL,
    COMMAND_SUGGESTION_USER,
} from '@mm-redux/constants/apps';

export {makeAppBindingsSelector} from '@mm-redux/selectors/entities/apps';

export {getPost} from '@mm-redux/selectors/entities/posts';
export {getChannel as selectChannel, getCurrentChannel, getChannelByName as selectChannelByName} from '@mm-redux/selectors/entities/channels';

import {getCurrentTeamId, getCurrentTeam} from '@mm-redux/selectors/entities/teams';
export {
    getCurrentTeamId,
    getCurrentTeam,
};

export {getUserByUsername as selectUserByUsername, getUser as selectUser} from '@mm-redux/selectors/entities/users';

import {getUserByUsername, getUser, autocompleteUsers} from '@mm-redux/actions/users';
export {
    getUserByUsername,
    getUser,
    autocompleteUsers,
};

export {getChannelByNameAndTeamName, getChannel, autocompleteChannels} from '@mm-redux/actions/channels';

export {doAppCall} from '@actions/apps';
export {createCallRequest} from '@utils/apps';

import Store from '@store/store';
export const getStore = () => Store.redux;

export const autocompleteUsersInChannel = (prefix: string, channelID: string): ActionFunc => {
    return async (dispatch, getState) => {
        const state = getState();
        const currentTeamID = getCurrentTeamId(state);
        return dispatch(autocompleteUsers(prefix, currentTeamID, channelID));
    };
};

export const EXECUTE_CURRENT_COMMAND_ITEM_ID = '_execute_current_command';

export type ExtendedAutocompleteSuggestion = AutocompleteSuggestion & {
    type?: string;
    item?: string;
}

import type {ParsedCommand} from './app_command_parser';
export const getExecuteSuggestion = (_: ParsedCommand): AutocompleteSuggestion | null => { // eslint-disable-line @typescript-eslint/no-unused-vars
    return null;
};

import {Alert} from 'react-native';
import {intlShape} from 'react-intl';

export const displayError = (intl: typeof intlShape, body: string) => {
    const title = intl.formatMessage({
        id: 'mobile.general.error.title',
        defaultMessage: 'Error',
    });
    Alert.alert(title, body);
};

export const errorMessage = (intl: typeof intlShape, error: string, _command: string, _position: number): string => { // eslint-disable-line @typescript-eslint/no-unused-vars
    return intl.formatMessage({
        id: 'apps.error.parser',
        defaultMessage: 'Parsing error: {error}',
    }, {
        error,
    });
};

export {
    getChannelSuggestions,
    getUserSuggestions,
    inTextMentionSuggestions,
} from '@utils/mentions';
