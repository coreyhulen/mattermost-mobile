// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Platform, SectionList} from 'react-native';

import GroupMentionItem from '@components/autocomplete/at_mention_group/at_mention_group';
import AtMentionItem from '@components/autocomplete/at_mention_item';
import AutocompleteSectionHeader from '@components/autocomplete/autocomplete_section_header';
import SpecialMentionItem from '@components/autocomplete/special_mention_item';
import {AT_MENTION_REGEX, AT_MENTION_SEARCH_REGEX} from '@constants/autocomplete';
import {debounce} from '@mm-redux/actions/helpers';
import {RequestStatus} from '@mm-redux/constants';
import {t} from '@utils/i18n';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class AtMention extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            autocompleteUsers: PropTypes.func.isRequired,
        }).isRequired,
        currentChannelId: PropTypes.string,
        currentTeamId: PropTypes.string.isRequired,
        cursorPosition: PropTypes.number,
        defaultChannel: PropTypes.object,
        inChannel: PropTypes.array,
        isSearch: PropTypes.bool,
        matchTerm: PropTypes.string,
        maxListHeight: PropTypes.number,
        onChangeText: PropTypes.func.isRequired,
        onResultCountChange: PropTypes.func.isRequired,
        outChannel: PropTypes.array,
        requestStatus: PropTypes.string.isRequired,
        teamMembers: PropTypes.array,
        theme: PropTypes.object.isRequired,
        value: PropTypes.string,
        nestedScrollEnabled: PropTypes.bool,
        useChannelMentions: PropTypes.bool.isRequired,
        groups: PropTypes.array,
    };

    static defaultProps = {
        defaultChannel: {},
        isSearch: false,
        value: '',
        inChannel: [],
    };

    constructor(props) {
        super(props);

        this.state = {
            sections: [],
        };
    }

    runSearch = debounce((currentTeamId, channelId, matchTerm) => {
        this.props.actions.autocompleteUsers(matchTerm, currentTeamId, channelId);
    }, 200);

    updateSections(sections) {
        this.setState({sections});
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.matchTerm !== prevProps.matchTerm) {
            if (this.props.matchTerm === null) {
                this.updateSections([]);
            } else {
                const sections = this.buildSections(this.props);
                this.updateSections(sections);

                this.props.onResultCountChange(sections.reduce((total, section) => total + section.data.length, 0));

                // Update user autocomplete list with results of server request
                const {currentTeamId, currentChannelId, matchTerm} = this.props;
                const channelId = this.props.isSearch ? '' : currentChannelId;
                this.runSearch(currentTeamId, channelId, matchTerm);
            }
        }
        if (this.props.matchTerm !== null && this.props.matchTerm === prevProps.matchTerm) {
            if (
                this.props.groups !== prevProps.groups ||
                    (
                        this.props.requestStatus !== RequestStatus.STARTED &&
                        (this.props.inChannel !== prevProps.inChannel || this.props.outChannel !== prevProps.outChannel || this.props.teamMembers !== prevProps.teamMembers)
                    )
            ) {
                const sections = this.buildSections(this.props);
                this.updateSections(sections);
                this.props.onResultCountChange(sections.reduce((total, section) => total + section.data.length, 0));
            }
        }
        if (prevState.sections.length !== this.state.sections.length && this.state.sections.length === 0) {
            this.props.onResultCountChange(0);
        }
    }

    buildSections = (props) => {
        const {isSearch, inChannel, outChannel, teamMembers, matchTerm, groups} = props;
        const sections = [];

        if (isSearch) {
            sections.push({
                id: t('mobile.suggestion.members'),
                defaultMessage: 'Members',
                data: teamMembers,
                key: 'teamMembers',
            });
        } else {
            if (inChannel.length) {
                sections.push({
                    id: t('suggestion.mention.members'),
                    defaultMessage: 'Channel Members',
                    data: inChannel,
                    key: 'inChannel',
                });
            }

            if (groups.length) {
                sections.push({
                    id: t('suggestion.mention.groups'),
                    defaultMessage: 'Group Mentions',
                    data: groups,
                    key: 'groups',
                    renderItem: this.renderGroupMentions,
                });
            }

            if (this.props.useChannelMentions && this.checkSpecialMentions(matchTerm)) {
                sections.push({
                    id: t('suggestion.mention.special'),
                    defaultMessage: 'Special Mentions',
                    data: this.getSpecialMentions(),
                    key: 'special',
                    renderItem: this.renderSpecialMentions,
                });
            }

            if (outChannel.length) {
                sections.push({
                    id: t('suggestion.mention.nonmembers'),
                    defaultMessage: 'Not in Channel',
                    data: outChannel,
                    key: 'outChannel',
                });
            }
        }

        return sections;
    };

    keyExtractor = (item) => {
        return item.id || item;
    };

    getSpecialMentions = () => {
        return [{
            completeHandle: 'all',
            id: t('suggestion.mention.all'),
            defaultMessage: 'Notifies everyone in this channel',
            values: {
                townsquare: this.props.defaultChannel.display_name,
            },
        }, {
            completeHandle: 'channel',
            id: t('suggestion.mention.channel'),
            defaultMessage: 'Notifies everyone in this channel',
        }, {
            completeHandle: 'here',
            id: t('suggestion.mention.here'),
            defaultMessage: 'Notifies everyone online in this channel',
        }];
    };

    checkSpecialMentions = (term) => {
        return this.getSpecialMentions().filter((m) => m.completeHandle.startsWith(term)).length > 0;
    };

    completeMention = (mention) => {
        const {cursorPosition, isSearch, onChangeText, value} = this.props;
        const mentionPart = value.substring(0, cursorPosition);

        let completedDraft;
        if (isSearch) {
            completedDraft = mentionPart.replace(AT_MENTION_SEARCH_REGEX, `from: ${mention} `);
        } else {
            completedDraft = mentionPart.replace(AT_MENTION_REGEX, `@${mention} `);
        }
        if (value.length > cursorPosition) {
            completedDraft += value.substring(cursorPosition);
        }

        onChangeText(completedDraft);
        this.setState({
            sections: [],
        });
    };

    renderSectionHeader = ({section}) => {
        const isFirstSection = section.id === this.state.sections[0].id;
        return (
            <AutocompleteSectionHeader
                id={section.id}
                defaultMessage={section.defaultMessage}
                theme={this.props.theme}
                isFirstSection={isFirstSection}
            />
        );
    };

    renderItem = ({item}) => {
        return (
            <AtMentionItem
                testID={`autocomplete.at_mention.item.${item}`}
                onPress={this.completeMention}
                userId={item}
            />
        );
    };

    renderSpecialMentions = ({item}) => {
        return (
            <SpecialMentionItem
                completeHandle={item.completeHandle}
                defaultMessage={item.defaultMessage}
                id={item.id}
                onPress={this.completeMention}
                theme={this.props.theme}
                values={item.values}
            />
        );
    };

    renderGroupMentions = ({item}) => {
        return (
            <GroupMentionItem
                key={`autocomplete-group-${item.name}`}
                completeHandle={item.name}
                onPress={this.completeMention}
                theme={this.props.theme}
            />
        );
    };

    render() {
        const {maxListHeight, theme, nestedScrollEnabled} = this.props;
        const {sections} = this.state;
        if (sections.length === 0) {
            // If we are not in an active state or the mention has been completed return null so nothing is rendered
            // other components are not blocked.
            return null;
        }

        const style = getStyleFromTheme(theme);

        return (
            <SectionList
                keyboardShouldPersistTaps='always'
                keyExtractor={this.keyExtractor}
                initialNumToRender={10}
                nestedScrollEnabled={nestedScrollEnabled}
                removeClippedSubviews={Platform.OS === 'android'}
                renderItem={this.renderItem}
                renderSectionHeader={this.renderSectionHeader}
                style={[style.listView, {maxHeight: maxListHeight}]}
                sections={sections}
                testID='at_mention_suggestion.list'
            />
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        listView: {
            backgroundColor: theme.centerChannelBg,
            borderRadius: 4,
        },
    };
});
