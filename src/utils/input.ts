import * as core from '@actions/core'

export enum CDK_COMMAND {
    diff = 'diff',
    deploy = 'deploy',
    destroy = 'destroy',
    synthesize = 'synthesize',
}
export type ActionInputs = {
    install_cdk: boolean,
    cdk_command: CDK_COMMAND,
    cdk_arguments: string[],
    command_specific_output: boolean,
}

export function getInputs(): ActionInputs {

    const install_cdk = core.getBooleanInput('install_cdk')

    const cdk_command = core.getInput('cdk_command', {
        required: true,
        trimWhitespace: true,
    }) || 'diff'

    const cdk_arguments = core.getMultilineInput('cdk_arguments', {
        required: false,
        trimWhitespace: true,
    })

    const command_specific_output = core.getBooleanInput('command_specific_output')

    // Check that cdk_command is valid
    if (!Object.values(CDK_COMMAND).includes(cdk_command as CDK_COMMAND)) {
        throw new Error(`Invalid cdk_command: ${cdk_command}`)
    }

    // Check that cdk_arguments don't include invalid characters.
    // A-Za-z0-9_-
    for (const arg of cdk_arguments) {
        if (!/^[A-Za-z0-9_-]+$/.test(arg)) {
            throw new Error(`Invalid cdk_arguments: ${arg}`)
        }
    }

    const inputs = {
        install_cdk: install_cdk === undefined ? true : install_cdk,
        cdk_command: cdk_command as CDK_COMMAND,
        cdk_arguments:  cdk_arguments,
        command_specific_output: command_specific_output === undefined ? false : command_specific_output,
    }

    core.debug(`Inputs: ${JSON.stringify(inputs)}`)

    return inputs
}