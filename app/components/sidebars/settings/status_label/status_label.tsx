// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

import {General} from '@mm-redux/constants';

import FormattedText from '@components/formatted_text';
import {changeOpacity, makeStyleSheetFromTheme} from 'app/utils/theme';
import {t} from 'app/utils/i18n';

export default class UserInfo extends PureComponent {
	public props: any;
	public status: any;
	public theme: any;
    static propTypes = {
        status: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        status: General.OFFLINE,
    };

    render() {
        const {status, theme} = this.props;
        const style = getStyleSheet(theme);

        let i18nId = t('status_dropdown.set_offline');
        let defaultMessage = 'Offline';
        switch (status) {
        case General.AWAY:
            i18nId = t('status_dropdown.set_away');
            defaultMessage = 'Away';
            break;
        case General.DND:
            i18nId = t('status_dropdown.set_dnd');
            defaultMessage = 'Do Not Disturb';
            break;
        case General.ONLINE:
            i18nId = t('status_dropdown.set_online');
            defaultMessage = 'Online';
            break;
        }

        if (status === General.OUT_OF_OFFICE) {
            i18nId = t('status_dropdown.set_ooo');
            defaultMessage = 'Out Of Office';
        }

        return (
            <FormattedText
                id={i18nId}
                defaultMessage={defaultMessage}
                style={style.label}
                testID={`user_status.label.${status}`}
            />
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        label: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 17,
            textAlignVertical: 'center',
            includeFontPadding: false,
        },
    };
});
