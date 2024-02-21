"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const diff_1 = require("./response/diff");
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const user_cdk_command = core.getInput('cdk_command');
            if (!valid_commands.includes(user_cdk_command)) {
                throw new Error(`Non-Supported CDK command: ${user_cdk_command}`);
            }
            // Prep our response:
            let cdk_response = {
                command: null,
                raw: '',
                error: false
            };
            const install_cdk = core.getBooleanInput('install_cdk');
            if (install_cdk) {
                core.debug("Install CDK");
                yield exec.exec('npm', ['install', '-g', 'aws-cdk']);
            }
            // Try running the CDK command
            const cdk_out = [];
            try {
                const cdk_arguments = core.getInput('cdk_arguments').split(" ");
                core.debug("Running CDK Command: " + user_cdk_command + " " + cdk_arguments.join(' '));
                cdk_response.command = user_cdk_command + " " + cdk_arguments.join(' ');
                // Capture stdOut and stdErr
                const options = {
                    listeners: {
                        stdout: (data) => {
                            cdk_out.push(data.toString());
                        },
                        stderr: (data) => {
                            cdk_out.push(data.toString());
                        }
                    },
                };
                // Run the CDK command
                yield exec.exec('cdk', [user_cdk_command, ...cdk_arguments], options);
            }
            catch (error) {
                core.debug("CDK Command Failed\n===\n===");
                core.debug(cdk_out.join("\\n").trimEnd());
                cdk_response.error = true;
                cdk_response.raw = cdk_out.join("\n").trimEnd();
                core.setOutput("key", "value");
                throw new Error('CDK Failed with an Error');
            }
            // Set the Response
            cdk_response.raw = cdk_out.join("\n").trimEnd();
            // Command Completed; Process the results.
            switch (user_cdk_command) {
                case 'diff':
                    cdk_response = (0, diff_1.process_diff_log)(cdk_response);
                    //core.setOutput("stacks", JSON.stringify((cdk_response as CDKDiffResponse).stacks))
                    break;
                default:
                    throw new Error(`Unsupported CDK Command: ${user_cdk_command}`);
                    break;
            }
            // Iterate though each key of the cdk_response and set the output
            Object.entries(cdk_response).forEach(([key, value]) => {
                core.setOutput(key, JSON.stringify(value));
            });
            // const log = fs.readFileSync("logs/2.log")
            // const log_lines = log.toString().split("\n")
            // // core.debug(log_lines.join("\n"))
            // let output_json: OutputJson = {
            //     result: log_lines
            // };
            //output_json=process_diff_log(output_json);
            // Iterate though evey item and subitem in OutputJson
            // and join any array string with a newline
            // ->> output_json=output_json_string_array_to_string(output_json)
            //output_json.result = ['']
            //core.info(JSON.stringify(output_json))
            // const ms: string = core.getInput('milliseconds')
            // // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
            // core.debug(`Waiting ${ms} milliseconds ...`)
            // // Log the current timestamp, wait, then log the new timestamp
            // core.debug(new Date().toTimeString())
            // //await wait(parseInt(ms, 10))
            // core.debug(new Date().toTimeString())
            // // Set outputs for other workflow steps to use
            // core.setOutput('time', new Date().toTimeString())
        }
        catch (error) {
            // Fail the workflow run if an error occurs
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
exports.run = run;
// type OutputJson = {
//     [key: string]: undefined | string | string[] | StackJson
//     result: Array<string> | undefined,
// }
// // A function to iterate though the OutputJson and ensure all string[] values are turned into a string by joining them with a new line
// // This function needs to be recursive because the OutputJson can contain nested arrays
// function output_json_string_array_to_string(input_json: {[key: string]: any} | OutputJson): OutputJson {
//     Object.entries(input_json).forEach(([key, value]) => {
//         if (Array.isArray(value)) {
//             input_json[key] = value.join("\n").trimEnd()
//         } else if (typeof value === 'object' && value !== null) {
//             input_json[key] = output_json_string_array_to_string(input_json[key])
//         }
//     })
//     return input_json as OutputJson
// }
// type StackJson = {
//     name: string | null,
//     log: string[],
//     sections: {
//         [key: string]: string[],
//     }
// }
// function process_diff_log(input_json: OutputJson): OutputJson {
//     let stack_json: StackJson = {
//         name: null,
//         log: [],
//         sections: {}
//     }
//     let stack_section: string | null = null
//     let output_json = {...input_json};
//     // Iterate though each of the lines
//     output_json.result?.forEach(line => {
//         // Check if the line matches a Stack Regex expressions
//         const stack_check = line.match(/Stack\s+(.*)|^✨$/)
//         // If the line matches a stack regex expression; we are in a new stack
//         if (stack_check) {
//             // If stack_json.name isn't null; we were already in a stack and need to add it
//             // to the output_json
//             if (stack_json.name) {
//                 output_json[stack_json.name] = stack_json;
//             }
//             stack_json = {
//                 name: stack_check[1],
//                 log: [],
//                 sections: {}
//             }
//         }
//         // If the stack_json.name is not null; we are in a stack and need to add the line to the stack
//         if (stack_json.name) {
//             //stack_json.log.push(line)
//         }
//         // Now we need to check if the line matches a condition regex expression
//         // that will specify which section of the stack result we are in
//         const subsection_check = line.match(/^(IAM Statement Changes|Parameters|Conditions|Resources|Outputs|Other Changes|✨)/)
//         if (subsection_check) {
//             // If the check passes we are entering a new subsection of the stack log
//             // We need to take the resulting line; change it to lower case and replace spaces with underscores
//             // and add it to the stack_section variable
//             if (subsection_check[1].toLowerCase()[0] != '✨') {
//                 stack_section = subsection_check[1].toLowerCase()[0] + subsection_check[1].toLowerCase().slice(1).replace(/\s+/g, '_')
//                 stack_json.sections[stack_section] = []
//             } else {
//                 stack_section = null
//             }
//         }
//         // If the stack_section is not null; we are in a section and need to add the line to the section
//         if (stack_section && !subsection_check) {
//             stack_json.sections[stack_section].push(line)
//         }
//     })
//     // Add the last stack to the output_json
//     if (stack_json.name) {
//         output_json[stack_json.name] = stack_json;
//     }
//     return output_json
// }
