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
Object.defineProperty(exports, "__esModule", { value: true });
exports.process_diff_log = void 0;
const core = __importStar(require("@actions/core"));
function process_diff_log(response) {
    const stacks = [];
    let current_stack_name = null;
    let current_stack = null;
    let current_section = null;
    // Iterate though each line in the raw log
    response.raw.split("\n").forEach(line => {
        const end_check = line.match(/^✨  Number of stacks with differences:/);
        if (end_check) {
            core.debug(`Found end of diff log`);
            if (current_stack) {
                stacks.push(current_stack);
            }
            current_stack_name = null;
            current_stack = null;
            return;
        }
        // Check if the line matches a Stack Regex expressions
        const stack_check = line.match(/^Stack (\w+)/);
        // If the line matches a stack regex expression; we are in a new stack
        if (stack_check) {
            // Save the previous stack if it exists
            if (current_stack) {
                stacks.push(current_stack);
            }
            // Get the new stack name
            current_stack_name = stack_check[1];
            // Create our new stack
            current_stack = {
                stack_name: current_stack_name,
                raw: ''
            };
            // reset the current section
            current_section = null;
        }
        console.debug(`Processing Line: ${line}`);
        if (!current_stack_name)
            return;
        core.debug(`Found stack: ${current_stack_name}`);
        // If the current stack exists; add the line to the stack
        if (current_stack) {
            current_stack.raw += line + "\n";
        }
        if (!current_stack)
            return;
        // Check if the line matches a section regex expression
        //const section_check = line.match(/^(IAM Statement Changes|IAM Policy Changes|Parameters|Resources|Conditions|Resources|Outputs|Other Changes)$/)
        const section_check = line.match(/^([^Stack]([\w ]+))$/);
        if (section_check) {
            // If we have identified we are entering a new section;
            current_section = section_check[1].toLowerCase().replace(/ /g, '_');
            core.debug(`Found section: ${current_section}`);
            current_stack[current_section] = {
                name: section_check[1],
                raw: []
            };
        }
        if (current_stack && current_section) {
            current_stack[current_section].raw.push(line);
        }
    });
    // Save the last stack
    if (current_stack) {
        stacks.push(current_stack);
    }
    // Save the stacks to the response
    response.stacks = stacks;
    // Return the response
    return response;
}
exports.process_diff_log = process_diff_log;
