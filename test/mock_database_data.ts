// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';

export const MOCKED_DATA = {
    LICENSE: '{"Announcement":"true","Cloud":"false","Cluster":"true","Company":"Mattermost Developers","Compliance":"true","CustomPermissionsSchemes":"true","CustomTermsOfService":"true","DataRetention":"true","Elasticsearch":"true","EmailNotificationContents":"true","GoogleOAuth":"true","GuestAccounts":"true","GuestAccountsPermissions":"true","IDLoadedPushNotifications":"true","IsLicensed":"true","IsTrial":"false","LDAP":"true","LDAPGroups":"true","LockTeammateNameDisplay":"true","MFA":"true","MHPNS":"true","MessageExport":"true","Metrics":"true","Office365OAuth":"true","OpenId":"true","RemoteClusterService":"true","SAML":"true","SharedChannels":"true","Users":"100000"}',
    CONFIG: '{"AboutLink":"http://www.mattermost.org/features/","AllowBannerDismissal":"true","AllowCustomThemes":"true","AllowedThemes":"","AndroidAppDownloadLink":"https://about.mattermost.com/mattermost-android-app/","AndroidLatestVersion":"","AndroidMinVersion":"","AppDownloadLink":"https://about.mattermost.com/downloads/","AsymmetricSigningPublicKey":"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEZc2jQqPdnW0M+2kc+68bDChEjzqhgbctrdhql/QhChLCxUinEQqx3+3uY5Q2s/9WCjXC9UdiAACYOT/nnxyusA==","AvailableLocales":"","BannerColor":"#f2a93b","BannerText":"","BannerTextColor":"#333333","BuildDate":"Wed Jul  7 13:35:42 UTC 2021","BuildEnterpriseReady":"true","BuildHash":"e5b9bee3cbb8c22508aecb724e28c66fcbba4093","BuildHashEnterprise":"5f5945751df929314967e539b5399598611996b7","BuildNumber":"5.37.0-rc1","CWSUrl":"","CloseUnusedDirectMessages":"true","CloudUserLimit":"0","CollapsedThreads":"default_off","CustomBrandText":"","CustomDescriptionText":"","CustomTermsOfServiceReAcceptancePeriod":"365","CustomUrlSchemes":"","DataRetentionEnableFileDeletion":"false","DataRetentionEnableMessageDeletion":"false","DataRetentionFileRetentionDays":"365","DataRetentionMessageRetentionDays":"365","DefaultClientLocale":"en","DefaultTheme":"default","DesktopLatestVersion":"","DesktopMinVersion":"","DiagnosticId":"fgggd7qpyibkdb3syfm9dmue4c","DiagnosticsEnabled":"true","EmailLoginButtonBorderColor":"#2389D7","EmailLoginButtonColor":"#0000","EmailLoginButtonTextColor":"#2389D7","EmailNotificationContentsType":"full","EnableAskCommunityLink":"true","EnableBanner":"false","EnableBotAccountCreation":"false","EnableChannelViewedMessages":"true","EnableCluster":"true","EnableCommands":"true","EnableCompliance":"false","EnableConfirmNotificationsToChannel":"true","EnableCustomBrand":"false","EnableCustomEmoji":"true","EnableCustomTermsOfService":"false","EnableCustomUserStatuses":"true","EnableDeveloper":"true","EnableDiagnostics":"true","EnableEmailBatching":"false","EnableEmailInvitations":"true","EnableEmojiPicker":"true","EnableFile":"true","EnableFileAttachments":"true","EnableGifPicker":"false","EnableGuestAccounts":"false","EnableIncomingWebhooks":"true","EnableLatex":"true","EnableLdap":"true","EnableLegacySidebar":"false","EnableLinkPreviews":"true","EnableMarketplace":"true","EnableMetrics":"false","EnableMobileFileDownload":"true","EnableMobileFileUpload":"true","EnableMultifactorAuthentication":"true","EnableOAuthServiceProvider":"false","EnableOpenServer":"true","EnableOutgoingWebhooks":"true","EnablePostIconOverride":"true","EnablePostUsernameOverride":"true","EnablePreviewFeatures":"true","EnablePreviewModeBanner":"true","EnablePublicLink":"true","EnableReliableWebSockets":"false","EnableSVGs":"true","EnableSaml":"true","EnableSignInWithEmail":"true","EnableSignInWithUsername":"true","EnableSignUpWithEmail":"true","EnableSignUpWithGitLab":"true","EnableSignUpWithGoogle":"false","EnableSignUpWithOffice365":"true","EnableSignUpWithOpenId":"false","EnableTesting":"true","EnableThemeSelection":"true","EnableTutorial":"true","EnableUserAccessTokens":"false","EnableUserCreation":"true","EnableUserDeactivation":"true","EnableUserTypingMessages":"true","EnableXToLeaveChannelsFromLHS":"false","EnforceMultifactorAuthentication":"false","ExperimentalChannelOrganization":"true","ExperimentalClientSideCertCheck":"secondary","ExperimentalClientSideCertEnable":"false","ExperimentalCloudBilling":"false","ExperimentalCloudUserLimit":"0","ExperimentalEnableAuthenticationTransfer":"true","ExperimentalEnableAutomaticReplies":"true","ExperimentalEnableClickToReply":"false","ExperimentalEnableDefaultChannelLeaveJoinMessages":"true","ExperimentalEnablePostMetadata":"true","ExperimentalGroupUnreadChannels":"disabled","ExperimentalHideTownSquareinLHS":"false","ExperimentalPrimaryTeam":"","ExperimentalRemoteClusterService":"false","ExperimentalSharedChannels":"false","ExperimentalTimezone":"true","ExperimentalTownSquareIsReadOnly":"false","ExperimentalViewArchivedChannels":"false","ExtendSessionLengthWithActivity":"false","FeatureFlagAppsEnabled":"false","FeatureFlagCloudDelinquentEmailJobsEnabled":"false","FeatureFlagCollapsedThreads":"true","FeatureFlagCustomDataRetentionEnabled":"false","FeatureFlagEnableRemoteClusterService":"false","FeatureFlagPluginApps":"","FeatureFlagPluginFocalboard":"","FeatureFlagPluginIncidentManagement":"1.12.0","FeatureFlagTestBoolFeature":"false","FeatureFlagTestFeature":"off","FeatureFlagTimedDND":"false","FileLevel":"DEBUG","GfycatApiKey":"2_KtH_W5","GfycatApiSecret":"3wLVZPiswc3DnaiaFoLkDvB4X0IV6CpMkj4tf2inJRsBY6-FnkT08zGmppWFgeof","GoogleDeveloperKey":"AIzaSyCv7Hu4d4w-40biLANfkQXzL6t3l8Bxa4A","GuestAccountsEnforceMultifactorAuthentication":"false","HasImageProxy":"false","HelpLink":"https://github.com/mattermost/platform/blob/master/doc/help/README.md","InstallationDate":"1587201055340","IosAppDownloadLink":"https://about.mattermost.com/mattermost-ios-app/","IosLatestVersion":"","IosMinVersion":"","IsDefaultMarketplace":"true","LdapFirstNameAttributeSet":"true","LdapLastNameAttributeSet":"true","LdapLoginButtonBorderColor":"#2389D7","LdapLoginButtonColor":"#0000","LdapLoginButtonTextColor":"#2389D7","LdapLoginFieldName":"LDAP Test","LdapNicknameAttributeSet":"true","LdapPictureAttributeSet":"false","LdapPositionAttributeSet":"true","LockTeammateNameDisplay":"false","ManagedResourcePaths":"","MaxFileSize":"52428800","MaxNotificationsPerChannel":"1000000","MaxPostSize":"16383","MinimumHashtagLength":"3","NoAccounts":"false","OpenIdButtonColor":"#145DBF","OpenIdButtonText":"","PasswordMinimumLength":"5","PasswordRequireLowercase":"false","PasswordRequireNumber":"false","PasswordRequireSymbol":"false","PasswordRequireUppercase":"false","PluginsEnabled":"true","PostEditTimeLimit":"-1","PrivacyPolicyLink":"https://github.com/mattermost/platform/blob/master/README.md","ReportAProblemLink":"https://forum.mattermost.org/c/general/trouble-shoot","RequireEmailVerification":"true","RestrictDirectMessage":"any","RunJobs":"true","SQLDriverName":"postgres","SamlFirstNameAttributeSet":"true","SamlLastNameAttributeSet":"true","SamlLoginButtonBorderColor":"#2389D7","SamlLoginButtonColor":"#34a28b","SamlLoginButtonText":"With OKTA","SamlLoginButtonTextColor":"#ffffff","SamlNicknameAttributeSet":"false","SamlPositionAttributeSet":"false","SendEmailNotifications":"true","SendPushNotifications":"true","ShowEmailAddress":"false","ShowFullName":"true","SiteName":"Mattermost","SiteURL":"https://rc.test.mattermost.com","SupportEmail":"feedback@mattermost.com","TeammateNameDisplay":"full_name","TelemetryId":"fgggd7qpyibkdb3syfm9dmue4c","TermsOfServiceLink":"https://github.com/mattermost/platform/blob/master/README.md","TimeBetweenUserTypingUpdatesMilliseconds":"5000","UpgradedFromTE":"false","Version":"5.37.0","WebsocketPort":"80","WebsocketSecurePort":"443","WebsocketURL":""}',
};

