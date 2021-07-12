// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Alert, View} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';
import RNFetchBlob from 'rn-fetch-blob';

import {popTopScreen, dismissModal, setButtons} from '@actions/navigation';
import {Client4} from '@client/rest';
import ErrorText from '@components/error_text';
import Loading from '@components/loading';
import ProfilePicture from '@components/profile_picture';
import ProfilePictureButton from '@components/profile_picture_button';
import StatusBar from '@components/status_bar/index';
import TextSetting from '@components/widgets/settings/text_setting';
import {getFormattedFileSize} from '@mm-redux/utils/file_utils';
import {buildFileUploadData, encodeHeaderURIStringToUTF8} from '@utils/file';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import mattermostBucket from 'app/mattermost_bucket';

const MAX_SIZE = 20 * 1024 * 1024;
export const VALID_MIME_TYPES = [
    'image/jpeg',
    'image/jpeg',
    'image/jpg',
    'image/jp_',
    'application/jpg',
    'application/x-jpg',
    'image/pjpeg',
    'image/pipeg',
    'image/vnd.swiftview-jpeg',
    'image/x-xbitmap',
    'image/png',
    'application/png',
    'application/x-png',
    'image/bmp',
    'image/x-bmp',
    'image/x-bitmap',
    'image/x-xbitmap',
    'image/x-win-bitmap',
    'image/x-windows-bmp',
    'image/ms-bmp',
    'image/x-ms-bmp',
    'application/bmp',
    'application/x-bmp',
    'application/x-win-bitmap',
];
const holders = {
    firstName: {
        id: t('user.settings.general.firstName'),
        defaultMessage: 'First Name',
    },
    lastName: {
        id: t('user.settings.general.lastName'),
        defaultMessage: 'Last Name',
    },
    username: {
        id: t('user.settings.general.username'),
        defaultMessage: 'Username',
    },
    nickname: {
        id: t('user.settings.general.nickname'),
        defaultMessage: 'Nickname',
    },
    position: {
        id: t('user.settings.general.position'),
        defaultMessage: 'Position',
    },
    email: {
        id: t('user.settings.general.email'),
        defaultMessage: 'Email',
    },
};

