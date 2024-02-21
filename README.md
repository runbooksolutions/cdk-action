# CDK Action

This action invokes the cdk command on your application and provides outputs based on the command you ran.

## Inputs

| Name | Required | Description | Default | Valid |
| --- | --- | --- | --- | --- |
| `install_cdk` |  | If the action needs to install cdk or if it is already globally | `true` | `true`, `false` |
| `cdk_command` | Required | The CDK Command to run | `diff` | `diff` |
| `cdk_arguments` |  | The arguments to pass to CDK |  |  |

## Outputs

### `time`

The time we greeted you.

## Example usage

```yaml
uses: runbooksolutions/cdk-action@main
with:
  install_cdk: true
  cdk_command: 'diff'
  cdk_arguments:
    --app
    --build=""
```
