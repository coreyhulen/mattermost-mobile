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
import {AutocompleteSuggestion} from '@mm-redux/types/integrations';
import {Theme} from '@mm-redux/types/preferences';
import {makeStyleSheetFromTheme} from '@utils/theme';

import SlashSuggestionItem from '../slash_suggestion_item';
import {AppCommandParser} from '../app_command_parser/app_command_parser';
import {COMMAND_SUGGESTION_CHANNEL, COMMAND_SUGGESTION_USER, ExtendedAutocompleteSuggestion} from '../app_command_parser/app_command_parser_dependencies';
import AtMentionItem from '@components/autocomplete/at_mention_item';
import ChannelMentionItem from '@components/autocomplete/channel_mention_item';

export type Props = {
    currentTeamId: string;
    isSearch?: boolean;
    maxListHeight?: number;
    theme: Theme;
    onChangeText: (text: string) => void;
    onResultCountChange: (count: number) => void;
    value: string;
    nestedScrollEnabled?: boolean;
    rootId?: string;
    channelId: string;
    appsEnabled: boolean;
};

type State = {
    active: boolean;
    dataSource: AutocompleteSuggestion[];
}

export default class AppSlashSuggestion extends PureComponent<Props, State> {
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
    };

    constructor(props: Props, context: any) {
        super(props);
        this.appCommandParser = new AppCommandParser(null, context.intl, props.channelId, props.currentTeamId, props.rootId);
    }

    setActive(active: boolean) {
        this.setState({active});
    }

    componentDidUpdate(prevProps: Props) {
        if (!isMinimumServerVersion(Client4.getServerVersion(), 5, 24) || !this.props.appsEnabled) {
            this.setActive(false);
            this.props.onResultCountChange(0);
            return;
        }

        if (
            (this.props.value === prevProps.value) ||
            this.props.isSearch || this.props.value.startsWith('//') || !this.props.channelId
        ) {
            this.props.onResultCountChange(0);
            return;
        }

        const {
            value: nextValue,
        } = this.props;

        if (nextValue[0] !== '/') {
            this.setActive(false);
            this.props.onResultCountChange(0);
            return;
        }

        if (nextValue.indexOf(' ') === -1) { // delegate base command to command parser
            this.setActive(false);
            this.props.onResultCountChange(0);
            return;
        }

        if (!this.isAppCommand(nextValue, this.props.channelId, this.props.currentTeamId, this.props.rootId)) {
            this.setActive(false);
            this.props.onResultCountChange(0);
            return;
        }

        this.fetchAndShowAppCommandSuggestions(nextValue, this.props.channelId, this.props.currentTeamId, this.props.rootId);
    }

    isAppCommand = (pretext: string, channelID: string, teamID = '', rootID?: string) => {
        this.appCommandParser.setChannelContext(channelID, teamID, rootID);
        return this.appCommandParser.isAppCommand(pretext);
    }

    fetchAndShowAppCommandSuggestions = async (pretext: string, channelID: string, teamID = '', rootID?: string) => {
        this.appCommandParser.setChannelContext(channelID, teamID, rootID);
        const suggestions = await this.appCommandParser.getSuggestions(pretext);
        this.updateSuggestions(suggestions);
    }

    updateSuggestions = (matches: ExtendedAutocompleteSuggestion[]) => {
        this.setState({
            active: Boolean(matches.length),
            dataSource: matches,
        });
        this.props.onResultCountChange(matches.length);
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

    completeUserSuggestion = (base: string): (username: string) => void => {
        return () => {
            this.completeSuggestion(base);
        };
    }

    completeChannelMention = (base: string): (channelName: string) => void => {
        return () => {
            this.completeSuggestion(base);
        };
    }

    keyExtractor = (item: ExtendedAutocompleteSuggestion): string => item.Suggestion + item.type + item.item;

    renderItem = ({item}: {item: ExtendedAutocompleteSuggestion}) => {
        switch (item.type) {
        case COMMAND_SUGGESTION_USER:
            return (
                <AtMentionItem
                    testID={`autocomplete.at_mention.item.${item.item}`}
                    onPress={this.completeUserSuggestion(item.Complete)}
                    userId={item.item || ''}
                />
            );
        case COMMAND_SUGGESTION_CHANNEL:
            return (
                <ChannelMentionItem
                    channelId={item.item || ''}
                    onPress={this.completeChannelMention(item.Complete)}
                />
            );
        default:
            return (
                <SlashSuggestionItem
                    description={item.Description}
                    hint={item.Hint}
                    onPress={this.completeSuggestion}
                    theme={this.props.theme}
                    suggestion={item.Suggestion}
                    complete={item.Complete}
                    icon={item.IconData}
                />
            );
        }
    }

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
                testID='app_slash_suggestion.list'
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
