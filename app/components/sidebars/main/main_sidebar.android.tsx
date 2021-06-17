// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Dimensions, Keyboard} from 'react-native';
import {IntlProvider} from 'react-intl';

import EventEmitter from '@mm-redux/utils/event_emitter';

import {closeMainSideMenu, enableMainSideMenu} from 'app/actions/navigation';
import {NavigationTypes} from 'app/constants';
import {getTranslations} from 'app/i18n';

import MainSidebarBase from './main_sidebar_base';

export default class MainSidebarAndroid extends MainSidebarBase {
    constructor(props) {
        super(props);

        this.state = {
            deviceWidth: Dimensions.get('window').width,
            opened: false,
            searching: false,
        };
    }

    componentDidMount() {
        super.componentDidMount();

        EventEmitter.on(NavigationTypes.MAIN_SIDEBAR_DID_CLOSE, this.handleSidebarDidClose);
        EventEmitter.on(NavigationTypes.MAIN_SIDEBAR_DID_OPEN, this.handleSidebarDidOpen);
    }

    componentWillUnmount() {
        super.componentWillUnmount();

        EventEmitter.off(NavigationTypes.MAIN_SIDEBAR_DID_CLOSE, this.handleSidebarDidClose);
        EventEmitter.off(NavigationTypes.MAIN_SIDEBAR_DID_OPEN, this.handleSidebarDidOpen);
    }

    closeMainSidebar = () => {
        closeMainSideMenu();
    };

    handleDimensions = ({window}) => {
        if (this.mounted) {
            this.setState({deviceWidth: window.width});
        }
    };

    handleSidebarDidClose = () => {
        this.setState({searching: false, opened: false}, () => {
            enableMainSideMenu(true, false);
            this.resetDrawer(true);
            Keyboard.dismiss();
        });
    };

    handleSidebarDidOpen = () => {
        this.setState({opened: true});
    }

    onPageSelected = (index) => {
        this.swiperIndex = index;

        if (this.state.opened) {
            enableMainSideMenu(index !== 0, true);
        }
    };

    setProviderRef = (ref) => {
        this.providerRef = ref;
    }

    render() {
        const locale = this.props.locale;

        if (!locale) {
            return null;
        }

        return (
            <IntlProvider
                key={locale}
                locale={locale}
                ref={this.setProviderRef}
                messages={getTranslations(locale)}
            >
                {this.renderNavigationView(this.state.deviceWidth)}
            </IntlProvider>
        );
    }
}
