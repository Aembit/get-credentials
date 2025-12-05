# Contributing

We are not currently accepting external contributions. You are welcome to create issues reporting bugs or
making feature requests.

## Development

Before pushing (and ideally before committing), make sure to run
* `$ yarn check` to find linting and formatting issues. `$ yarn check:write` will auto-fix as many issues as it can.
* `$ yarn test:coverage` to check your test coverage. CI will fail, if it is below 90%.

### Before merging a PR

Your final commit should always come after running `$ yarn build` to get an up-to-date final version of the action code.

### Testing

While developing, running `$ yarn test` will start a watcher on the unit tests.

The tests rely on generated mocks in the `__test__/gen` directory. These are generated from
`__test__/resources/edge-api.yaml`. If you update that file when the API is updated, you must run `$ yarn test:generate`.
