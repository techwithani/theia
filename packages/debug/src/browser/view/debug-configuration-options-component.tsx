/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
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

import URI from '@theia/core/lib/common/uri';
import * as React from '@theia/core/shared/react';
import { DebugConfigurationManager } from '../debug-configuration-manager';
import { DebugSessionOptions, InternalDebugSessionOptions } from '../debug-session-options';
import { DebugConfigurationWidget } from './debug-configuration-widget';

export interface ConfigurationOptionsResolverProps {
    manager: DebugConfigurationManager,
    parent: DebugConfigurationWidget,
    isMultiRoot: boolean
}

export class DebugConfigurationOptionsComponent extends React.Component<ConfigurationOptionsResolverProps, { configurationOptions: React.ReactNode[] }> {
    private static readonly SEPARATOR = '──────────';
    private configurationOptions: React.ReactNode[] = [];

    constructor(props: ConfigurationOptionsResolverProps) {
        super(props);
        this.state = {
            configurationOptions: this.configurationOptions
        };
    }

    componentDidMount(): void {
        this.resolveConfigurationOptions();
        this.props.parent.onRefreshSelectOptions(() => {
            this.resolveConfigurationOptions();
        });
    }

    protected resolveConfigurationOptions = async () => {
        // Add stored configurations
        const storedConfigs = Array.from(this.props.manager.all);
        let index = 0;
        let configurationOptions: React.ReactNode[] =
            storedConfigs.map(options => <option key={index++} value={InternalDebugSessionOptions.toValue(options)}>
                {this.toName(options, this.props.isMultiRoot)}</option>);

        // Add Dynamic configurations
        ({ configurationOptions, index } = await this.resolveDynamicConfigurations(configurationOptions, index));

        // If No configurations
        if (configurationOptions.length === 0) {
            configurationOptions.push(<option key={index++} value='__NO_CONF__'>No Configurations</option>);
        }

        // Add the option to open the configurations file to manually add a configuration
        configurationOptions.push(<option key={index++} disabled>{DebugConfigurationOptionsComponent.SEPARATOR}</option>);
        configurationOptions.push(<option key={index++} value='__ADD_CONF__'>Add Configuration...</option>);

        this.setState({ configurationOptions });
    };

    protected toName({ configuration, workspaceFolderUri }: DebugSessionOptions, multiRoot: boolean): string {
        if (!workspaceFolderUri || !multiRoot) {
            return configuration.name;
        }
        return configuration.name + ' (' + new URI(workspaceFolderUri).path.base + ')';
    }

    private async resolveDynamicConfigurations(configurationOptions: React.ReactNode[], index: number):
        Promise<{ configurationOptions: React.ReactNode[], index: number }> {

        const configsPerType = await this.props.manager.provideDynamicDebugConfigurations();
        configsPerType.map(confPerType => {
            const configurations = confPerType.configurations;
            if (configurations && configurations.length > 0) {
                configurationOptions.push(
                    <option key={index++} disabled>{DebugConfigurationOptionsComponent.SEPARATOR + ' '}{confPerType.type}{' (provided)'}</option>
                );
                configurationOptions = configurationOptions.concat(configurations.map(configuration => <option key={index++}
                    value={InternalDebugSessionOptions.toValue({ configuration })}>{configuration.name}</option>
                ));
            }
        });
        return { configurationOptions, index };
    }

    render(): React.ReactNode[] {
        return (this.state.configurationOptions);
    }
}
