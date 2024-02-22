type JSONResponse = {
    [key: string]: any
}

interface CDKResponse implements Response {
    command: string | null,
    raw: string = '',
    error: boolean = false,
    markdown?: string = '',
} 

interface CDKDiffResponse extends CDKResponse {
    stacks: StackDiff[] | undefined
}

interface StackDiff extends JSONResponse {
    stack_name: string;
    raw: string;
}

interface StackDiffSection extends JSONResponse{
    name: string;
    raw: string;
}