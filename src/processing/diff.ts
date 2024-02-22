import * as core from '@actions/core'
import * as markdownUtils from '../utils/markdown'

export function process(response: CDKResponse): CDKDiffResponse {
    core.error("DIFF - PROCESSING")
    return {
        stacks: processStacks(response.raw),
        ...response
    } as CDKDiffResponse;
}

export function processStacks(raw: string[]): CDKDiffStack[] {
    core.error("Processing Stacks")
    const stacks: CDKDiffStack[] = [];

    let current_stack_name: string | null = null;
    let current_stack: CDKDiffStack | null = null;

    let current_stack_section_name: string | null = null;
    let current_stack_section: CDKDiffStackSection | null = null;

    raw.forEach(line => {
        // Check if we reached the count of stacks with 
        core.error("Found End of File")
        let end_check = line.match(/^✨  Number of stacks with differences: (\d+)/)
        if(end_check) {
            // Save the previous stack if it exists
            if (current_stack) {
                // Save the previous section if it exists
                if (current_stack_section) {
                    current_stack.sections.push(current_stack_section);
                }
                stacks.push(current_stack);
            }
            current_stack_name = null;
            current_stack = null;
            current_stack_section = null;

            // TODO: Save the count of stacks with differences

            // Return because we are done
            return
        }

        // Check if the line matches the start of a new stack
        let stack_check = line.match(/^Stack (\w+)/);
        if (stack_check) {
            core.error("Found new stack: " + stack_check[1])
            // Save the previous stack if it exists
            if (current_stack) {
                stacks.push(current_stack);
            }
            // Get the new stack name
            current_stack_name = stack_check[1];
            // Create our new stack
            current_stack = {
                name: current_stack_name,
                raw: [],
                sections: []
            } as CDKDiffStack;
        }

        // Check if the line matches the start of a new section
        //let section_check = line.match(/^(IAM Statement Changes|IAM Policy Changes|Parameters|Resources|Conditions|Resources|Outputs|Other Changes)$/)
        let section_check = line.match(/^([^Stack]([\w ]+))$/)
        if (section_check) {
            core.error("Found new section: [" + current_stack?.name + "] " + section_check[1])
            // Save the previous section if it exists
            if (current_stack_section) {
                current_stack?.sections.push(current_stack_section);
            }
            // Get the new section name
            current_stack_section_name = section_check[1]
            // Create our new section
            current_stack_section = {
                name: current_stack_section_name,
                raw: []
            }
        }

        // Add the line to the current stack if it exists
        if (current_stack) {
            current_stack.raw.push(line);
        }
        if (current_stack_section) {
            current_stack_section.raw.push(line);
        }
    });

    return stacks;
}

export function markdown(response: CDKDiffResponse) {
    // Generate the markdown for each stack
    response.stacks?.forEach(stack => {
        // And each stacks section
        stack.sections.forEach(section => {
            // Check if the section name contains "IAM"
            if (section.name.toUpperCase().includes("IAM")) {
                // Add decorators and ensure its open by default
                section.markdown = markdownUtils.generateMarkdownDetail('🚨' + section.name + '🚨', section.raw, true)
            } else {
                // Otherwise don't do anything special
                section.markdown = markdownUtils.generateMarkdownDetail(section.name, section.raw)
            }
        })

        // For the actual stack
        stack.markdown = '## ' + stack.name + '\n\n'
        stack.markdown += markdownUtils.generateMarkdownDetail('Full Stack Output', stack.raw)
        // Append the markdown for each section in the stack
        stack.markdown += '\n**Sections:**\n'
        stack.sections.forEach(section => {
            stack.markdown += section.markdown + '\n'
        })
    });

    // Append the stacks markdown to the response markdown
    response.markdown += '\n\n'
    response.stacks?.forEach(stack => {
        response.markdown += stack.markdown + '\n\n'
    })

    return response
}