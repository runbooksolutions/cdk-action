import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { CDK_COMMAND, getInputs } from './utils/input'
import * as markdown from './utils/markdown'
import * as responseUtils from './utils/response'

// Diffs
import * as diff from './processing/diff'



/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
    try {
        // Get our Input
        const action_inputs = getInputs()

        // Install CDK if required
        if (action_inputs.install_cdk) {
            core.debug("Install CDK")
            await exec.exec('npm', ['install', '-g', 'aws-cdk'])
        }

        // Prepare the response
        let response: CDKResponse = {
            command: 'cdk ' + action_inputs.cdk_command + ' ' + action_inputs.cdk_arguments.join(' '),
            error: false,
            raw: []
        }

        // Run the CDK command
        try {
            // Debug Statement
            core.debug("Running CDK Command: " + action_inputs.cdk_command + " " + action_inputs.cdk_arguments.join(' '))
            // Setup the stdout and stderr listeners
            const options = {
                listeners: {
                    stdout: (data: Buffer) => { response.raw.push(data.toString()) },
                    stderr: (data: Buffer) => { response.raw.push(data.toString()) },
                }
            }
            // Now we can actually run the cdk command
            await exec.exec('cdk', [action_inputs.cdk_command, ...action_inputs.cdk_arguments], options)
        } catch (error) {
            // We encountered an error, lets handle it.
            core.debug("CDK Command Failed")
            core.debug(response.raw.join('\n'))
            response.error = true
        }

        // Generate the initial command markdown
        response.markdown = '# '
        // emoji for status
        if (response.error)
            response.markdown += '❌ '
        else
            response.markdown += '✅ '
        response.markdown += 'CDK Action Results\n\n'
        response.markdown += '**Command:** ' + response.command + '\n\n'
        response.markdown += '**Results:**\n\n'
        response.markdown += markdown.generateMarkdownDetail('Full Command Results', response.raw)
        response.markdown += '\n\n'

        // Preform command specific processing
        if (action_inputs.command_specific_processing) {
            switch(action_inputs.cdk_command) {
                case CDK_COMMAND.diff:
                    response = diff.process(response)
                    response = diff.markdown(response as CDKDiffResponse)
                    break
                case CDK_COMMAND.deploy:
                    //response = processDeployResponse(response)
                    break
            }
        }

        // Turn any string arrays into concated strings
        response = responseUtils.jsonResponseStringArrayConcat(response) as CDKResponse

        // map each key of response to an output and stringify the value
        Object.keys(response).forEach(key => {
            core.setOutput(key, JSON.stringify((response as JSONResponse)[key]))
        })

    } catch (error) {
        // Fail the workflow run if an error occurs we don't already catch
        if (error instanceof Error) 
            core.setFailed(error.message)
    }
}

// Run our Actions
run()