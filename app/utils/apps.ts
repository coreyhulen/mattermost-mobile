// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {AppBindingLocations, AppCallResponseTypes} from '@mm-redux/constants/apps';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {AppBinding, AppCall, AppCallRequest, AppCallValues, AppContext, AppExpand} from '@mm-redux/types/apps';
import {Config} from '@mm-redux/types/config';
import {GlobalState} from '@mm-redux/types/store';

export function appsEnabled(state: GlobalState) { // eslint-disable-line @typescript-eslint/no-unused-vars
    const enabled = getConfig(state)?.['FeatureFlagAppsEnabled' as keyof Partial<Config>];
    return enabled === 'true';
}

export function copyAndFillBindings(binding?: AppBinding): AppBinding | undefined {
    if (!binding) {
        return undefined;
    }

    const copy = JSON.parse(JSON.stringify(binding));
    fillAndTrimBindingsInformation(copy);
    return copy;
}

// fillAndTrimBindingsInformation does:
// - Build the location (e.g. channel_header/binding)
// - Inherit app calls
// - Inherit app ids
// - Trim invalid bindings (do not have an app call or app id at the leaf)
export function fillAndTrimBindingsInformation(binding?: AppBinding) {
    if (!binding) {
        return;
    }

    binding.bindings?.forEach((b) => {
        // Propagate id down if not defined
        if (!b.app_id) {
            b.app_id = binding.app_id;
        }

        // Compose location
        b.location = binding.location + '/' + b.location;

        // Propagate call down if not defined
        if (!b.call) {
            b.call = binding.call;
        }

        fillAndTrimBindingsInformation(b);
    });

    // Trim branches without app_id
    if (!binding.app_id) {
        binding.bindings = binding.bindings?.filter((v) => v.app_id);
    }

    // Trim branches without calls
    if (!binding.call) {
        binding.bindings = binding.bindings?.filter((v) => v.call);
    }

    // Pull up app_id if needed
    if (binding.bindings?.length && !binding.app_id) {
        binding.app_id = binding.bindings[0].app_id;
    }

    // Pull up call if needed
    if (binding.bindings?.length && !binding.call) {
        binding.call = binding.bindings[0].call;
    }
}

export function validateBindings(binding?: AppBinding) {
    filterInvalidChannelHeaderBindings(binding);
    filterInvalidCommands(binding);
    filterInvalidPostMenuBindings(binding);
    binding?.bindings?.forEach(fillAndTrimBindingsInformation);
}

// filterInvalidCommands remove commands without a label
function filterInvalidCommands(binding?: AppBinding) {
    if (!binding) {
        return;
    }

    const isValidCommand = (b: AppBinding): boolean => {
        return Boolean(b.label);
    };

    const validateCommand = (b: AppBinding) => {
        b.bindings = b.bindings?.filter(isValidCommand);
        b.bindings?.forEach(validateCommand);
    };

    binding.bindings?.filter((b) => b.location === AppBindingLocations.COMMAND).forEach(validateCommand);
}

// filterInvalidChannelHeaderBindings remove bindings
// without a label.
function filterInvalidChannelHeaderBindings(binding?: AppBinding) {
    if (!binding) {
        return;
    }

    const isValidChannelHeaderBindings = (b: AppBinding): boolean => {
        return Boolean(b.label);
    };

    const validateChannelHeaderBinding = (b: AppBinding) => {
        b.bindings = b.bindings?.filter(isValidChannelHeaderBindings);
        b.bindings?.forEach(validateChannelHeaderBinding);
    };

    binding.bindings?.filter((b) => b.location === AppBindingLocations.CHANNEL_HEADER_ICON).forEach(validateChannelHeaderBinding);
}

// filterInvalidPostMenuBindings remove bindings
// without a label.
function filterInvalidPostMenuBindings(binding?: AppBinding) {
    if (!binding) {
        return;
    }

    const isValidPostMenuBinding = (b: AppBinding): boolean => {
        return Boolean(b.label);
    };

    const validatePostMenuBinding = (b: AppBinding) => {
        b.bindings = b.bindings?.filter(isValidPostMenuBinding);
        b.bindings?.forEach(validatePostMenuBinding);
    };

    binding.bindings?.filter((b) => b.location === AppBindingLocations.POST_MENU_ITEM).forEach(validatePostMenuBinding);
}

export function createCallContext(
    appID: string,
    location?: string,
    channelID?: string,
    teamID?: string,
    postID?: string,
    rootID?: string,
): AppContext {
    return {
        app_id: appID,
        location,
        channel_id: channelID,
        team_id: teamID,
        post_id: postID,
        root_id: rootID,
    };
}

export function createCallRequest(
    call: AppCall,
    context: AppContext,
    defaultExpand: AppExpand = {},
    values?: AppCallValues,
    rawCommand?: string,
    query?: string,
    selectedField?: string,
): AppCallRequest {
    return {
        ...call,
        context,
        values,
        expand: {
            ...defaultExpand,
            ...call.expand,
        },
        raw_command: rawCommand,
        query,
        selected_field: selectedField,
    };
}

export const makeCallErrorResponse = (errMessage: string) => {
    return {
        type: AppCallResponseTypes.ERROR,
        error: errMessage,
    };
};
