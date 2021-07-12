// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {intlShape} from 'react-intl';
import {Alert} from 'react-native';

import {handleSelectChannel, handleSelectChannelByName, loadChannelsByTeamName} from '@actions/views/channel';
import {makeDirectChannel} from '@actions/views/more_dms';
import {showPermalink} from '@actions/views/permalink';
import {Client4} from '@client/rest';
import {DeepLinkTypes} from '@constants';
import {analytics} from '@init/analytics';
import {IntegrationTypes} from '@mm-redux/action_types';
import {getUserByUsername} from '@mm-redux/actions/users';
import {General} from '@mm-redux/constants';
import {getCurrentChannelId} from '@mm-redux/selectors/entities/channels';
import {getConfig, getCurrentUrl} from '@mm-redux/selectors/entities/general';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {batchActions, DispatchFunc, GetStateFunc, ActionFunc} from '@mm-redux/types/actions';
import {Command, CommandArgs, DialogSubmission} from '@mm-redux/types/integrations';
import * as DraftUtils from '@utils/draft';
import {permalinkBadTeam} from '@utils/general';
import {getURLAndMatch, tryOpenURL} from '@utils/url';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary, requestSuccess, requestFailure} from './helpers';
import {makeGroupMessageVisibleIfNecessary} from './preferences';

export function getCommands(teamId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getCommandsList,
        onSuccess: [IntegrationTypes.RECEIVED_COMMANDS],
        params: [
            teamId,
        ],
    });
}

export function getAutocompleteCommands(teamId: string, page = 0, perPage: number = General.PAGE_SIZE_DEFAULT): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getAutocompleteCommandsList,
        onSuccess: [IntegrationTypes.RECEIVED_COMMANDS],
        params: [
            teamId,
            page,
            perPage,
        ],
    });
}

export function getCommandAutocompleteSuggestions(userInput: string, teamId: string, commandArgs: CommandArgs): ActionFunc {
    return async (dispatch: DispatchFunc) => {
        let data: unknown = null;
        try {
            analytics.trackCommand('get_suggestions_initiated', userInput);
            data = await Client4.getCommandAutocompleteSuggestionsList(userInput, teamId, commandArgs);
        } catch (error) {
            analytics.trackCommand('get_suggestions_failed', userInput, error.message);
            dispatch(batchActions([logError(error), requestFailure(IntegrationTypes.RECEIVED_COMMAND_SUGGESTIONS_FAILURE, error)]));
            return {error};
        }
        analytics.trackCommand('get_suggestions_success', userInput);
        dispatch(requestSuccess(IntegrationTypes.RECEIVED_COMMAND_SUGGESTIONS, data));
        return {data};
    };
}

export function addCommand(command: Command): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.addCommand,
        onSuccess: [IntegrationTypes.RECEIVED_COMMAND],
        params: [
            command,
        ],
    });
}

export function executeCommand(command: string, args: CommandArgs): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.executeCommand,
        params: [
            command,
            args,
        ],
    });
}

export function submitInteractiveDialog(submission: DialogSubmission): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        submission.channel_id = getCurrentChannelId(state);
        submission.team_id = getCurrentTeamId(state);

        let data;
        try {
            data = await Client4.submitInteractiveDialog(submission);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        return {data};
    };
}

export function handleGotoLocation(href: string, intl: typeof intlShape): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const config = getConfig(state);

        const {url, match} = await getURLAndMatch(href, getCurrentUrl(state), config.SiteURL);

        if (match) {
            switch (match.type) {
            case DeepLinkTypes.CHANNEL:
                dispatch(handleSelectChannelByName(match.channelName, match.teamName, DraftUtils.errorBadChannel, intl));
                break;
            case DeepLinkTypes.PERMALINK: {
                const {error} = await dispatch(loadChannelsByTeamName(match.teamName, () => permalinkBadTeam(intl)));
                if (!error && match.postId) {
                    dispatch(showPermalink(intl, match.teamName, match.postId));
                }
                break;
            }
            case DeepLinkTypes.DMCHANNEL: {
                if (!match.userName) {
                    DraftUtils.errorBadUser(intl);
                    return {data: false};
                }

                const {data} = await dispatch(getUserByUsername(match.userName));
                if (!data) {
                    DraftUtils.errorBadUser(intl);
                    return {data: false};
                }
                dispatch(makeDirectChannel(data.id));
                break;
            }
            case DeepLinkTypes.GROUPCHANNEL:
                if (!match.id) {
                    DraftUtils.errorBadChannel(intl);
                    return {data: false};
                }
                dispatch(makeGroupMessageVisibleIfNecessary(match.id));
                dispatch(handleSelectChannel(match.id));
                break;
            }
        } else {
            const {formatMessage} = intl;
            const onError = () => Alert.alert(
                formatMessage({
                    id: 'mobile.server_link.error.title',
                    defaultMessage: 'Link Error',
                }),
                formatMessage({
                    id: 'mobile.server_link.error.text',
                    defaultMessage: 'The link could not be found on this server.',
                }),
            );

            tryOpenURL(url, onError);
        }
        return {data: true};
    };
}
