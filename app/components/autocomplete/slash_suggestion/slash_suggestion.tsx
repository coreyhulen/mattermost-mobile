// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {intlShape} from 'react-intl';
import React, {PureComponent} from 'react';
import {
    FlatList,
    Platform,
} from 'react-native';

import {analytics} from '@init/analytics';
import {Client4} from '@client/rest';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {Command, AutocompleteSuggestion, CommandArgs} from '@mm-redux/types/integrations';
import {Theme} from '@mm-redux/types/preferences';
import {makeStyleSheetFromTheme} from '@utils/theme';

import SlashSuggestionItem from './slash_suggestion_item';
import {AppCommandParser} from './app_command_parser/app_command_parser';

const TIME_BEFORE_NEXT_COMMAND_REQUEST = 1000 * 60 * 5;

export type Props = {
    actions: {
        getAutocompleteCommands: (channelID: string) => void;
        getCommandAutocompleteSuggestions: (value: string, teamID: string, args: CommandArgs) => void;
    };
    currentTeamId: string;
    commands: Command[];
    isSearch?: boolean;
    maxListHeight?: number;
    theme: Theme;
    onChangeText: (text: string) => void;
    onResultCountChange: (count: number) => void;
    value: string;
    nestedScrollEnabled?: boolean;
    suggestions: AutocompleteSuggestion[];
    rootId?: string;
    channelId: string;
    appsEnabled: boolean;
};

type State = {
    active: boolean;
    dataSource: AutocompleteSuggestion[];
    lastCommandRequest: number;
}