export default class EditProfile extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            setProfileImageUri: PropTypes.func.isRequired,
            removeProfileImage: PropTypes.func.isRequired,
            updateUser: PropTypes.func.isRequired,
        }).isRequired,
        componentId: PropTypes.string,
        currentUser: PropTypes.object.isRequired,
        firstNameDisabled: PropTypes.bool.isRequired,
        lastNameDisabled: PropTypes.bool.isRequired,
        nicknameDisabled: PropTypes.bool.isRequired,
        positionDisabled: PropTypes.bool.isRequired,
        profilePictureDisabled: PropTypes.bool.isRequired,
        theme: PropTypes.object.isRequired,
        commandType: PropTypes.string.isRequired,
        isLandscape: PropTypes.bool.isRequired,
    };

    static contextTypes = {
        intl: intlShape,
    };

    rightButton = {
        id: 'update-profile',
        enabled: false,
        showAsAction: 'always',
        testID: 'edit_profile.save.button',
    };

    constructor(props, context) {
        super(props);

        const {email, first_name: firstName, last_name: lastName, nickname, position, username} = props.currentUser;
        const buttons = {
            rightButtons: [this.rightButton],
        };
        this.rightButton.color = props.theme.sidebarHeaderTextColor;
        this.rightButton.text = context.intl.formatMessage({id: t('mobile.account.settings.save'), defaultMessage: 'Save'});

        setButtons(props.componentId, buttons);

        this.state = {
            email,
            firstName,
            lastName,
            nickname,
            position,
            username,
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    navigationButtonPressed({buttonId}) {
        switch (buttonId) {
        case 'update-profile':
            this.submitUser();
            break;
        case 'close-settings':
            this.close();
            break;
        }
    }

    canUpdate = (updatedField) => {
        const {currentUser} = this.props;
        const keys = Object.keys(this.state);
        const newState = {...this.state, ...(updatedField || {})};
        Reflect.deleteProperty(newState, 'error');
        Reflect.deleteProperty(newState, 'updating');

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let userKey;
            switch (key) {
            case 'firstName':
                userKey = 'first_name';
                break;
            case 'lastName':
                userKey = 'last_name';
                break;
            default:
                userKey = key;
                break;
            }

            if (currentUser[userKey] !== newState[key]) {
                return true;
            }
        }

        return false;
    };

    close = () => {
        const {commandType} = this.props;
        if (commandType === 'Push') {
            popTopScreen();
        } else {
            dismissModal();
        }
    };

    emitCanUpdateAccount = (enabled) => {
        const {componentId} = this.props;
        const buttons = {
            rightButtons: [{...this.rightButton, enabled}],
        };

        setButtons(componentId, buttons);
    };

    handleRequestError = (error) => {
        this.setState({error, updating: false});
        this.emitCanUpdateAccount(true);
        if (this.scrollView) {
            this.scrollView.props.scrollTo({x: 0, y: 0});
        }
    };

    submitUser = preventDoubleTap(async () => {
        this.emitCanUpdateAccount(false);
        this.setState({error: null, updating: true});

        const {
            profileImage,
            profileImageRemove,
            firstName,
            lastName,
            username,
            nickname,
            position,
            email,
        } = this.state;
        const user = {
            first_name: firstName,
            last_name: lastName,
            username,
            nickname,
            position,
            email,
        };
        const {actions, currentUser} = this.props;

        if (profileImage) {
            actions.setProfileImageUri(profileImage.uri);
            this.uploadProfileImage().catch(this.handleUploadError);
        }

        if (profileImageRemove) {
            actions.removeProfileImage(currentUser.id);
        }

        if (this.canUpdate()) {
            const {error} = await actions.updateUser(user);
            if (error) {
                this.handleRequestError(error);
                return;
            }
        }

        this.close();
    });

    handleUploadProfileImage = (images) => {
        const image = images && images.length > 0 && images[0];
        this.setState({profileImage: image});
        this.emitCanUpdateAccount(true);
    };

    handleRemoveProfileImage = () => {
        this.setState({profileImageRemove: true});
        this.emitCanUpdateAccount(true);
    };

    uploadProfileImage = async () => {
        const {profileImage} = this.state;
        const {currentUser} = this.props;
        const fileData = buildFileUploadData(profileImage);

        const headers = {
            Authorization: `Bearer ${Client4.getToken()}`,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'multipart/form-data',
            'X-CSRF-Token': Client4.csrf,
        };

        const fileInfo = {
            name: 'image',
            filename: encodeHeaderURIStringToUTF8(fileData.name),
            data: RNFetchBlob.wrap(profileImage.uri.replace('file://', '')),
            type: fileData.type,
        };

        const certificate = await mattermostBucket.getPreference('cert');
        const options = {
            timeout: 10000,
            certificate,
        };

        return RNFetchBlob.config(options).fetch('POST', `${Client4.getUserRoute(currentUser.id)}/image`, headers, [fileInfo]);
    };

    updateField = (id, name) => {
        const field = {[id]: name};
        this.setState(field, () => {
            this.emitCanUpdateAccount(this.canUpdate(field));
        });
    };

    onShowFileSizeWarning = () => {
        const {formatMessage} = this.context.intl;
        const fileSizeWarning = formatMessage({
            id: 'file_upload.fileAbove',
            defaultMessage: 'Files must be less than {max}',
        }, {
            max: getFormattedFileSize({size: MAX_SIZE}),
        });

        Alert.alert(fileSizeWarning);
    };

    onShowUnsupportedMimeTypeWarning = () => {
        const {formatMessage} = this.context.intl;
        const fileTypeWarning = formatMessage({
            id: 'mobile.file_upload.unsupportedMimeType',
            defaultMessage: 'Only BMP, JPG or PNG images may be used for profile pictures.',
        });

        Alert.alert('', fileTypeWarning);
    };

    renderFirstNameSettings = () => {
        const {formatMessage} = this.context.intl;
        const {firstNameDisabled, theme, isLandscape} = this.props;
        const {firstName} = this.state;

        return (
            <TextSetting
                disabled={firstNameDisabled}
                id='firstName'
                label={holders.firstName}
                disabledText={formatMessage({
                    id: 'user.settings.general.field_handled_externally',
                    defaultMessage: 'This field is handled through your login provider. If you want to change it, you need to do so through your login provider.',
                })}
                onChange={this.updateField}
                theme={theme}
                value={firstName}
                isLandscape={isLandscape}
                testID='edit_profile.text_setting.first_name'
            />
        );
    };

    renderLastNameSettings = () => {
        const {formatMessage} = this.context.intl;
        const {lastNameDisabled, theme, isLandscape} = this.props;
        const {lastName} = this.state;

        return (
            <View>
                <TextSetting
                    disabled={lastNameDisabled}
                    id='lastName'
                    label={holders.lastName}
                    disabledText={formatMessage({
                        id: 'user.settings.general.field_handled_externally',
                        defaultMessage: 'This field is handled through your login provider. If you want to change it, you need to do so through your login provider.',
                    })}
                    onChange={this.updateField}
                    theme={theme}
                    value={lastName}
                    isLandscape={isLandscape}
                    testID='edit_profile.text_setting.last_name'
                />
            </View>
        );
    };

    renderUsernameSettings = () => {
        const {formatMessage} = this.context.intl;
        const {currentUser, theme, isLandscape} = this.props;
        const {username} = this.state;
        const disabled = currentUser.auth_service !== '';

        return (
            <TextSetting
                disabled={disabled}
                id='username'
                label={holders.username}
                disabledText={formatMessage({
                    id: 'user.settings.general.field_handled_externally',
                    defaultMessage: 'This field is handled through your login provider. If you want to change it, you need to do so through your login provider.',
                })}
                maxLength={22}
                onChange={this.updateField}
                theme={theme}
                value={username}
                isLandscape={isLandscape}
                testID='edit_profile.text_setting.username'
            />
        );
    };

    renderEmailSettings = () => {
        const {formatMessage} = this.context.intl;
        const {currentUser, theme, isLandscape} = this.props;
        const {email} = this.state;

        let helpText;

        if (currentUser.auth_service === '') {
            helpText = formatMessage({
                id: 'user.settings.general.emailCantUpdate',
                defaultMessage: 'Email must be updated using a web client or desktop application.',
            });
        } else {
            switch (currentUser.auth_service) {
            case 'gitlab':
                helpText = formatMessage({
                    id: 'user.settings.general.emailGitlabCantUpdate',
                    defaultMessage: 'Login occurs through GitLab. Email cannot be updated. Email address used for notifications is {email}.',
                }, {email});
                break;
            case 'google':
                helpText = formatMessage({
                    id: 'user.settings.general.emailGoogleCantUpdate',
                    defaultMessage: 'Login occurs through Google Apps. Email cannot be updated. Email address used for notifications is {email}.',
                }, {email});
                break;
            case 'office365':
                helpText = formatMessage({
                    id: 'user.settings.general.emailOffice365CantUpdate',
                    defaultMessage: 'Login occurs through Office 365. Email cannot be updated. Email address used for notifications is {email}.',
                }, {email});
                break;
            case 'ldap':
                helpText = formatMessage({
                    id: 'user.settings.general.emailLdapCantUpdate',
                    defaultMessage: 'Login occurs through AD/LDAP. Email cannot be updated. Email address used for notifications is {email}.',
                }, {email});
                break;
            case 'saml':
                helpText = formatMessage({
                    id: 'user.settings.general.emailSamlCantUpdate',
                    defaultMessage: 'Login occurs through SAML. Email cannot be updated. Email address used for notifications is {email}.',
                }, {email});
                break;
            }
        }

        return (
            <View>
                <TextSetting
                    disabled={true}
                    id='email'
                    label={holders.email}
                    disabledText={helpText}
                    onChange={this.updateField}
                    theme={theme}
                    value={email}
                    isLandscape={isLandscape}
                    testID='edit_profile.text_setting.email'
                />
            </View>
        );
    };

    renderNicknameSettings = () => {
        const {formatMessage} = this.context.intl;
        const {nicknameDisabled, theme, isLandscape} = this.props;
        const {nickname} = this.state;

        return (
            <TextSetting
                disabled={nicknameDisabled}
                id='nickname'
                label={holders.nickname}
                disabledText={formatMessage({
                    id: 'user.settings.general.field_handled_externally',
                    defaultMessage: 'This field is handled through your login provider. If you want to change it, you need to do so through your login provider.',
                })}
                maxLength={22}
                onChange={this.updateField}
                theme={theme}
                value={nickname}
                isLandscape={isLandscape}
                optional={true}
                testID='edit_profile.text_setting.nickname'
            />
        );
    };

    renderPositionSettings = () => {
        const {formatMessage} = this.context.intl;
        const {positionDisabled, theme, isLandscape} = this.props;
        const {position} = this.state;

        return (
            <TextSetting
                disabled={positionDisabled}
                id='position'
                label={holders.position}
                disabledText={formatMessage({
                    id: 'user.settings.general.field_handled_externally',
                    defaultMessage: 'This field is handled through your login provider. If you want to change it, you need to do so through your login provider.',
                })}
                maxLength={128}
                onChange={this.updateField}
                theme={theme}
                value={position}
                isLandscape={isLandscape}
                optional={true}
                testID='edit_profile.text_setting.position'
            />
        );
    };

    scrollViewRef = (ref) => {
        this.scrollView = ref;
    };

    renderProfilePicture = () => {
        const {
            currentUser,
            profilePictureDisabled,
            theme,
        } = this.props;

        const {
            profileImage,
            profileImageRemove,
        } = this.state;

        const style = getStyleSheet(theme);
        const uri = profileImage ? profileImage.uri : null;
        const profilePicture = (
            <ProfilePicture
                userId={currentUser.id}
                size={153}
                iconSize={104}
                statusBorderWidth={6}
                statusSize={36}
                edit={!profilePictureDisabled}
                imageUri={uri}
                profileImageRemove={profileImageRemove}
                testID='edit_profile.profile_picture'
            />
        );

        if (profilePictureDisabled) {
            return (
                <View style={style.top}>
                    {profilePicture}
                </View>
            );
        }

        return (
            <View style={style.top}>
                <ProfilePictureButton
                    currentUser={currentUser}
                    theme={theme}
                    browseFileTypes={DocumentPicker.types.images}
                    canTakeVideo={false}
                    canBrowseVideoLibrary={false}
                    maxFileSize={MAX_SIZE}
                    wrapper={true}
                    uploadFiles={this.handleUploadProfileImage}
                    removeProfileImage={this.handleRemoveProfileImage}
                    onShowFileSizeWarning={this.onShowFileSizeWarning}
                    onShowUnsupportedMimeTypeWarning={this.onShowUnsupportedMimeTypeWarning}
                    validMimeTypes={VALID_MIME_TYPES}
                >
                    {profilePicture}
                </ProfilePictureButton>
            </View>
        );
    };

    render() {
        const {theme} = this.props;

        const {
            error,
            updating,
        } = this.state;

        const style = getStyleSheet(theme);

        if (updating) {
            return (
                <SafeAreaView style={[style.container, style.flex]}>
                    <StatusBar/>
                    <Loading color={theme.centerChannelColor}/>
                </SafeAreaView>
            );
        }

        let displayError;
        if (error) {
            displayError = (
                <View style={style.errorContainer}>
                    <View style={style.errorWrapper}>
                        <ErrorText
                            testID='edit_profile.error.text'
                            error={error}
                            textStyle={style.errorText}
                        />
                    </View>
                </View>
            );
        }

        return (
            <SafeAreaView
                testID='edit_profile.screen'
                style={style.flex}
            >
                <StatusBar/>
                <KeyboardAwareScrollView
                    bounces={false}
                    innerRef={this.scrollViewRef}
                    testID='edit_profile.scroll_view'
                >
                    {displayError}
                    <View style={[style.scrollView]}>
                        {this.renderProfilePicture()}
                        {this.renderFirstNameSettings()}
                        <View style={style.separator}/>
                        {this.renderLastNameSettings()}
                        <View style={style.separator}/>
                        {this.renderUsernameSettings()}
                        <View style={style.separator}/>
                        {this.renderEmailSettings()}
                        <View style={style.separator}/>
                        {this.renderNicknameSettings()}
                        <View style={style.separator}/>
                        {this.renderPositionSettings()}
                        <View style={style.footer}/>
                    </View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        flex: {
            flex: 1,
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
            paddingTop: 10,
        },
        top: {
            padding: 25,
            alignItems: 'center',
            justifyContent: 'center',
        },
        errorContainer: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
            width: '100%',
        },
        errorWrapper: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            fontSize: 14,
            marginHorizontal: 15,
        },
        separator: {
            height: 15,
        },
        footer: {
            height: 40,
            width: '100%',
        },
    };
});
