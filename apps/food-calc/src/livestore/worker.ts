import { makeWorker } from '@livestore/adapter-web/worker'
import { makeCfSync } from '@livestore/sync-cf'
import { schema } from './schema.js'

const syncUrl = import.meta.env.VITE_LIVESTORE_SYNC_URL as string | undefined

makeWorker({
  schema,
  ...(syncUrl
    ? {
        sync: {
          backend: makeCfSync({ url: syncUrl }),
        },
      }
    : {}),
})
