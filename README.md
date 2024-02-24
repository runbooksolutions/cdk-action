# CDK Action

Interact with the [AWS Cloud Development Kit](https://aws.amazon.com/cdk/) within your Github CI/CD workflow.

## Overview

This action allows you to preform `cdk` commands and recieve formatted output that allow you to enchance your CI/CD workflow logically.

**Driving Factor:**
The driving factor for the creation of this action was the desire to recieve output from the `cdk` command within my workflow without failing the workflow.
While there are other actions available that may provide better markdown formatted comments; they tend to target a specific part of the CI/CD workflow and can't be used for other parts of the CI/CD workflow.

I.E. This action can be used on any trigger, and you can define how the output is handled.

> [!IMPORTANT]  
> This action **WILL NOT** fail just because cdk returned non-zero.
> To check if cdk returned non-zero check `steps.id.outputs.error == 'true'`

When using this action you will need to have prior steps that:

1) Checkout your code
1) Setup your AWS Credentials
1) Install your dependencies

And steps after this actions to:

1) Create / Update an Issue or PR Comment
1) Fail the job if the `error` output is true


## Inputs

| Name | Required | Description | Default | Valid |
| --- | --- | --- | --- | --- |
| `install_cdk` |  | If the action needs to install cdk or if it is already globally | `true` | `true`, `false` |
| `cdk_command` | ✔ | The CDK Command to run | `diff` | `diff`, `deploy`, `destroy`, `synthesize` |
| `cdk_arguments` |  | The arguments to pass to CDK |  |  |
| `command_specific_output` |  | If the action should process the output based on the command | `false` | `true`, `false` |

## Outputs

### Root Outputs

These outputs will always be available regardless of what command is run, and regardless of `command_specific_output` value.

| Name | Description |
| --- | --- |
| command | The exact command that was run |
| raw | The exact output from the command having been run |
| error | If the command experenced an error when running |
| markdown | Process the raw output and generate markdown regarding the result. |

### `command_specific_output` Outputs

#### `diff` Command

The following additional outputs will be made available 
| Name | Description |
| --- | --- |
| stacks | The stacks that were referenced in the output |

## Example usage

```yml
    # Previous steps:
    #   - Checkout Source Code
    #   - Setup AWS Credentials
    #   - Installs any Repository/Package Dependencies

    - id: cdk-action
      uses: runbooksolutions/cdk-action@v1
      with:
        install_cdk: true
        cdk_command: synthesize
        cdk_arguments:
          --json
          # --proxy=my_proxy
          # --proxy my_proxy
          # --proxy
          # my_proxy
        command_specific_output: true
    
    # Process Results
    - if: ${{ steps.cdk-action.outputs.error == 'true' }}
      run: echo "CDK Action Failed"; exit 1;
```

### Diff + PR Comment + Fail on error

```yml
    - name: Run CDK Diff
      id: diff
      uses: runbooksolutions/cdk-action@v1
      with:
        install_cdk: true
        cdk_command: diff
        command_specific_output: true

    - name: Post CDK Diff Comment to PR
      uses: mshick/add-pr-comment@v2
      with:
        message-id: 'cdk-diff-results'
        message: ${{ fromJson(steps.diff.outputs.markdown) }}
    
    - name: Fail the Workflow
      if: ${{ steps.diff.outputs.error == 'true' }}
      run: echo "CDK Action Failed"; exit 1;
```

### Deploy + (Create Issue + Fail) on error

```yml
    - name: CDK Deploy
      id: deploy
      uses: runbooksolutions/cdk-action@v1
      with:
        install_cdk: true
        cdk_command: deploy
        cdk_arguments:
          --all
          --require-approval never

    - name: Create Issue for Deployment Failure
      if: ${{ steps.deploy.outputs.error == 'true' }}
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.issues.create({
            owner: '${{ github.repository_owner }}',
            repo: '${{ github.repository }}'.split('/')[1],
            title: '🚨 CDK Deploy Failed 🚨',
            body: ${{ steps.deploy.outputs.markdown }}
          })

    - name: Fail the Workflow
      if: ${{ steps.diff.outputs.error == 'true' }}
      run: echo "CDK Action Failed"; exit 1;
```