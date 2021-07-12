// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import {Client4} from '@client/rest';
import AttachmentButton from '@components/attachment_button';
import {t} from '@utils/i18n';

export default class ProfilePictureButton extends PureComponent {
    static propTypes = {
        currentUser: PropTypes.object.isRequired,
        theme: PropTypes.object.isRequired,
        removeProfileImage: PropTypes.func,
        children: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.node),
            PropTypes.node,
        ]),
    };

    constructor(props) {
        super(props);
        this.state = {
            extraOptions: [this.getRemoveProfileImageOption()],
        };
    }

    getRemoveProfileImageOption = () => {
        let action = null;
        const {removeProfileImage} = this.props;
        const {id, last_picture_update: lastPictureUpdate} = this.props.currentUser;

        const profileImageUrl = Client4.getProfilePictureUrl(id, lastPictureUpdate);

        if (removeProfileImage !== null) {
            action = removeProfileImage;
        }

        // Check if image url includes query string for timestamp.
        // If so, it means the image has been updated from the default
        // i.e. '.../image?_=1544159746868'
        if (profileImageUrl.includes('?')) {
            return {
                action,
                text: {
                    id: t('mobile.edit_profile.remove_profile_photo'),
                    defaultMessage: 'Remove Photo',
                },
                textStyle: {
                    color: '#CC3239',
                },
                icon: 'trash-can-outline',
                iconStyle: {
                    color: '#CC3239',
                },
            };
        }
        return null;
    };

    render() {
        const {children, ...props} = this.props;
        const {extraOptions} = this.state;

        // Avoid passing unneeded props
        Reflect.deleteProperty(props, 'currentUser');

        return (
            <AttachmentButton
                {...props}
                extraOptions={extraOptions}
            >
                {children}
            </AttachmentButton>
        );
    }
}