export const setupChannelMockData = async () => {
    const activeServerUrl = await DatabaseManager.getActiveServerUrl();

    if (!activeServerUrl) {
        // eslint-disable-next-line no-console
        console.error(
            'In Mock, unable to createChannels as there is no activeServerUrl set',
        );
    }

    const operator = DatabaseManager.serverDatabases[activeServerUrl!].operator;

    await operator.handleChannel({
        channels: [
            {
                id: '7hob1ggoypydubgje3y9fc15sr',
                create_at: 1619538066355,
                update_at: 1619538066355,
                delete_at: 0,
                team_id: '',
                type: 'G',
                display_name: 'A, E, M',
                name: '6e17d4ab762b910531f3cd710dd4d3b24d506a2f',
                header: '',
                purpose: '',
                last_post_at: 1625058978458,
                total_msg_count: 187,
                extra_update_at: 0,
                creator_id: '',
                scheme_id: null,
                group_constrained: null,
                shared: null,
            },
            {
                id: 'xgeikjf383ftmx8jzrhdocmfne',
                create_at: 1445641095585,
                update_at: 1585587904510,
                delete_at: 0,
                team_id: 'rcgiyftm7jyrxnma1osd8zswby',
                type: 'O',
                display_name: 'Developers',
                name: 'developers',
                header: '[Code of Conduct](https://community-daily.mattermost.com/core/pl/4k6zhws8c3dyxeee8whhawobte) | [Documentation](https://developers.mattermost.com/) | [Blog](https://developers.mattermost.com/blog) | [GO Tutorial](https://tour.golang.org/welcome/1) | [Effective GO](https://golang.org/doc/effective_go.html) | [React](https://facebook.github.io/react/) | [React Components](https://reactjs.org/docs/react-component.html) | [React-Bootstrap](https://react-bootstrap.github.io/)',
                purpose:
                    'Discuss developer issues with community and Mattermost Inc.',
                last_post_at: 1625051877789,
                total_msg_count: 33790,
                extra_update_at: 1526275951074,
                creator_id: 'yxz1531yctf7fxeujwxhged4we',
                scheme_id: null,
                group_constrained: false,
                shared: null,
            },
            {
                id: '9pm1nr6j7fgabc7ium3oixfroa',
                create_at: 1617210567354,
                update_at: 1617210567354,
                delete_at: 0,
                team_id: 'rcgiyftm7jyrxnma1osd8zswby',
                type: 'O',
                display_name: 'Mobile App Reviews',
                name: 'mobile-app-reviews',
                header: '',
                purpose: '',
                last_post_at: 1624985441111,
                total_msg_count: 83,
                extra_update_at: 0,
                creator_id: 'o1nq6cmn5pfo8k8tchb4gtx4kc',
                scheme_id: '',
                group_constrained: false,
                shared: null,
            },
        ],
        prepareRecordsOnly: false,
    });

    await operator.handleMyChannelSettings({
        settings: [
            {
                user_id: '1234567',
                msg_count: 0,
                last_viewed_at: 6009999,
                last_post_at: 3434234234,
                last_update_at: 3242343,
                roles: '',
                mention_count: 9,
                channel_id: '7hob1ggoypydubgje3y9fc15sr',
                notify_props: {
                    desktop: 'all',

                    // desktop_sound: 'default',
                    email: 'none',

                    // first_name: true,
                    // mention_keys: '',
                    push: 'mention',

                    // channel: true,
                    mark_unread: 'mention',
                },
            },
        ],
        prepareRecordsOnly: false,
    });

    await operator.handleSystem({
        systems: [
            {
                id: 'currentUserId',
                value: 'p9g6rzz3kffhxqxhm1zckjpwda',
            },
            {
                id: 'currentChannelId',
                value: '7hob1ggoypydubgje3y9fc15sr',
            },
            {
                id: 'config',
                value: MOCKED_DATA.CONFIG,
            },
            {
                id: 'license',
                value: MOCKED_DATA.LICENSE,
            },
        ],
        prepareRecordsOnly: false,
    });

    await operator.handleChannelInfo({
        channelInfos: [
            {
                channel_id: 'c',
                guest_count: 10,
                header: 'channel info header',
                member_count: 10,
                pinned_post_count: 3,
                purpose: 'sample channel ',
            },
        ],
        prepareRecordsOnly: false,
    });

    await operator.handleUsers({
        users: [
            {
                id: 'p9g6rzz3kffhxqxhm1zckjpwda',
                create_at: 1599457495881,
                update_at: 1607683720173,
                delete_at: 0,
                username: 'a.l',
                auth_service: 'saml',
                email: 'a.l@mattermost.com',
                email_verified: true,
                is_bot: false,
                nickname: '',
                first_name: 'A',
                last_name: 'L',
                position: 'Mobile Engineer',
                roles: 'system_user',
                props: {},
                notify_props: {
                    mark_unread: 'all',
                    desktop: 'all',
                    desktop_sound: 'true',
                    email: 'true',
                    first_name: 'true',
                    mention_keys: '',
                    push: 'mention',
                    channel: 'true',
                    auto_responder_active: 'false',
                    auto_responder_message:
                        'Hello, I am out of office and unable to respond to messages.',
                    comments: 'never',
                    desktop_notification_sound: 'Hello',
                    push_status: 'online',
                },
                last_picture_update: 1604686302260,
                locale: 'en',
                timezone: {
                    automaticTimezone: 'Indian/Mauritius',
                    manualTimezone: '',
                    useAutomaticTimezone: '',
                },
            },
        ],
        prepareRecordsOnly: false,
    });

    await operator.handlePreferences({
        preferences: [
            {
                user_id: 'p9g6rzz3kffhxqxhm1zckjpwda',
                category: 'group_channel_show',
                name: 'qj91hepgjfn6xr4acm5xzd8zoc',
                value: 'true',
            },
            {
                user_id: 'p9g6rzz3kffhxqxhm1zckjpwda',
                category: 'notifications',
                name: 'email_interval',
                value: '30',
            },
            {
                user_id: 'p9g6rzz3kffhxqxhm1zckjpwda',
                category: 'theme',
                name: '',
                value: '{"awayIndicator":"#c1b966","buttonBg":"#4cbba4","buttonColor":"#ffffff","centerChannelBg":"#2f3e4e","centerChannelColor":"#dddddd","codeTheme":"solarized-dark","dndIndicator":"#e81023","errorTextColor":"#ff6461","image":"/static/files/0b8d56c39baf992e5e4c58d74fde0fd6.png","linkColor":"#a4ffeb","mentionBg":"#b74a4a","mentionColor":"#ffffff","mentionHighlightBg":"#984063","mentionHighlightLink":"#a4ffeb","newMessageSeparator":"#5de5da","onlineIndicator":"#65dcc8","sidebarBg":"#1b2c3e","sidebarHeaderBg":"#1b2c3e","sidebarHeaderTextColor":"#ffffff","sidebarText":"#ffffff","sidebarTextActiveBorder":"#66b9a7","sidebarTextActiveColor":"#ffffff","sidebarTextHoverBg":"#4a5664","sidebarUnreadText":"#ffffff","type":"Mattermost Dark"}',
            },
            {
                user_id: 'p9g6rzz3kffhxqxhm1zckjpwda',
                category: 'tutorial_step',
                name: 'p9g6rzz3kffhxqxhm1zckjpwda',
                value: '2',
            },
        ],
        prepareRecordsOnly: false,
    });
};
