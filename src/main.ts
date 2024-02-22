import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import { process_diff_log } from './response/diff';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {

    // Valid AWS CDK commands that are supported
    const valid_commands = [
        // 'list',
        // 'synthesize',
        // 'deploy',
        'diff',
        // 'destroy',
        // 'doctor',
    ];

    // Get the CDK command from the user input and validate it.  If it is not valid, throw an error.
    const user_cdk_command = core.getInput('cdk_command')
    if (!valid_commands.includes(user_cdk_command)) {
        throw new Error(`Non-Supported CDK command: ${user_cdk_command}`)
    }

    // Prep our response:
    let cdk_response: CDKResponse = {
        command: null,
        raw: '',
        error: false
    }

    const install_cdk = core.getBooleanInput('install_cdk')
    if (install_cdk) {
        core.debug("Install CDK")
        await exec.exec('npm', ['install', '-g', 'aws-cdk'])
    }

    // Try running the CDK command
    const cdk_out: string[] = []
    try {
        const cdk_arguments: string[] = core.getInput('cdk_arguments').split(" ")
        core.debug("Running CDK Command: " + user_cdk_command + " " + cdk_arguments.join(' '))
        cdk_response.command = user_cdk_command + " " + cdk_arguments.join(' ');
        // Capture stdOut and stdErr
        const options = {
            listeners: {
                stdout: (data: Buffer) => {
                    cdk_out.push(data.toString())
                },
                stderr: (data: Buffer) => {
                    cdk_out.push(data.toString())
                }
            },
        }
        // Run the CDK command
        await exec.exec('cdk', [user_cdk_command, ...cdk_arguments], options)
    } catch (error) {
        core.debug("CDK Command Failed\n===\n===")
        core.debug(cdk_out.join("\\n").trimEnd())

        cdk_response.error = true;
        cdk_response.raw = cdk_out.join("\n").trimEnd();

        core.setOutput("key", "value")

        throw new Error('CDK Failed with an Error');
    }

    // Set the Response
    cdk_response.raw = cdk_out.join("\n").trimEnd();


    // Command Completed; Process the results.
    switch(user_cdk_command) {
        case 'diff':
            cdk_response=process_diff_log(cdk_response as CDKDiffResponse)
            //core.setOutput("stacks", JSON.stringify((cdk_response as CDKDiffResponse).stacks))
            break;
        default:
            throw new Error(`Unsupported CDK Command: ${user_cdk_command}`)
            break;
    }

    // Iterate though each key of the cdk_response and set the output
    Object.entries(cdk_response).forEach(([key, value]) => {
        core.setOutput(key, JSON.stringify(value))
    })

  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}