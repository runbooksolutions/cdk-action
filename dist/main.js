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
        }
        catch (error) {
            // Fail the workflow run if an error occurs
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
exports.run = run;
