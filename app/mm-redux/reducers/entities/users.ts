// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {UserTypes, ChannelTypes} from '@mm-redux/action_types';
import {GenericAction} from '@mm-redux/types/actions';
import {Channel} from '@mm-redux/types/channels';
import {Team} from '@mm-redux/types/teams';
import {UserProfile, UserStatus} from '@mm-redux/types/users';
import {RelationOneToMany, IDMappedObjects, RelationOneToOne} from '@mm-redux/types/utilities';
import {profileListToMap} from '@mm-redux/utils/user_utils';

function profilesToSet(state: RelationOneToMany<Team, UserProfile>, action: GenericAction) {
    const id = action.id;
    const nextSet = new Set(state[id]);
    Object.keys(action.data).forEach((key) => {
        nextSet.add(key);
    });

    return {
        ...state,
        [id]: nextSet,
    };
}

function profileListToSet(state: RelationOneToMany<Team, UserProfile>, action: GenericAction, replace = false) {
    const id = action.id;
    const nextSet = replace ? new Set() : new Set(state[id]);
    if (action.data) {
        action.data.forEach((profile: UserProfile) => {
            nextSet.add(profile.id);
        });

        return {
            ...state,
            [id]: nextSet,
        };
    }

    return state;
}

function removeProfileListFromSet(state: RelationOneToMany<Team, UserProfile>, action: GenericAction) {
    const id = action.id;
    const nextSet = new Set(state[id]);
    if (action.data) {
        action.data.forEach((profile: UserProfile) => {
            nextSet.delete(profile.id);
        });

        return {
            ...state,
            [id]: nextSet,
        };
    }

    return state;
}

function addProfileToSet(state: RelationOneToMany<Team, UserProfile>, action: GenericAction) {
    const {id, user_id: userId} = action.data;
    const nextSet = new Set(state[id]);
    nextSet.add(userId);
    return {
        ...state,
        [id]: nextSet,
    };
}

function removeProfileFromTeams(state: RelationOneToMany<Team, UserProfile>, action: GenericAction) {
    const newState = {...state};
    let removed = false;
    Object.keys(state).forEach((key) => {
        if (newState[key][action.data.user_id]) {
            delete newState[key][action.data.user_id];
            removed = true;
        }
    });
    return removed ? newState : state;
}

function removeProfileFromSet(state: RelationOneToMany<Team, UserProfile>, action: GenericAction) {
    const {id, user_id: userId} = action.data;
    const nextSet = new Set(state[id]);
    nextSet.delete(userId);
    return {
        ...state,
        [id]: nextSet,
    };
}

function currentUserId(state = '', action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_ME: {
        const data = action.data || action.payload;

        return data.id;
    }

    case UserTypes.LOGIN: { // Used by the mobile app
        const {user} = action.data;

        return user ? user.id : state;
    }
    }
    return state;
}

function mySessions(state: Array<{id: string}> = [], action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_SESSIONS:
        return [...action.data];

    case UserTypes.RECEIVED_REVOKED_SESSION: {
        let index = -1;
        const length = state.length;
        for (let i = 0; i < length; i++) {
            if (state[i].id === action.sessionId) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            return state.slice(0, index).concat(state.slice(index + 1));
        }

        return state;
    }

    case UserTypes.REVOKE_ALL_USER_SESSIONS_SUCCESS:
        if (action.data.isCurrentUser === true) {
            return [];
        }
        return state;

    case UserTypes.REVOKE_SESSIONS_FOR_ALL_USERS_SUCCESS:
        return [];

    default:
        return state;
    }
}

