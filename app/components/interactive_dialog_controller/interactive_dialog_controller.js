// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Alert} from 'react-native';

import {showModal} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';

export default class InteractiveDialogController extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            submitInteractiveDialog: PropTypes.func.isRequired,
        }).isRequired,
        triggerId: PropTypes.string,
        dialogData: PropTypes.object,
        theme: PropTypes.object,
    };

    constructor(props) {
        super(props);

        CompassIcon.getImageSource('close', 24, props.theme.sidebarHeaderTextColor).then((source) => {
            this.closeButton = source;
        });
    }

    static contextTypes = {
        intl: intlShape,
    };

    componentDidUpdate(prevProps) {
        const {triggerId} = this.props;
        if (!triggerId) {
            return;
        }

        const dialogData = this.props.dialogData || {};
        const prevDialogData = prevProps.dialogData || {};
        if (prevProps.triggerId === triggerId && dialogData.trigger_id === prevDialogData.trigger_id) {
            return;
        }

        if (dialogData.trigger_id !== triggerId) {
            return;
        }

        if (!dialogData.trigger_id || !dialogData.dialog) {
            return;
        }

        if (dialogData.dialog.elements && dialogData.dialog.elements.length > 0) {
            this.showInteractiveDialogScreen(dialogData.dialog);
        } else {
            this.showAlertDialog(dialogData.dialog, dialogData.url);
        }
    }

    showAlertDialog(dialog, url) {
        const {formatMessage} = this.context.intl;

        Alert.alert(
            dialog.title,
            '',
            [{
                text: formatMessage({id: 'mobile.alert_dialog.alertCancel', defaultMessage: 'Cancel'}),
                onPress: () => this.handleCancel(dialog, url),
            }, {
                text: dialog.submit_label,
                onPress: () => this.props.actions.submitInteractiveDialog({...dialog, url}),
            }],
        );
    }

    showInteractiveDialogScreen = (dialog) => {
        const options = {
            topBar: {
                leftButtons: [{
                    id: 'close-dialog',
                    icon: this.closeButton,
                }],
                rightButtons: [{
                    id: 'submit-dialog',
                    showAsAction: 'always',
                    text: dialog.submit_label,
                }],
            },
        };

        showModal('InteractiveDialog', dialog.title, null, options);
    }

    handleCancel = (dialog, url) => {
        if (dialog.notify_on_cancel) {
            this.props.actions.submitInteractiveDialog({...dialog, url, cancelled: true});
        }
    }

    render() {
        return null;
    }
}
