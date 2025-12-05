import { defineConfig } from '@kubb/core'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './__test__/edge-api.yaml',
  },
  output: {
    path: './__test__/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginFaker({
      output: {
        path: './mocks.ts',
        seed: [100]
      },
    }),
    pluginMsw({
      output: {
        path: './handlers.ts',
      },
      baseURL: 'https://a12345.ec.aembit.io',
      parser: 'faker'
    }),
  ],
})