export default class SlashSuggestion extends PureComponent<Props, State> {
    static defaultProps = {
        defaultChannel: {},
        value: '',
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    appCommandParser: AppCommandParser;

    state = {
        active: false,
        dataSource: [],
        lastCommandRequest: 0,
    };

    constructor(props: Props, context: any) {
        super(props);
        this.appCommandParser = new AppCommandParser(null, context.intl, props.channelId, props.rootId);
    }

    setActive(active: boolean) {
        this.setState({active});
    }

    setLastCommandRequest(lastCommandRequest: number) {
        this.setState({lastCommandRequest});
    }

    componentDidUpdate(prevProps: Props) {
        if ((this.props.value === prevProps.value && this.props.suggestions === prevProps.suggestions && this.props.commands === prevProps.commands) ||
            this.props.isSearch || this.props.value.startsWith('//') || !this.props.channelId) {
            return;
        }

        const {currentTeamId} = prevProps;
        const {
            commands: nextCommands,
            currentTeamId: nextTeamId,
            value: nextValue,
            suggestions: nextSuggestions,
        } = this.props;

        if (nextValue[0] !== '/') {
            this.setActive(false);
            this.props.onResultCountChange(0);
            return;
        }

        if (nextValue.indexOf(' ') === -1) { // return suggestions for a top level cached commands
            if (currentTeamId !== nextTeamId) {
                this.setLastCommandRequest(0);
            }

            const dataIsStale = Date.now() - this.state.lastCommandRequest > TIME_BEFORE_NEXT_COMMAND_REQUEST;

            if ((!nextCommands.length || dataIsStale)) {
                this.props.actions.getAutocompleteCommands(this.props.currentTeamId);
                this.setLastCommandRequest(Date.now());
            }

            this.showBaseCommands(nextValue, nextCommands, prevProps.channelId, prevProps.rootId);
        } else if (isMinimumServerVersion(Client4.getServerVersion(), 5, 24)) {
            // If this is an app command, then hand it off to the app command parser.
            if (this.props.appsEnabled && this.isAppCommand(nextValue, prevProps.channelId, prevProps.rootId)) {
                this.fetchAndShowAppCommandSuggestions(nextValue, prevProps.channelId, prevProps.rootId);
            } else if (nextSuggestions === prevProps.suggestions) {
                const args = {
                    channel_id: prevProps.channelId,
                    team_id: prevProps.currentTeamId,
                    ...(prevProps.rootId && {root_id: prevProps.rootId}),
                };
                this.props.actions.getCommandAutocompleteSuggestions(nextValue, nextTeamId, args);
            } else {
                const matches: AutocompleteSuggestion[] = [];
                nextSuggestions.forEach((suggestion: AutocompleteSuggestion) => {
                    if (!this.contains(matches, '/' + suggestion.Complete)) {
                        matches.push(suggestion);
                    }
                });
                this.updateSuggestions(matches);
            }
        } else {
            this.setActive(false);
        }
    }

    showBaseCommands = (text: string, commands: Command[], channelID: string, rootID?: string) => {
        let matches: AutocompleteSuggestion[] = [];

        if (this.props.appsEnabled) {
            const appCommands = this.getAppBaseCommandSuggestions(text, channelID, rootID);
            matches = matches.concat(appCommands);
        }

        matches = matches.concat(this.filterCommands(text.substring(1), commands));

        matches.sort((match1, match2) => {
            if (match1.Suggestion === match2.Suggestion) {
                return 0;
            }
            return match1.Suggestion > match2.Suggestion ? 1 : -1;
        });

        this.updateSuggestions(matches);
    }

    isAppCommand = (pretext: string, channelID: string, rootID?: string) => {
        this.appCommandParser.setChannelContext(channelID, rootID);
        return this.appCommandParser.isAppCommand(pretext);
    }

    fetchAndShowAppCommandSuggestions = async (pretext: string, channelID: string, rootID?: string) => {
        this.appCommandParser.setChannelContext(channelID, rootID);
        const suggestions = await this.appCommandParser.getSuggestions(pretext);
        this.updateSuggestions(suggestions);
    }

    getAppBaseCommandSuggestions = (pretext: string, channelID: string, rootID?: string): AutocompleteSuggestion[] => {
        this.appCommandParser.setChannelContext(channelID, rootID);
        const suggestions = this.appCommandParser.getSuggestionsBase(pretext);
        return suggestions;
    }

    updateSuggestions = (matches: AutocompleteSuggestion[]) => {
        this.setState({
            active: Boolean(matches.length),
            dataSource: matches,
        });
        this.props.onResultCountChange(matches.length);
    }

    filterCommands = (matchTerm: string, commands: Command[]): AutocompleteSuggestion[] => {
        const data = commands.filter((command) => {
            if (!command.auto_complete) {
                return false;
            } else if (!matchTerm) {
                return true;
            }

            return command.display_name.startsWith(matchTerm) || command.trigger.startsWith(matchTerm);
        });
        return data.map((item) => {
            return {
                Complete: item.trigger,
                Suggestion: '/' + item.trigger,
                Hint: item.auto_complete_hint,
                Description: item.auto_complete_desc,
                IconData: item.icon_url || item.autocomplete_icon_data || '',
            };
        });
    }

    contains = (matches: AutocompleteSuggestion[], complete: string): boolean => {
        return matches.findIndex((match) => match.Complete === complete) !== -1;
    }

    completeSuggestion = (command: string) => {
        const {onChangeText} = this.props;
        analytics.trackCommand('complete_suggestion', `/${command} `);

        // We are going to set a double / on iOS to prevent the auto correct from taking over and replacing it
        // with the wrong value, this is a hack but I could not found another way to solve it
        let completedDraft = `/${command} `;
        if (Platform.OS === 'ios') {
            completedDraft = `//${command} `;
        }

        onChangeText(completedDraft);

        if (Platform.OS === 'ios') {
            // This is the second part of the hack were we replace the double / with just one
            // after the auto correct vanished
            setTimeout(() => {
                onChangeText(completedDraft.replace(`//${command} `, `/${command} `));
            });
        }

        if (!isMinimumServerVersion(Client4.getServerVersion(), 5, 24)) {
            this.setState({
                active: false,
            });
        }
    };

    keyExtractor = (item: Command & AutocompleteSuggestion): string => item.id || item.Suggestion;

    renderItem = ({item}: {item: AutocompleteSuggestion}) => (
        <SlashSuggestionItem
            description={item.Description}
            hint={item.Hint}
            onPress={this.completeSuggestion}
            theme={this.props.theme}
            suggestion={item.Suggestion}
            complete={item.Complete}
            icon={item.IconData}
        />
    )

    render() {
        const {maxListHeight, theme, nestedScrollEnabled} = this.props;

        if (!this.state.active) {
            // If we are not in an active state return null so nothing is rendered
            // other components are not blocked.
            return null;
        }

        const style = getStyleFromTheme(theme);

        return (
            <FlatList
                testID='slash_suggestion.list'
                keyboardShouldPersistTaps='always'
                style={[style.listView, {maxHeight: maxListHeight}]}
                extraData={this.state}
                data={this.state.dataSource}
                keyExtractor={this.keyExtractor}
                removeClippedSubviews={true}
                renderItem={this.renderItem}
                nestedScrollEnabled={nestedScrollEnabled}
            />
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        listView: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
            paddingTop: 8,
            borderRadius: 4,
        },
    };
});
