// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {UserProfile} from '@mm-redux/types/users';
import {IDMappedObjects, $ID, Dictionary} from '@mm-redux/types/utilities';
import {localizeMessage} from '@mm-redux/utils/i18n_utils';

import {General, Preferences} from '../constants';
export function getFullName(user: UserProfile): string {
    if (user.first_name && user.last_name) {
        return user.first_name + ' ' + user.last_name;
    } else if (user.first_name) {
        return user.first_name;
    } else if (user.last_name) {
        return user.last_name;
    }

    return '';
}

export function displayUsername(
    user?: UserProfile,
    teammateNameDisplay?: string,
    useFallbackUsername = true,
): string {
    let name = useFallbackUsername ? localizeMessage('channel_loader.someone', 'Someone') : '';
    if (user) {
        if (teammateNameDisplay === Preferences.DISPLAY_PREFER_NICKNAME) {
            name = user.nickname || getFullName(user);
        } else if (teammateNameDisplay === Preferences.DISPLAY_PREFER_FULL_NAME) {
            name = getFullName(user);
        } else {
            name = user.username;
        }

        if (!name || name.trim().length === 0) {
            name = user.username;
        }
    }

    return name;
}

export function rolesIncludePermission(roles: string, permission: string): boolean {
    const rolesArray = roles.split(' ');
    return rolesArray.includes(permission);
}

export function isAdmin(roles: string): boolean {
    return isSystemAdmin(roles) || isTeamAdmin(roles);
}

export function isGuest(roles: string): boolean {
    return rolesIncludePermission(roles, 'system_guest');
}

export function isTeamAdmin(roles: string): boolean {
    return rolesIncludePermission(roles, General.TEAM_ADMIN_ROLE);
}

export function isSystemAdmin(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_ADMIN_ROLE);
}

export function isChannelAdmin(roles: string): boolean {
    return rolesIncludePermission(roles, General.CHANNEL_ADMIN_ROLE);
}

export function isShared(user: UserProfile): boolean {
    return Boolean(user.remote_id);
}

export function hasUserAccessTokenRole(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_USER_ACCESS_TOKEN_ROLE);
}

export function hasPostAllRole(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_POST_ALL_ROLE);
}

export function hasPostAllPublicRole(roles: string): boolean {
    return rolesIncludePermission(roles, General.SYSTEM_POST_ALL_PUBLIC_ROLE);
}

export function profileListToMap(profileList: Array<UserProfile>): IDMappedObjects<UserProfile> {
    const profiles: Dictionary<UserProfile> = {};
    for (let i = 0; i < profileList.length; i++) {
        profiles[profileList[i].id] = profileList[i];
    }
    return profiles;
}

export function removeUserFromList(userId: $ID<UserProfile>, list: Array<UserProfile>): Array<UserProfile> {
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].id === userId) {
            list.splice(i, 1);
            return list;
        }
    }

    return list;
}

// Splits the term by a splitStr and composes a list of the parts of
// the split concatenated with the rest, forming a set of suggesitons
// matchable with startsWith
//
// E.g.: for "one.two.three" by "." it would yield
// ["one.two.three", ".two.three", "two.three", ".three", "three"]
export function getSuggestionsSplitBy(term: string, splitStr: string): Array<string> {
    const splitTerm = term.split(splitStr);
    const initialSuggestions = splitTerm.map((st, i) => splitTerm.slice(i).join(splitStr));
    let suggestions: string[] = [];

    if (splitStr === ' ') {
        suggestions = initialSuggestions;
    } else {
        suggestions = initialSuggestions.reduce((acc, val) => {
            if (acc.length === 0) {
                acc.push(val);
            } else {
                acc.push(splitStr + val, val);
            }
            return acc;
        }, [] as string[]);
    }
    return suggestions;
}

export function getSuggestionsSplitByMultiple(term: string, splitStrs: Array<string>): Array<string> {
    const suggestions = splitStrs.reduce((acc, val) => {
        getSuggestionsSplitBy(term, val).forEach((suggestion) => acc.add(suggestion));
        return acc;
    }, new Set<string>());

    return [...suggestions];
}

export function filterProfilesMatchingTerm(users: Array<UserProfile>, term: string): Array<UserProfile> {
    const lowercasedTerm = term.toLowerCase();
    let trimmedTerm = lowercasedTerm;
    if (trimmedTerm.startsWith('@')) {
        trimmedTerm = trimmedTerm.substr(1);
    }

    return users.filter((user: UserProfile) => {
        if (!user) {
            return false;
        }

        const profileSuggestions: string[] = [];
        const usernameSuggestions = getSuggestionsSplitByMultiple((user.username || '').toLowerCase(), General.AUTOCOMPLETE_SPLIT_CHARACTERS);
        profileSuggestions.push(...usernameSuggestions);
        const first = (user.first_name || '').toLowerCase();
        const last = (user.last_name || '').toLowerCase();
        const full = first + ' ' + last;
        profileSuggestions.push(first, last, full);
        profileSuggestions.push((user.nickname || '').toLowerCase());
        const email = (user.email || '').toLowerCase();
        profileSuggestions.push(email);
        profileSuggestions.push((user.nickname || '').toLowerCase());

        const split = email.split('@');
        if (split.length > 1) {
            profileSuggestions.push(split[1]);
        }

        return profileSuggestions.
            filter((suggestion) => suggestion !== '').
            some((suggestion) => suggestion.startsWith(trimmedTerm));
    });
}

export function sortByUsername(a: UserProfile, b: UserProfile): number {
    const nameA = a.username;
    const nameB = b.username;

    return nameA.localeCompare(nameB);
}
