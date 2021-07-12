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

import {popTopScreen, dismissModal, setButtons} from '@actions/navigation';
import EditChannelInfo from '@components/edit_channel_info';
import {NavigationTypes} from '@constants';
import {General, RequestStatus} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';

export default class CreateChannel extends PureComponent {
    static propTypes = {
        componentId: PropTypes.string,
        theme: PropTypes.object.isRequired,
        createChannelRequest: PropTypes.object.isRequired,
        channelType: PropTypes.string,
        closeButton: PropTypes.object,
        actions: PropTypes.shape({
            handleCreateChannel: PropTypes.func.isRequired,
        }),
    };

    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        channelType: General.OPEN_CHANNEL,
    };

    leftButton = {
        id: 'close-new-channel',
    };

    rightButton = {
        testID: 'create_channel.create.button',
        id: 'create-channel',
        enabled: false,
        showAsAction: 'always',
    };

    constructor(props, context) {
        super(props);

        this.state = {
            error: null,
            creating: false,
            displayName: '',
            purpose: '',
            header: '',
        };

        this.rightButton.text = context.intl.formatMessage({id: 'mobile.create_channel', defaultMessage: 'Create'});
        this.rightButton.color = props.theme.sidebarHeaderTextColor;

        if (props.closeButton) {
            this.left = {...this.leftButton, icon: props.closeButton};
        }
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
        this.emitCanCreateChannel(false);
    }

    onRequestStart() {
        this.setState({error: null, creating: true});
    }

    onRequestFailure(error) {
        this.setState({error, creating: false});
    }

    componentDidUpdate(prevProps) {
        if (this.props.createChannelRequest !== prevProps.createChannelRequest) {
            switch (this.props.createChannelRequest.status) {
            case RequestStatus.STARTED:
                this.emitCreating(true);
                this.onRequestStart();
                break;
            case RequestStatus.SUCCESS:
                EventEmitter.emit(NavigationTypes.CLOSE_MAIN_SIDEBAR);
                InteractionManager.runAfterInteractions(() => {
                    this.emitCreating(false);
                    this.setState({error: null, creating: false});
                    this.close(false);
                });
                break;
            case RequestStatus.FAILURE:
                this.emitCreating(false);
                this.onRequestFailure(this.props.createChannelRequest.error);
                break;
            }
        }
    }

    navigationButtonPressed({buttonId}) {
        switch (buttonId) {
        case 'close-new-channel':
            this.close(!this.props.closeButton);
            break;
        case 'create-channel':
            this.onCreateChannel();
            break;
        }
    }

    close = (goBack = false) => {
        Keyboard.dismiss();
        if (goBack) {
            popTopScreen();
        } else {
            dismissModal();
        }
    };

    emitCanCreateChannel = (enabled) => {
        const {componentId} = this.props;
        const buttons = {
            rightButtons: [{...this.rightButton, enabled}],
        };

        if (this.left) {
            buttons.leftButtons = [this.left];
        }

        setButtons(componentId, buttons);
    };

    emitCreating = (loading) => {
        const {componentId} = this.props;
        const buttons = {
            rightButtons: [{...this.rightButton, enabled: !loading}],
        };

        if (this.left) {
            buttons.leftButtons = [this.left];
        }

        setButtons(componentId, buttons);
    };

    onCreateChannel = () => {
        Keyboard.dismiss();
        const {displayName, purpose, header} = this.state;
        this.props.actions.handleCreateChannel(displayName, purpose, header, this.props.channelType);
    };

    onDisplayNameChange = (displayName) => {
        this.setState({displayName});
    };

    onPurposeChange = (purpose) => {
        this.setState({purpose});
    };

    onHeaderChange = (header) => {
        this.setState({header});
    };

    render() {
        const {theme} = this.props;
        const {
            error,
            creating,
            displayName,
            purpose,
            header,
        } = this.state;

        return (
            <EditChannelInfo
                testID='create_channel.screen'
                theme={theme}
                enableRightButton={this.emitCanCreateChannel}
                error={error}
                saving={creating}
                onDisplayNameChange={this.onDisplayNameChange}
                onPurposeChange={this.onPurposeChange}
                onHeaderChange={this.onHeaderChange}
                displayName={displayName}
                purpose={purpose}
                header={header}
            />
        );
    }
}

