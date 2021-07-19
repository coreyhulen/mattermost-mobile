// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IDMappedObjects} from './utilities';
export type IncomingWebhook = {
    id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    user_id: string;
    channel_id: string;
    team_id: string;
    display_name: string;
    description: string;
    username: string;
    icon_url: string;
    channel_locked: boolean;
};
export type OutgoingWebhook = {
    id: string;
    token: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    creator_id: string;
    channel_id: string;
    team_id: string;
    trigger_words: Array<string>;
    trigger_when: number;
    callback_urls: Array<string>;
    display_name: string;
    description: string;
    content_type: string;
    username: string;
    icon_url: string;
};
export type Command = {
    'id': string;
    'token': string;
    'create_at': number;
    'update_at': number;
    'delete_at': number;
    'creator_id': string;
    'team_id': string;
    'trigger': string;
    'method': 'P' | 'G' | '';
    'username': string;
    'icon_url': string;
    'auto_complete': boolean;
    'auto_complete_desc': string;
    'auto_complete_hint': string;
    'display_name': string;
    'description': string;
    'url': string;
    'autocomplete_icon_data'?: string;
};

// AutocompleteSuggestion represents a single suggestion downloaded from the server.
export type AutocompleteSuggestion = {
    Complete: string;
    Suggestion: string;
    Hint: string;
    Description: string;
    IconData: string;
};
export type OAuthApp = {
    'id': string;
    'creator_id': string;
    'create_at': number;
    'update_at': number;
    'client_secret': string;
    'name': string;
    'description': string;
    'icon_url': string;
    'callback_urls': Array<string>;
    'homepage': string;
    'is_trusted': boolean;
};
export type IntegrationsState = {
    incomingHooks: IDMappedObjects<IncomingWebhook>;
    outgoingHooks: IDMappedObjects<OutgoingWebhook>;
    oauthApps: IDMappedObjects<OAuthApp>;
    systemCommands: IDMappedObjects<Command>;
    commands: IDMappedObjects<Command>;
    commandAutocompleteSuggestions: Array<AutocompleteSuggestion>;
};
export type DialogSubmission = {
    url: string;
    callback_id: string;
    state: string;
    user_id: string;
    channel_id: string;
    team_id: string;
    submission: {
        [x: string]: string;
    };
    cancelled: boolean;
};
export type DialogOption = {
    text: string;
    value: string;
};
export type DialogElement = {
    display_name: string;
    name: string;
    type: string;
    subtype: string;
    default: string;
    placeholder: string;
    help_text: string;
    optional: boolean;
    min_length: number;
    max_length: number;
    data_source: string;
    options: Array<DialogOption>;
};
export type InteractiveDialogConfig = {
    app_id: string;
    trigger_id: string;
    url: string;
    dialog: {
        callback_id: string;
        title: string;
        introduction_text: string;
        icon_url?: string;
        elements: DialogElement[];
        submit_label: string;
        notify_on_cancel: boolean;
        state: string;
    };
};
export type CommandArgs = {
    channel_id: string;
    team_id: string;
    root_id?: string;
}
