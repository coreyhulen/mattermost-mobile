// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Keyboard,
    InteractionManager,
} from 'react-native';
import {Navigation} from 'react-native-navigation';

import {popTopScreen, setButtons} from '@actions/navigation';
import EditChannelInfo from '@components/edit_channel_info';
import {NavigationTypes, ViewTypes} from '@constants';
import {General, RequestStatus} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {t} from '@utils/i18n';
import {cleanUpUrlable} from '@utils/url';

const messages = {
    display_name_required: {
        id: t('mobile.rename_channel.display_name_required'),
        defaultMessage: 'Channel name is required',
    },
    display_name_maxLength: {
        id: t('mobile.rename_channel.display_name_maxLength'),
        defaultMessage: 'Channel name must be less than {maxLength, number} characters',
    },
    display_name_minLength: {
        id: t('mobile.rename_channel.display_name_minLength'),
        defaultMessage: 'Channel name must be {minLength, number} or more characters',
    },
    name_required: {
        id: t('mobile.rename_channel.name_required'),
        defaultMessage: 'URL is required',
    },
    name_maxLength: {
        id: t('mobile.rename_channel.name_maxLength'),
        defaultMessage: 'URL must be less than {maxLength, number} characters',
    },
    name_minLength: {
        id: t('mobile.rename_channel.name_minLength'),
        defaultMessage: 'URL must be {minLength, number} or more characters',
    },
    name_lowercase: {
        id: t('mobile.rename_channel.name_lowercase'),
        defaultMessage: 'URL be lowercase alphanumeric characters',
    },
};

