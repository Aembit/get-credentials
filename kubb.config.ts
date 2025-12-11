import { defineConfig } from '@kubb/core'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './resources/edge-api.yaml',
  },
  output: {
    path: './gen',
    extension: {
      extName: '.ts',
      addExtension: false
    }
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    // Generate API client for production use
    pluginClient({
      output: {
        path: './client',
      },
      importPath: '@kubb/plugin-client/clients/fetch',
      dataReturnType: 'full'
    }),
    // Generate test mocks
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