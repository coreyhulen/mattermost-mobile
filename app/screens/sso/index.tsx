// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';

import {resetToChannel} from '@actions/navigation';
import {scheduleExpiredNotification} from '@actions/views/session';
import {ssoLogin} from '@actions/views/user';
import {Client4} from '@client/rest';
import {ViewTypes} from '@constants';
import emmProvider from '@init/emm_provider';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {DispatchFunc} from '@mm-redux/types/actions';
import {ErrorApi} from '@mm-redux/types/client4';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';

import SSOWithRedirectURL from './sso_with_redirect_url';
import SSOWithWebView from './sso_with_webview';

import type {GlobalState} from '@mm-redux/types/store';

interface SSOProps {
    intl: typeof intlShape;
    ssoType: string;
}

function SSO({intl, ssoType}: SSOProps) {
    const [config, serverUrl, theme] = useSelector((state: GlobalState) => ([
        getConfig(state),
        state.views.selectServer.serverUrl,
        getTheme(state),
    ]), shallowEqual);

    const [loginError, setLoginError] = React.useState<string>('');

    const asyncDispatch: DispatchFunc = useDispatch();
    const dispatch = useDispatch();

    let completeUrlPath = '';
    let loginUrl = '';
    switch (ssoType) {
    case ViewTypes.GOOGLE: {
        completeUrlPath = '/signup/google/complete';
        loginUrl = `${serverUrl}/oauth/google/mobile_login`;
        break;
    }
    case ViewTypes.GITLAB: {
        completeUrlPath = '/signup/gitlab/complete';
        loginUrl = `${serverUrl}/oauth/gitlab/mobile_login`;
        break;
    }
    case ViewTypes.SAML: {
        completeUrlPath = '/login/sso/saml';
        loginUrl = `${serverUrl}/login/sso/saml?action=mobile`;
        break;
    }
    case ViewTypes.OFFICE365: {
        completeUrlPath = '/signup/office365/complete';
        loginUrl = `${serverUrl}/oauth/office365/mobile_login`;
        break;
    }
    case ViewTypes.OPENID: {
        completeUrlPath = '/signup/openid/complete';
        loginUrl = `${serverUrl}/oauth/openid/mobile_login`;
        break;
    }
    }

    const onLoadEndError = (e: ErrorApi) => {
        console.warn('Failed to set store from local data', e); // eslint-disable-line no-console
        let errorMessage = e.message;
        if (e.url) {
            errorMessage += `\nURL: ${e.url}`;
        }
        setLoginError(errorMessage);
    };

    const onMMToken = async (token: string) => {
        Client4.setToken(token);
        asyncDispatch(ssoLogin()).then((result: any) => {
            if (result && result.error) {
                onLoadEndError(result.error);
                return;
            }
            goToChannel();
        }).catch(() => {
            setLoginError('');
        });
    };

    const goToChannel = () => {
        scheduleSessionExpiredNotification();
        resetToChannel();
    };

    const scheduleSessionExpiredNotification = () => {
        dispatch(scheduleExpiredNotification(intl));
    };

    const isSSOWithRedirectURLAvailable = isMinimumServerVersion(config.Version, 5, 33, 0);

    const props = {
        intl,
        loginError,
        loginUrl,
        onCSRFToken: Client4.setCSRF,
        onMMToken,
        setLoginError,
        theme,
    };

    if (!isSSOWithRedirectURLAvailable || emmProvider.inAppSessionAuth === true) {
        return (
            <SSOWithWebView
                {...props}
                completeUrlPath={completeUrlPath}
                serverUrl={serverUrl}
                ssoType={ssoType}
            />
        );
    }

    return (
        <SSOWithRedirectURL {...props}/>
    );
}

export default React.memo(injectIntl(SSO));
