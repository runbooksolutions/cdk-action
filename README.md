# CDK Action

This action only executes the `cdk` command and provides you output in a way you can programatically take action on.

When using this action you will need to have prior steps that:

1) Checkout your code
1) Setup your AWS Credentials
1) Install your dependencies

And steps after this actions to:

1) Create / Update an Issue or PR Comment
1) Fail the job if the `error` output is true

> [!IMPORTANT]  
> This action **WILL NOT** fail just because cdk returned non-zero.

## Inputs

| Name | Required | Description | Default | Valid |
| --- | --- | --- | --- | --- |
| `install_cdk` |  | If the action needs to install cdk or if it is already globally | `true` | `true`, `false` |
| `cdk_command` | Required | The CDK Command to run | `diff` | `diff` |
| `cdk_arguments` |  | The arguments to pass to CDK |  |  |
| `command_specific_output` |  | If the action should process the output based on the command | `false` | `true`, `false` |

## Outputs

| Name | `command_specifc_output` | `cdk_command` | Description | Type |
| --- | --- | --- | --- | --- |
| command | `true`, `false` | any | The exact command that was run | string |
| raw | `true`, `false` | any | The exact output from the command having been run | string |
| error | `true`, `false` | any | If the command experenced an error when running | boolean |
| markdown | `true` | any | Process the raw output and generate markdown regarding the result. | string |
| stacks | `true` | `diff` | The stacks that were referenced in the output | array |

## Example usage

### Pull Request
```yaml
name: PR Automation

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  cdk-diff:
    name: "Run `cdk diff`"
    runs-on: ubuntu-latest
    steps:
      # Setup AWS Credentials
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_GITHUB_ROLE }}
          aws-region: 'us-east-1'

      # Checkout Source
      - name: Checkout Source
        uses: actions/checkout@v4

      # Setup Node (CDK)
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.x

      # Install Dependencies
      - name: Install Dependencies
        run: npm ci

      # Use the action
      - name: Preform a CDK Diff
        id: cdk # ID to reference for outputs
        uses: runbooksolutions/cdk-action@main
        with:
          install_cdk: true
          cdk_command: 'diff'
          cdk_arguments:
            --app
            --fail=true # Fail on difference (2nd argument example)

      # Post the generated markdown to the PR
      - name: Post PR Comment
        uses: mshick/add-pr-comment@v2
        with:
          message: ${{ steps.cdk.outputs.markdown }}

      # Fail the job if we got an error
      - name: Fail the Build
        if: ${{ steps.cdk.outputs.error || steps.cdk.outputs.error == 'true' }}
        uses: cutenode/action-always-fail@v1.0.0
```

### Push to Branch
```yaml
name: PR Automation

on:
  push:
    branches:
      - main

jobs:
  deploy-infrastructure:
    name: "Run `cdk deploy`"
    runs-on: ubuntu-latest
    steps:
      # Setup AWS Credentials
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_GITHUB_ROLE }}
          aws-region: 'us-east-1'

      # Checkout Source
      - name: Checkout Source
        uses: actions/checkout@v4

      # Setup Node (CDK)
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.x

      # Install Dependencies
      - name: Install Dependencies
        run: npm ci

      # Deploy
      - name: Preform a CDK Deploy
        id: cdk
        uses: runbooksolutions/cdk-action@main
        with:
          install_cdk: true
          cdk_command: 'deploy'
          cdk_arguments:
            --app

      # Open an issue if we failed
      - uses: actions/github-script@v7
        if: ${{ steps.cdk.outputs.error || steps.cdk.outputs.error == 'true' }}
        with:
          script: |
            github.rest.issues.create({
              owner: ${{ github.repository_owner }},
              repo: ${{ github.repository }},
              body: ${{ steps.diff.outputs.markdown }}
            })

      # Fail the job if we got an error
      - name: Fail the Build
        if: ${{ steps.cdk.outputs.error || steps.cdk.outputs.error == 'true' }}
        uses: cutenode/action-always-fail@v1.0.0
```