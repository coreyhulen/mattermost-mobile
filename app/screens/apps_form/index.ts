// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ActionCreatorsMapObject, bindActionCreators, Dispatch} from 'redux';
import {connect} from 'react-redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {doAppCall, postEphemeralCallResponseForContext} from '@actions/apps';
import {handleGotoLocation} from '@mm-redux/actions/integrations';

import {GlobalState} from '@mm-redux/types/store';
import {ActionFunc, GenericAction} from '@mm-redux/types/actions';

import AppsFormContainer from './apps_form_container';
import {DoAppCall, PostEphemeralCallResponseForContext} from 'types/actions/apps';

type Actions = {
    doAppCall: DoAppCall;
    postEphemeralCallResponseForContext: PostEphemeralCallResponseForContext;
};

function mapStateToProps(state: GlobalState) {
    return {
        theme: getTheme(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch<GenericAction>) {
    return {
        actions: bindActionCreators<ActionCreatorsMapObject<ActionFunc>, Actions>({
            doAppCall,
            postEphemeralCallResponseForContext,
            handleGotoLocation,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AppsFormContainer);
