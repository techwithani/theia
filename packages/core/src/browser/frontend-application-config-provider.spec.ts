// *****************************************************************************
// Copyright (C) 2021 Ericsson and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
// *****************************************************************************

import { enableJSDOM } from '../browser/test/jsdom';
let disableJSDOM = enableJSDOM();

import { FrontendApplicationConfig } from '@theia/application-package/lib/';
import { expect } from 'chai';
import { FrontendApplicationConfigProvider } from './frontend-application-config-provider';

disableJSDOM();

const { DEFAULT } = FrontendApplicationConfig;

describe('FrontendApplicationConfigProvider', function (): void {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    it('should use defaults when calling `set`', function (): void {
        FrontendApplicationConfigProvider.set({
            applicationName: DEFAULT.applicationName + ' Something Else',
            electron: {
                disallowReloadKeybinding: !DEFAULT.electron.disallowReloadKeybinding
            }
        });
        const config = FrontendApplicationConfigProvider.get();
        // custom values
        expect(config.applicationName).not.equal(DEFAULT.applicationName);
        expect(config.electron.disallowReloadKeybinding).not.equal(DEFAULT.electron.disallowReloadKeybinding);
        // defaults
        expect(config.defaultIconTheme).equal(DEFAULT.defaultIconTheme);
        expect(config.defaultTheme).equal(DEFAULT.defaultTheme);
        expect(config.electron.windowOptions).deep.equal(DEFAULT.electron.windowOptions);
    });
});
