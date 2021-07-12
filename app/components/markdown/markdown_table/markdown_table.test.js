// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import MarkdownTable from './markdown_table';

describe('MarkdownTable', () => {
    const createCell = (type, children = null) => {
        return React.createElement('', {key: Date.now(), className: type}, children);
    };

    const numColumns = 10;
    const children = [];
    for (let i = 0; i <= numColumns; i++) {
        const cols = [];
        for (let j = 0; j <= numColumns; j++) {
            cols.push(createCell('col'));
        }

        children.push(createCell('row', cols));
    }

    const baseProps = {
        children,
        numColumns,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <MarkdownTable {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should call setMaxPreviewColumns on mount', () => {
        const wrapper = shallowWithIntl(
            <MarkdownTable {...baseProps}/>,
        );
        const instance = wrapper.instance();
        const setMaxPreviewColumns = jest.spyOn(instance, 'setMaxPreviewColumns');

        instance.componentDidMount();
        expect(setMaxPreviewColumns).toHaveBeenCalled();
        expect(instance.state.maxPreviewColumns).toBeDefined();
    });

    test('should slice rows and columns', () => {
        const wrapper = shallowWithIntl(
            <MarkdownTable {...baseProps}/>,
        );

        const {maxPreviewColumns} = wrapper.state();
        expect(wrapper.find('.row')).toHaveLength(maxPreviewColumns);
        expect(wrapper.find('.col')).toHaveLength(Math.pow(maxPreviewColumns, 2));

        const newMaxPreviewColumns = maxPreviewColumns - 1;
        wrapper.setState({maxPreviewColumns: newMaxPreviewColumns});
        expect(wrapper.find('.row')).toHaveLength(newMaxPreviewColumns);
        expect(wrapper.find('.col')).toHaveLength(Math.pow(newMaxPreviewColumns, 2));
    });

    test('should add the isFirstRow prop to the first row', () => {
        const wrapper = shallowWithIntl(
            <MarkdownTable {...baseProps}/>,
        );
        const instance = wrapper.instance();
        const fullRows = instance.renderRows();
        const previewRows = instance.renderPreviewRows();

        [fullRows, previewRows].forEach((rows) => {
            const firstRows = rows.props.children.filter((child) => child.props.isFirstRow);
            expect(firstRows.length).toEqual(1);
            expect(firstRows[0]).toEqual(rows.props.children[0]);
        });
    });

    test('should add the isLastRow prop to the last row', () => {
        const wrapper = shallowWithIntl(
            <MarkdownTable {...baseProps}/>,
        );
        const instance = wrapper.instance();
        const fullRows = instance.renderRows();
        const previewRows = instance.renderPreviewRows();

        [fullRows, previewRows].forEach((rows) => {
            const lastRows = rows.props.children.filter((child) => child.props.isLastRow);
            expect(lastRows.length).toEqual(1);
            expect(lastRows[0]).toEqual(rows.props.children[rows.props.children.length - 1]);
        });
    });
});
