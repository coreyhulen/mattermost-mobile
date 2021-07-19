// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators, Dispatch} from 'redux';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';

import {GlobalState} from '@mm-redux/types/store';
import {getAutocompleteCommands, getCommandAutocompleteSuggestions} from '@mm-redux/actions/integrations';
import {getAutocompleteCommandsList, getCommandAutocompleteSuggestionsList} from '@mm-redux/selectors/entities/integrations';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';

import {appsEnabled} from '@utils/apps';

import SlashSuggestion from './slash_suggestion';

// TODO: Remove when all below commands have been implemented
const COMMANDS_TO_IMPLEMENT_LATER = ['collapse', 'expand', 'join', 'open', 'leave', 'logout', 'msg', 'grpmsg'];
const NON_MOBILE_COMMANDS = ['rename', 'invite_people', 'shortcuts', 'search', 'help', 'settings', 'remove'];

const COMMANDS_TO_HIDE_ON_MOBILE = [...COMMANDS_TO_IMPLEMENT_LATER, ...NON_MOBILE_COMMANDS];

const mobileCommandsSelector = createSelector(
    getAutocompleteCommandsList,
    (commands) => {
        return commands.filter((command) => !COMMANDS_TO_HIDE_ON_MOBILE.includes(command.trigger));
    },
);

const appsTakeOverProps = {
    commands: [],
    currentTeamId: '',
    theme: {},
    suggestions: [],
    appsEnabled: true,
};

function mapStateToProps(state: GlobalState, ownProps: {appsTakeOver: boolean}) {
    if (ownProps.appsTakeOver) {
        // Return empty values for the required fields.
        return appsTakeOverProps;
    }

    return {
        commands: mobileCommandsSelector(state),
        currentTeamId: getCurrentTeamId(state),
        theme: getTheme(state),
        suggestions: getCommandAutocompleteSuggestionsList(state),
        appsEnabled: appsEnabled(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        actions: bindActionCreators({
            getAutocompleteCommands,
            getCommandAutocompleteSuggestions,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SlashSuggestion);
