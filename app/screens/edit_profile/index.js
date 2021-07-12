// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {setProfileImageUri, removeProfileImage, updateUser} from '@actions/views/edit_profile';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';
import {isLandscape} from '@selectors/device';

import EditProfile from './edit_profile';

function mapStateToProps(state, ownProps) {
    const config = getConfig(state);
    const {serverVersion} = state.entities.general;
    const {auth_service: service} = ownProps.currentUser;

    const firstNameDisabled = (service === 'ldap' && config.LdapFirstNameAttributeSet === 'true') ||
        (service === 'saml' && config.SamlFirstNameAttributeSet === 'true') ||
        (['gitlab', 'google', 'office365'].includes(service));

    const lastNameDisabled = (service === 'ldap' && config.LdapLastNameAttributeSet === 'true') ||
        (service === 'saml' && config.SamlLastNameAttributeSet === 'true') ||
        (['gitlab', 'google', 'office365'].includes(service));

    const nicknameDisabled = (service === 'ldap' && config.LdapNicknameAttributeSet === 'true') ||
        (service === 'saml' && config.SamlNicknameAttributeSet === 'true');

    const positionDisabled = (service === 'ldap' && config.LdapPositionAttributeSet === 'true') ||
        (service === 'saml' && config.SamlPositionAttributeSet === 'true');

    let profilePictureDisabled = false;
    if (isMinimumServerVersion(serverVersion, 5, 24)) {
        profilePictureDisabled = (service === 'ldap' || service === 'saml') && config.LdapPictureAttributeSet === 'true';
    }

    return {
        firstNameDisabled,
        lastNameDisabled,
        nicknameDisabled,
        positionDisabled,
        profilePictureDisabled,
        theme: getTheme(state),
        isLandscape: isLandscape(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            setProfileImageUri,
            removeProfileImage,
            updateUser,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditProfile);
