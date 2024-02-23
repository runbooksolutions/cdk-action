import * as core from '@actions/core'
import { getInputs } from '../src/utils/input'



// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let getBooleanInputMock: jest.SpiedFunction<typeof core.getBooleanInput>
let getMultilineInput: jest.SpiedFunction<typeof core.getMultilineInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>


describe('get_inputs', () => {
    beforeEach(() => {
      jest.clearAllMocks()
  
      debugMock = jest.spyOn(core, 'debug').mockImplementation()
      errorMock = jest.spyOn(core, 'error').mockImplementation()
      getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
      getBooleanInputMock = jest.spyOn(core, 'getBooleanInput').mockImplementation()
      getMultilineInput = jest.spyOn(core, 'getMultilineInput').mockImplementation().mockReturnValue([])
      setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
      setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    })

    test('install_cdk defaults to true', () => {
        const inputs = getInputs()

        expect(inputs.install_cdk).toBe(true)
    });

    test('install_cdk accepts user input', () => {
        // False
        getBooleanInputMock.mockReturnValue(false)

        const inputs = getInputs()

        expect(inputs.install_cdk).toBe(false)
        expect(getBooleanInputMock).toHaveBeenCalledWith('install_cdk')        
    });

    test('command_specific_output defaults to false', () => {
        const inputs = getInputs()

        expect(inputs.command_specific_output).toBe(false)
    })

    test('command_specific_output accepts user input', () => {
        getBooleanInputMock.mockReturnValue(true)
        const inputs = getInputs()

        expect(inputs.command_specific_output).toBe(true)
    })

    test('throws an error on invalid command', () => {
        // Prep Mocs
        getInputMock.mockReturnValue('invalid_command')

        // Expects
        expect(() => { getInputs() }).toThrow('Invalid cdk_command: invalid_command')
    })

    test('throws an error on arguments not matching regex `/^[A-Za-z0-9_-]+$/`', () => {
        // Prep Mocs
        getInputMock.mockReturnValue('diff')
        getMultilineInput.mockReturnValue([
            '--no-color&',
        ])
        // Expects
        expect(() => { getInputs() }).toThrow('Invalid cdk_arguments: --no-color&')
        // Prep Mocs
        getMultilineInput.mockReturnValue([
            '--no-color;',
        ])
        // Expects
        expect(() => { getInputs() }).toThrow('Invalid cdk_arguments: --no-color;')
    });

    test('does not throw an error on valid arguments', () => {
        getInputMock.mockReturnValue('diff')
        getMultilineInput.mockReturnValue([
            '--no-color',
            '--require-approval never',
            '--require-approval=never'
        ])

        expect(() => { getInputs() }).not.toThrow()
    })

    test('logs inputs it processed', () => {
        getInputMock.mockReturnValue('diff')

        getInputs()

        expect(debugMock).toHaveBeenCalledTimes(1)
        const expected_debug_message = {
            install_cdk: true,
            cdk_command: 'diff',
            cdk_arguments: [],
            command_specific_output: false
        }
        expect(debugMock).toHaveBeenCalledWith(`Inputs: ${JSON.stringify(expected_debug_message)}`)
    })

    test('returns inputs', () => {
        getInputMock.mockReturnValue('diff')

        const inputs = getInputs()

        expect(inputs).toEqual({
            install_cdk: true,
            cdk_command: 'diff',
            cdk_arguments: [],
            command_specific_output: false
        })
    })
})