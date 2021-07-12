// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {submitInteractiveDialog} from '@mm-redux/actions/integrations';

import InteractiveDialogController from './interactive_dialog_controller';

function mapStateToProps(state) {
    return {
        triggerId: state.entities.integrations.dialogTriggerId,
        dialogData: state.entities.integrations.dialog || {},
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            submitInteractiveDialog,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(InteractiveDialogController);
