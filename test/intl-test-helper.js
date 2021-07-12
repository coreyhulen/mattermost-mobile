// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {mount, shallow} from 'enzyme';
import React from 'react';
import {IntlProvider, intlShape} from 'react-intl';

import {getTranslations} from '@i18n';

const intlProvider = new IntlProvider({locale: 'en'}, {});
export const {intl} = intlProvider.getChildContext();

export function shallowWithIntl(node, {context} = {}) {
    return shallow(React.cloneElement(node, {intl}), {
        context: Object.assign({}, context, {intl}),
    });
}

export function shallowWithIntlMessages(node, {context} = {}) {
    const provider = new IntlProvider({locale: 'en', messages: getTranslations('en')}, {});
    const {intl: intlWithMessages} = provider.getChildContext();

    return shallow(React.cloneElement(node, {intl: intlWithMessages}), {
        context: Object.assign({}, context, {intl: intlWithMessages}),
    });
}

export function mountWithIntl(node, {context, childContextTypes} = {}) {
    return mount(React.cloneElement(node, {intl}), {
        context: Object.assign({}, context, {intl}),
        childContextTypes: Object.assign({}, {intl: intlShape}, childContextTypes),
    });
}
