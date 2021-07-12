// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {intlShape} from 'react-intl';
import {StyleProp, ViewStyle} from 'react-native';
import Animated from 'react-native-reanimated';

import type {FileInfo} from '@mm-redux/types/files';
import type {Theme} from '@mm-redux/types/preferences';

export interface ActionCallback {
    (callback: CallbackFunctionWithoutArguments): void;
}

export interface ActionProps {
    action: (callback: CallbackFunctionWithoutArguments) => void;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    visible: boolean;
}

export interface ActionsProps {
    canDownloadFiles: boolean;
    enablePublicLink: boolean;
    downloadAction: ActionCallback;
    file: FileInfo;
    linkAction: ActionCallback;
}

export interface AvatarProps {
    avatarUri?: string;
    theme: Theme;
}

export interface CallbackFunctionWithoutArguments {
    (): void;
}

export interface DetailsProps {
    channel?: string;
    isDirect?: boolean;
    ownPost?: boolean;
    user?: string;
}

export interface PrepareFileRef {
    start(file: FileInfo, share?: boolean): Promise<string | undefined>;
}

export interface FooterProps {
    intl?: typeof intlShape;
    file: FileInfo;
}

export interface FooterRef {
    toggle(): boolean;
    isVisible(): boolean;
    setVisible(visible: boolean): void;
}

export interface GalleryProps {
    files: Array<FileInfo>;
    footerVisible: boolean;
    height: number;
    initialIndex: number;
    isLandscape: boolean;
    onClose: CallbackFunctionWithoutArguments;
    onPageSelected: (index: number) => void;
    onTap: CallbackFunctionWithoutArguments;
    width: number;
    theme: Theme;
}

export interface GalleryItemProps {
    file: FileInfo;
    deviceHeight: number;
    deviceWidth: number;
    intl?: typeof intlShape;
    isActive?: boolean;
    showHideHeaderFooter?(display: boolean): void;
    style?: StyleProp<Animated.AnimateStyle>;
    theme?: Theme;
}

export interface ManagedConfig {
    [key: string]: string;
}

export interface ShowToast {
    (text: string, duration?: number, callback?: () => void): void;
}

export interface SummaryProps {
    avatarUri?: string;
    channelName?: string;
    copyPublicLink: ActionCallback;
    displayName?: string;
    dowloadFile: ActionCallback;
    file: FileInfo;
    isDirectChannel: boolean;
    isLandscape: boolean;
    ownPost: boolean;
    theme: Theme;
}

export interface ToastProps {
    theme: Theme;
}

export interface ToastRef {
    show: ShowToast;
}

export interface ToastState {
    animation?: CompositeAnimation;
    duration?: number;
    callback?: () => void;
}
