import { defineConfig } from '@kubb/core'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './__test__/resources/edge-api.yaml',
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
        // seed ensures same generated mock values each time
        seed: [100]
      },
    }),
    pluginMsw({
      output: {
        path: './handlers.ts',
      },
      // since we are interpolating a URL, this must be set or tests expect to hit localhost and fail
      baseURL: 'https://a12345.ec.aembit.io',
      parser: 'faker'
    }),
  ],
})