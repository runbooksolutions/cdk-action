export function generateMarkdownDetail(title: string, content: string[], opened: boolean = false): string {
    let markdown = '<details>\n';
    markdown += '<summary>' + title + '</summary>\n\n';
    markdown += '```dif\n';
    markdown += content.join('\n').trimEnd().trimStart();
    markdown += '\n```\n'
    markdown += '\n\n</details>';

    return markdown
}