export default class EditChannel extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            patchChannel: PropTypes.func.isRequired,
            getChannel: PropTypes.func.isRequired,
            setChannelDisplayName: PropTypes.func.isRequired,
        }),
        componentId: PropTypes.string,
        theme: PropTypes.object.isRequired,
        channel: PropTypes.object.isRequired,
        currentTeamUrl: PropTypes.string.isRequired,
        updateChannelRequest: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape,
    };

    rightButton = {
        testID: 'edit_channel.save.button',
        id: 'edit-channel',
        enabled: false,
        showAsAction: 'always',
    };

    constructor(props, context) {
        super(props);
        const {
            channel: {
                display_name: displayName,
                header,
                purpose,
                name: channelURL,
            },
        } = props;

        this.state = {
            error: null,
            updating: false,
            updateChannelRequest: props.updateChannelRequest,
            displayName,
            channelURL,
            purpose,
            header,
        };

        this.rightButton.color = props.theme.sidebarHeaderTextColor;
        this.rightButton.text = context.intl.formatMessage({id: 'mobile.edit_channel', defaultMessage: 'Save'});

        const buttons = {
            rightButtons: [this.rightButton],
        };

        setButtons(props.componentId, buttons);
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        this.emitCanUpdateChannel(false);
    }

    static getDerivedStateFromProps(nextProps, state) {
        const {updateChannelRequest} = nextProps;

        if (state.updateChannelRequest !== updateChannelRequest) {
            const newState = {
                error: null,
                updating: true,
                updateChannelRequest,
            };

            switch (updateChannelRequest.status) {
            case RequestStatus.SUCCESS:
                newState.updating = false;
                break;
            case RequestStatus.FAILURE:
                newState.error = updateChannelRequest.error;
                newState.updating = false;
                break;
            }

            return newState;
        }
        return null;
    }

    componentDidUpdate(prevProps) {
        if (prevProps.updateChannelRequest !== this.props.updateChannelRequest) {
            switch (this.props.updateChannelRequest.status) {
            case RequestStatus.STARTED:
                this.emitUpdating(true);
                break;
            case RequestStatus.SUCCESS:
                EventEmitter.emit(NavigationTypes.CLOSE_MAIN_SIDEBAR);
                InteractionManager.runAfterInteractions(() => {
                    this.emitUpdating(false);
                    this.close();
                });
                break;
            case RequestStatus.FAILURE:
                this.emitUpdating(false);
                break;
            }
        }
    }

    navigationButtonPressed({buttonId}) {
        switch (buttonId) {
        case 'close-edit-channel':
            this.close();
            break;
        case 'edit-channel':
            this.onUpdateChannel();
            break;
        }
    }

    close = () => {
        const {channel: {type}} = this.props;
        const isDirect = type === General.DM_CHANNEL || type === General.GM_CHANNEL;

        if (!isDirect) {
            this.props.actions.setChannelDisplayName(this.state.displayName);
        }

        popTopScreen();
    };

    emitCanUpdateChannel = (enabled) => {
        const {componentId} = this.props;
        const buttons = {
            rightButtons: [{...this.rightButton, enabled}],
        };

        setButtons(componentId, buttons);
    };

    emitUpdating = (loading) => {
        const {componentId} = this.props;
        const buttons = {
            rightButtons: [{...this.rightButton, enabled: !loading}],
        };

        setButtons(componentId, buttons);
    };

    validateDisplayName = (displayName) => {
        const {formatMessage} = this.context.intl;

        if (!displayName) {
            return {error: formatMessage(messages.display_name_required)};
        } else if (displayName.length > ViewTypes.MAX_CHANNELNAME_LENGTH) {
            return {error: formatMessage(
                messages.display_name_maxLength,
                {maxLength: ViewTypes.MAX_CHANNELNAME_LENGTH},
            )};
        } else if (displayName.length < ViewTypes.MIN_CHANNELNAME_LENGTH) {
            return {error: formatMessage(
                messages.display_name_minLength,
                {minLength: ViewTypes.MIN_CHANNELNAME_LENGTH},
            )};
        }

        return {error: null};
    };

    validateChannelURL = (channelURL) => {
        const {formatMessage} = this.context.intl;

        if (!channelURL) {
            return {error: formatMessage(messages.name_required)};
        } else if (channelURL.length > ViewTypes.MAX_CHANNELNAME_LENGTH) {
            return {error: formatMessage(
                messages.name_maxLength,
                {maxLength: ViewTypes.MAX_CHANNELNAME_LENGTH},
            )};
        }

        const cleanedName = cleanUpUrlable(channelURL);
        if (cleanedName === channelURL) {
            return {error: null};
        }

        return {error: formatMessage(messages.name_lowercase)};
    };

    onUpdateChannel = async () => {
        Keyboard.dismiss();
        const {displayName, channelURL, purpose, header} = this.state;
        const {channel: {id, type}} = this.props;
        const isDirect = type === General.DM_CHANNEL || type === General.GM_CHANNEL;
        const channel = {
            display_name: isDirect ? '' : displayName,
            name: channelURL,
            purpose,
            header,
        };

        if (!isDirect) {
            let result = this.validateDisplayName(displayName.trim());
            if (result.error) {
                this.setState({error: result.error});
                return;
            }

            result = this.validateChannelURL(channelURL.trim());
            if (result.error) {
                this.setState({error: result.error});
                return;
            }
        }

        const data = await this.props.actions.patchChannel(id, channel);
        if (data.error && data.error.server_error_id === 'store.sql_channel.update.archived_channel.app_error') {
            this.props.actions.getChannel(id);
        }
    };

    onDisplayNameChange = (displayName) => {
        this.setState({displayName});
    };

    onChannelURLChange = (channelURL) => {
        this.setState({channelURL});
    };

    onPurposeChange = (purpose) => {
        this.setState({purpose});
    };

    onHeaderChange = (header) => {
        this.setState({header});
    };

    render() {
        const {
            channel: {
                display_name: oldDisplayName,
                name: oldChannelURL,
                header: oldHeader,
                purpose: oldPurpose,
                type,
            },
            theme,
            currentTeamUrl,
        } = this.props;
        const {
            error,
            updating,
            displayName,
            channelURL,
            purpose,
            header,
        } = this.state;

        return (
            <EditChannelInfo
                testID='edit_channel.screen'
                theme={theme}
                enableRightButton={this.emitCanUpdateChannel}
                error={error}
                saving={updating}
                channelType={type}
                currentTeamUrl={currentTeamUrl}
                onDisplayNameChange={this.onDisplayNameChange}
                onChannelURLChange={this.onChannelURLChange}
                onPurposeChange={this.onPurposeChange}
                onHeaderChange={this.onHeaderChange}
                displayName={displayName}
                channelURL={channelURL}
                header={header}
                purpose={purpose}
                editing={true}
                oldDisplayName={oldDisplayName}
                oldChannelURL={oldChannelURL}
                oldPurpose={oldPurpose}
                oldHeader={oldHeader}
            />
        );
    }
}

