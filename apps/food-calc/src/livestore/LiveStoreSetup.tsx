import { type ReactNode } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { LiveStoreProvider } from '@livestore/react'
import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { schema } from './schema'

const workerUrl = new URL('./worker.ts', import.meta.url)

interface LiveStoreSetupProps {
  children: ReactNode
  storeId: string
}

const adapter = makePersistedAdapter({
  worker: (options) => new Worker(workerUrl, { type: 'module', name: options.name }),
  sharedWorker: LiveStoreSharedWorker,
  storage: { type: 'opfs' },
})

export function LiveStoreSetup({ children, storeId }: LiveStoreSetupProps) {
  return (
    <LiveStoreProvider
      schema={schema}
      storeId={storeId}
      adapter={adapter}
      batchUpdates={batchUpdates}
      renderLoading={() => <></>}
      renderError={(error) => {
        console.error('LiveStore error:', error)
        return <></>
      }}
    >
      {children}
    </LiveStoreProvider>
  )
}
