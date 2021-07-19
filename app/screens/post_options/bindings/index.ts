// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators, Dispatch, ActionCreatorsMapObject} from 'redux';

import {getTheme} from '@mm-redux/selectors/entities/preferences';

import {GlobalState} from '@mm-redux/types/store';
import {GenericAction, ActionFunc} from '@mm-redux/types/actions';
import {getAppsBindings} from '@mm-redux/selectors/entities/apps';
import {AppBindingLocations} from '@mm-redux/constants/apps';
import {getCurrentUser} from '@mm-redux/selectors/entities/users';

import {doAppCall, postEphemeralCallResponseForPost} from '@actions/apps';
import {appsEnabled} from '@utils/apps';
import {handleGotoLocation} from '@mm-redux/actions/integrations';

import Bindings from './bindings';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import {Post} from '@mm-redux/types/posts';
import {getChannel} from '@mm-redux/selectors/entities/channels';
import {DoAppCall, PostEphemeralCallResponseForPost} from 'types/actions/apps';

type OwnProps = {
    post: Post;
}

function mapStateToProps(state: GlobalState, props: OwnProps) {
    const apps = appsEnabled(state);
    const bindings = apps ? getAppsBindings(state, AppBindingLocations.POST_MENU_ITEM) : [];
    const currentUser = getCurrentUser(state);
    const teamID = getChannel(state, props.post.channel_id)?.team_id || getCurrentTeamId(state);

    return {
        theme: getTheme(state),
        bindings,
        currentUser,
        teamID,
        appsEnabled: apps,
    };
}

type Actions = {
    doAppCall: DoAppCall;
    postEphemeralCallResponseForPost: PostEphemeralCallResponseForPost;
}

function mapDispatchToProps(dispatch: Dispatch<GenericAction>) {
    return {
        actions: bindActionCreators<ActionCreatorsMapObject<ActionFunc>, Actions>({
            doAppCall,
            postEphemeralCallResponseForPost,
            handleGotoLocation,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(Bindings);
