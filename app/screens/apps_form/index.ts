// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {ActionCreatorsMapObject, bindActionCreators, Dispatch} from 'redux';

import {doAppCall, postEphemeralCallResponseForContext} from '@actions/apps';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {ActionFunc, GenericAction} from '@mm-redux/types/actions';
import {GlobalState} from '@mm-redux/types/store';
import {DoAppCall, PostEphemeralCallResponseForContext} from '@mm-types/actions/apps';

import AppsFormContainer from './apps_form_container';

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
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AppsFormContainer);
