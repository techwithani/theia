/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { ReactWidget } from '@theia/core/lib/browser';
import { CommandRegistry, Disposable } from '@theia/core/lib/common';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { DebugConsoleContribution } from '../console/debug-console-contribution';
import { DebugConfigurationManager } from '../debug-configuration-manager';
import { DebugCommands } from '../debug-frontend-application-contribution';
import { DebugSessionManager } from '../debug-session-manager';
import { InternalDebugSessionOptions } from '../debug-session-options';
import { DebugAction } from './debug-action';
import { DebugConfigurationOptionsComponent } from './debug-configuration-options-component';
import { DebugViewModel } from './debug-view-model';

@injectable()
export class DebugConfigurationWidget extends ReactWidget {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(DebugViewModel)
    protected readonly viewModel: DebugViewModel;

    @inject(DebugConfigurationManager)
    protected readonly manager: DebugConfigurationManager;

    @inject(DebugSessionManager)
    protected readonly sessionManager: DebugSessionManager;

    @inject(DebugConsoleContribution)
    protected readonly debugConsole: DebugConsoleContribution;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected readonly onRefreshSelectOptionsEmitter = new Emitter<void>();
    get onRefreshSelectOptions(): Event<void> {
        return this.onRefreshSelectOptionsEmitter.event;
    }

    @postConstruct()
    protected init(): void {
        this.addClass('debug-toolbar');
        this.toDispose.push(this.manager.onDidChange(() => this.update()));
        this.toDispose.push(this.workspaceService.onWorkspaceChanged(() => this.update()));
        this.toDispose.push(this.workspaceService.onWorkspaceLocationChanged(() => this.update()));
        this.toDispose.push(this.onRefreshSelectOptionsEmitter);
        this.scrollOptions = undefined;
        this.update();
    }

    focus(): void {
        if (!this.doFocus()) {
            this.onRender.push(Disposable.create(() => this.doFocus()));
            this.update();
        }
    }
    protected doFocus(): boolean {
        if (!this.stepRef) {
            return false;
        }
        this.refreshSelectOptions();
        this.stepRef.focus();
        return true;
    }

    refreshSelectOptions = () => {
        this.onRefreshSelectOptionsEmitter.fire();
    };

    protected stepRef: DebugAction | undefined;
    protected setStepRef = (stepRef: DebugAction | null) => this.stepRef = stepRef || undefined;

    render(): React.ReactNode {
        return <React.Fragment>
            <DebugAction run={this.start} label='Start Debugging' iconClass='debug-start' ref={this.setStepRef} />
            <select className='theia-select debug-configuration' value={this.currentValue} onChange={this.setCurrentConfiguration}
                onFocus={this.refreshSelectOptions} onBlur={this.refreshSelectOptions}>
                <DebugConfigurationOptionsComponent
                    manager={this.manager}
                    parent={this}
                    isMultiRoot={this.workspaceService.isMultiRootWorkspaceOpened}
                />
            </select>
            <DebugAction run={this.openConfiguration} label='Open launch.json' iconClass='settings-gear' />
            <DebugAction run={this.openConsole} label='Debug Console' iconClass='terminal' />
        </React.Fragment>;
    }

    protected get currentValue(): string {
        const { current } = this.manager;
        return current ? InternalDebugSessionOptions.toValue(current) : '__NO_CONF__';
    }

    protected readonly setCurrentConfiguration = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.currentTarget.value;
        if (value === '__ADD_CONF__') {
            this.manager.addConfiguration();
        } else {
            const [name, workspaceFolderUri, type] = InternalDebugSessionOptions.parseValue(value);
            this.manager.current = this.manager.find(name, workspaceFolderUri, type);
        }
    };

    protected readonly start = () => {
        const configuration = this.manager.current;
        this.commandRegistry.executeCommand(DebugCommands.START.id, configuration);
    };

    protected readonly openConfiguration = () => this.manager.openConfiguration();
    protected readonly openConsole = () => this.debugConsole.openView({
        activate: true
    });

}
