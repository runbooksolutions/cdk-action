/**
 * Core Response type will be a JSON Response Object.
 * Each key in the response will be mapped to its own output
 */
type JSONResponse = {
    [key: string]: any
}
/**
 * The default response because a command was run
 */
interface CDKResponse implements Response {
    command: string | null,
    raw: string[] = [],
    error: boolean = false,
    markdown?: string = '',
} 

    /**
     * Response type(s) for the 'diff' command
     */
    interface CDKDiffResponse extends CDKResponse {
        stacks: CDKDiffStack[] | undefined
    }

        interface CDKDiffStack extends JSONResponse {
            name: string;
            raw: string[];
            sections: CDKDiffStackSection[];
            markdown?: string;
        }

        interface CDKDiffStackSection extends JSONResponse{
            name: string;
            raw: string[];
            markdown?: string;
        }