function profiles(state: IDMappedObjects<UserProfile> = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_ME:
    case UserTypes.RECEIVED_PROFILE: {
        const data = action.data || action.payload;
        const user = {...data};
        const oldUser = state[data.id];
        if (oldUser) {
            user.terms_of_service_id = oldUser.terms_of_service_id;
            user.terms_of_service_create_at = oldUser.terms_of_service_create_at;
        }

        return {
            ...state,
            [data.id]: user,
        };
    }
    case UserTypes.RECEIVED_PROFILES_LIST:
        return Object.assign({}, state, profileListToMap(action.data));
    case UserTypes.RECEIVED_PROFILES:
        return Object.assign({}, state, action.data);

    case UserTypes.LOGIN: { // Used by the mobile app
        const {user} = action.data;

        if (user) {
            const nextState = {...state};
            nextState[user.id] = user;
            return nextState;
        }

        return state;
    }
    case UserTypes.RECEIVED_BATCHED_PROFILES_IN_CHANNEL: {
        const {data} = action;
        if (data && data.length) {
            const nextState = {...state};
            const ids = new Set();

            data.forEach((d: any) => {
                d.data.users.forEach((u: UserProfile) => {
                    if (!ids.has(u.id)) {
                        ids.add(u.id);
                        nextState[u.id] = u;
                    }
                });
            });
            return nextState;
        }

        return state;
    }
    case UserTypes.RECEIVED_TERMS_OF_SERVICE_STATUS: {
        const data = action.data || action.payload;
        return {
            ...state,
            [data.user_id]: {
                ...state[data.user_id],
                terms_of_service_id: data.terms_of_service_id,
                terms_of_service_create_at: data.terms_of_service_create_at,
            },
        };
    }
    case UserTypes.PROFILE_NO_LONGER_VISIBLE: {
        if (state[action.data.user_id]) {
            const newState = {...state};
            delete newState[action.data.user_id];
            return newState;
        }
        return state;
    }
    default:
        return state;
    }
}

function profilesInTeam(state: RelationOneToMany<Team, UserProfile> = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_IN_TEAM:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_IN_TEAM:
        return profilesToSet(state, action);

    case UserTypes.RECEIVED_PROFILE_NOT_IN_TEAM:
        return removeProfileFromSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM:
        return removeProfileListFromSet(state, action);

    case UserTypes.PROFILE_NO_LONGER_VISIBLE:
        return removeProfileFromTeams(state, action);

    default:
        return state;
    }
}

function profilesNotInTeam(state: RelationOneToMany<Team, UserProfile> = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_NOT_IN_TEAM:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM_AND_REPLACE:
        return profileListToSet(state, action, true);

    case UserTypes.RECEIVED_PROFILE_IN_TEAM:
        return removeProfileFromSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM:
        return removeProfileListFromSet(state, action);

    case UserTypes.PROFILE_NO_LONGER_VISIBLE:
        return removeProfileFromTeams(state, action);

    default:
        return state;
    }
}

function profilesWithoutTeam(state: Set<string> = new Set(), action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_WITHOUT_TEAM: {
        const nextSet = new Set(Array.from(state));
        Object.values(action.data).forEach((id: string) => nextSet.add(id));
        return nextSet;
    }
    case UserTypes.RECEIVED_PROFILES_LIST_WITHOUT_TEAM: {
        const nextSet = new Set(Array.from(state));
        action.data.forEach((user: UserProfile) => nextSet.add(user.id));
        return nextSet;
    }
    case UserTypes.PROFILE_NO_LONGER_VISIBLE:
    case UserTypes.RECEIVED_PROFILE_IN_TEAM: {
        const nextSet = new Set(Array.from(state));
        nextSet.delete(action.data.id);
        return nextSet;
    }
    default:
        return state;
    }
}

function profilesInChannel(state: RelationOneToMany<Channel, UserProfile> = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_IN_CHANNEL:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_IN_CHANNEL:
        return profilesToSet(state, action);

    case UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL:
        return removeProfileFromSet(state, action);

    case ChannelTypes.CHANNEL_MEMBER_REMOVED:
        return removeProfileFromSet(state, {
            type: '',
            data: {
                id: action.data.channel_id,
                user_id: action.data.user_id,
            }});

    case UserTypes.PROFILE_NO_LONGER_VISIBLE:
        return removeProfileFromTeams(state, action);

    case UserTypes.RECEIVED_BATCHED_PROFILES_IN_CHANNEL: { // Used by the mobile  app
        const {data} = action;

        if (data && data.length) {
            const nextState: any = {...state};
            data.forEach((d: any) => {
                const {channelId, users} = d.data;
                const nextSet = new Set(state[channelId]);

                users.forEach((u: UserProfile) => nextSet.add(u.id));
                nextState[channelId] = nextSet;
            });

            return nextState;
        }

        return state;
    }
    default:
        return state;
    }
}

function profilesNotInChannel(state: RelationOneToMany<Channel, UserProfile> = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL:
        return addProfileToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL:
        return profileListToSet(state, action);

    case UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL_AND_REPLACE:
        return profileListToSet(state, action, true);

    case UserTypes.RECEIVED_PROFILES_NOT_IN_CHANNEL:
        return profilesToSet(state, action);

    case UserTypes.RECEIVED_PROFILE_IN_CHANNEL:
        return removeProfileFromSet(state, action);

    case ChannelTypes.CHANNEL_MEMBER_ADDED:
        return removeProfileFromSet(state, {
            type: '',
            data: {
                id: action.data.channel_id,
                user_id: action.data.user_id,
            }});

    case UserTypes.PROFILE_NO_LONGER_VISIBLE:
        return removeProfileFromTeams(state, action);

    default:
        return state;
    }
}

