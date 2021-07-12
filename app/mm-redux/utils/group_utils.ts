// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Group} from '@mm-redux/types/groups';

import {General} from '../constants';

import {getSuggestionsSplitByMultiple} from './user_utils';

export function filterGroupsMatchingTerm(groups: Array<Group>, term: string): Array<Group> {
    const lowercasedTerm = term.toLowerCase();
    let trimmedTerm = lowercasedTerm;

    if (trimmedTerm.startsWith('@')) {
        trimmedTerm = trimmedTerm.substr(1);
    }

    if (!trimmedTerm) {
        return groups;
    }

    return groups.filter((group: Group) => {
        if (!group) {
            return false;
        }

        const groupSuggestions: string[] = [];

        const groupnameSuggestions = getSuggestionsSplitByMultiple((group.name || '').toLowerCase(), General.AUTOCOMPLETE_SPLIT_CHARACTERS);

        groupSuggestions.push(...groupnameSuggestions);
        const displayname = (group.display_name || '').toLowerCase();
        groupSuggestions.push(displayname);

        return groupSuggestions.
            some((suggestion) => suggestion.startsWith(trimmedTerm));
    });
}
