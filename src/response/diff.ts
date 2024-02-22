import * as core from '@actions/core'

export function process_diff_log(response: CDKDiffResponse): CDKDiffResponse {
    const stacks: StackDiff[] = [];

    let current_stack_name: string | null = null;
    let current_stack: StackDiff | null = null;

    let current_section: string | null = null;

    const non_markdown_keys = [
        'raw',
        'stack_name',
        'markdown'
    ];

    // Iterate though each line in the raw log
    response.raw.split("\n").forEach(line => {
        const end_check = line.match(/^✨  Number of stacks with differences:/)
        if (end_check) {
            core.debug(`Found end of diff log`)
            if (current_stack) {
                stacks.push(current_stack)
            }
            current_stack_name = null
            current_stack = null
            return
        }
        // Check if the line matches a Stack Regex expressions
        const stack_check = line.match(/^Stack (\w+)/)
        // If the line matches a stack regex expression; we are in a new stack
        if (stack_check) {
            // Save the previous stack if it exists
            if (current_stack) {
                stacks.push(current_stack)
            }
            // Get the new stack name
            current_stack_name = stack_check[1]
            // Create our new stack
            current_stack = {
                stack_name: current_stack_name,
                raw: ''
            }
            // reset the current section
            current_section = null;
        }
        console.debug(`Processing Line: ${line}`)
        if (!current_stack_name) return
        core.debug(`Found stack: ${current_stack_name}`)


        // If the current stack exists; add the line to the stack
        if (current_stack) {
            current_stack.raw += line + "\n"
        }

        if (!current_stack) return;

        // Check if the line matches a section regex expression
        //const section_check = line.match(/^(IAM Statement Changes|IAM Policy Changes|Parameters|Resources|Conditions|Resources|Outputs|Other Changes)$/)
        const section_check = line.match(/^([^Stack]([\w ]+))$/)
        if (section_check) {
            // If we have identified we are entering a new section;
            current_section = section_check[1].toLowerCase().replace(/ /g, '_')
            core.debug(`Found section: ${current_section}`)
            current_stack[current_section] = {
                name: section_check[1],
                raw: ''
            } as StackDiffSection
        }
        if (current_stack && current_section) {
            (current_stack[current_section] as StackDiffSection).raw += line + "\n"
        }
    });

    // Save the last stack
    if (current_stack) {
        stacks.push(current_stack)
    }

    // Add a Markdown element for each stack
    stacks.forEach(stack => {
        stack.markdown = '## Stack: ' + stack.stack_name + '\n\n'
        stack.markdown += '<details>\n<summary>View Stack Diff</summary>\n\n```diff\n'
        stack.markdown += stack.raw.trimEnd()
        stack.markdown +='\n```\n\n</details>\n\n'

        // Add a markdown element for each section in the stack
        for (const key in stack) {
            if (non_markdown_keys.includes(key)) continue;
            const diff_section = (stack[key] as StackDiffSection);

            diff_section.markdown = '<details>\n<summary>'
            
            // IAM sections get police lights...
            if (diff_section.name.toLowerCase().includes('iam')) {
                diff_section.markdown += '🚨' + diff_section.name + '🚨'
            } else {
                diff_section.markdown += diff_section.name
            }
            
            diff_section.markdown += '</summary>\n\n```diff\n'
            diff_section.markdown += diff_section.raw.trimEnd()
            diff_section.markdown += '\n```\n\n</details>'
        }
    })

    // Save the stacks to the response
    response.stacks = stacks;

    // Add a markdown element for the diff summary
    // Action Title
    response.markdown = '# '
    // Emoji for success/failure
    if (response.error) {
        response.markdown += '❌ '
    } else {
        response.markdown += '✅ '
    }
    response.markdown += 'CDK Action\n\n'
    // What Command Was Run
    response.markdown += '**Command:** ' + response.command + '\n\n'
    // Full Command Output
    response.markdown += '<details>\n'
    response.markdown += '<summary>Full Command Output</summary>\n\n'
    response.markdown += '```diff\n'
    response.markdown += response.raw.trimEnd()
    response.markdown += '\n```\n\n'
    response.markdown += '</details>\n\n'

    // Add a markdown element for each stack
    stacks.forEach(stack => {
        response.markdown += '## Stack: '
        response.markdown += stack.stack_name + '\n\n'
        response.markdown += stack.markdown + '\n\n'
        // Add a markdown element for each section in the stack
        response.markdown += '**Sections:**\n'
        for (const key in stack) {
            if (non_markdown_keys.includes(key)) continue;
            response.markdown += stack[key].markdown + '\n\n'
        }
    })

    // Return the response
    return response;
}