function statuses(state: RelationOneToOne<UserProfile, string> = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_STATUS: {
        const nextState = Object.assign({}, state);
        nextState[action.data.user_id] = action.data.status;

        return nextState;
    }
    case UserTypes.RECEIVED_STATUSES: {
        const nextState = Object.assign({}, state);

        for (const s of action.data) {
            nextState[s.user_id] = s.status;
        }

        return nextState;
    }
    case UserTypes.PROFILE_NO_LONGER_VISIBLE: {
        if (state[action.data.user_id]) {
            const newState = {...state};
            delete newState[action.data.user_id];
            return newState;
        }
        return state;
    }
    case UserTypes.RECEIVED_BATCHED_PROFILES_IN_CHANNEL: { // Used by the mobile app
        const {data} = action;
        if (data && data.length) {
            const nextState = {...state};
            const ids = new Set();

            let hasNewStatuses = false;
            data.forEach((d: any) => {
                const {statuses: st} = d.data;
                if (st && st.length) {
                    st.forEach((u: UserStatus) => {
                        if (!ids.has(u.user_id)) {
                            ids.add(u.user_id);
                            nextState[u.user_id] = u.status;
                            hasNewStatuses = true;
                        }
                    });
                }
            });

            if (hasNewStatuses) {
                return nextState;
            }
        }

        return state;
    }
    default:
        return state;
    }
}

function isManualStatus(state: RelationOneToOne<UserProfile, boolean> = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_STATUS: {
        const nextState = Object.assign({}, state);
        nextState[action.data.user_id] = action.data.manual;

        return nextState;
    }
    case UserTypes.RECEIVED_STATUSES: {
        const nextState = Object.assign({}, state);

        for (const s of action.data) {
            nextState[s.user_id] = s.manual;
        }

        return nextState;
    }
    case UserTypes.PROFILE_NO_LONGER_VISIBLE: {
        if (state[action.data.user_id]) {
            const newState = {...state};
            delete newState[action.data.user_id];
            return newState;
        }
        return state;
    }
    default:
        return state;
    }
}

function myUserAccessTokens(state: any = {}, action: GenericAction) {
    switch (action.type) {
    case UserTypes.RECEIVED_MY_USER_ACCESS_TOKEN: {
        const nextState = {...state};
        nextState[action.data.id] = action.data;

        return nextState;
    }
    case UserTypes.RECEIVED_MY_USER_ACCESS_TOKENS: {
        const nextState = {...state};

        for (const uat of action.data) {
            nextState[uat.id] = uat;
        }

        return nextState;
    }
    case UserTypes.REVOKED_USER_ACCESS_TOKEN: {
        const nextState = {...state};
        Reflect.deleteProperty(nextState, action.data);

        return nextState;
    }

    case UserTypes.ENABLED_USER_ACCESS_TOKEN: {
        if (state[action.data]) {
            const nextState = {...state};
            nextState[action.data] = {...nextState[action.data], is_active: true};
            return nextState;
        }
        return state;
    }

    case UserTypes.DISABLED_USER_ACCESS_TOKEN: {
        if (state[action.data]) {
            const nextState = {...state};
            nextState[action.data] = {...nextState[action.data], is_active: false};
            return nextState;
        }
        return state;
    }

    case UserTypes.CLEAR_MY_USER_ACCESS_TOKENS:
        return {};

    default:
        return state;
    }
}

export default combineReducers({

    // the current selected user
    currentUserId,

    // array with the user's sessions
    mySessions,

    // object where every key is the token id and has a user access token as a value
    myUserAccessTokens,

    // object where every key is a user id and has an object with the users details
    profiles,

    // object where every key is a team id and has a Set with the users id that are members of the team
    profilesInTeam,

    // object where every key is a team id and has a Set with the users id that are not members of the team
    profilesNotInTeam,

    // set with user ids for users that are not on any team
    profilesWithoutTeam,

    // object where every key is a channel id and has a Set with the users id that are members of the channel
    profilesInChannel,

    // object where every key is a channel id and has a Set with the users id that are not members of the channel
    profilesNotInChannel,

    // object where every key is the user id and has a value with the current status of each user
    statuses,

    // object where every key is the user id and has a value with a flag determining if their status was set manually
    isManualStatus,
});
