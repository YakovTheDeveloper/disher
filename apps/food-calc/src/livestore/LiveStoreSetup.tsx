import { type ReactNode, useEffect } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { LiveStoreProvider, useStore } from '@livestore/react'
import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { queryDb } from '@livestore/livestore'
import { schema, tables } from './schema'

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

function DebugExpose() {
  const { store } = useStore()

  useEffect(() => {
    if (!store) return
    ;(window as any).__debugLiveStore = {
      dump: () => {
        const data = {
          products: store.query(queryDb(tables.products.where({}))),
          dishes: store.query(queryDb(tables.dishes.where({}))),
          dishItems: store.query(queryDb(tables.dishItems.where({}))),
          dishPortions: store.query(queryDb(tables.dishPortions.where({}))),
          scheduleFoods: store.query(queryDb(tables.scheduleFoods.where({}))),
          scheduleEvents: store.query(queryDb(tables.scheduleEvents.where({}))),
          dailyNorms: store.query(queryDb(tables.dailyNorms.where({}))),
          periods: store.query(queryDb(tables.periods.where({}))),
        }
        console.group('🔍 LiveStore Dump')
        Object.entries(data).forEach(([name, values]) => {
          console.group(`📋 ${name} (${(values as unknown[]).length})`)
          console.table(values)
          console.groupEnd()
        })
        console.groupEnd()
        return data
      },
      resetDatabase: async () => {
        console.log('🗑️ Deleting all IndexedDB databases...')
        if ('databases' in indexedDB) {
          const databases = await indexedDB.databases()
          await Promise.all(
            databases
              .filter((db): db is IDBDatabaseInfo & { name: string } => !!db.name)
              .map((db) =>
                new Promise<void>((resolve) => {
                  const req = indexedDB.deleteDatabase(db.name)
                  req.onsuccess = () => { console.log(`  Deleted: ${db.name}`); resolve() }
                  req.onerror = () => { console.warn(`  Failed: ${db.name}`); resolve() }
                  req.onblocked = () => { console.warn(`  Blocked: ${db.name}`); resolve() }
                }),
              ),
          )
        }
        localStorage.clear()
        sessionStorage.clear()
        console.log('✅ Done. Reloading...')
        window.location.replace('/')
      }
    }
  }, [store])

  return null
}

export function LiveStoreSetup({ children, storeId }: LiveStoreSetupProps) {
  return (
    <LiveStoreProvider
      schema={schema}
      storeId={storeId}
      adapter={adapter}
      batchUpdates={batchUpdates}
      renderLoading={() => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: 'system-ui, sans-serif' }}>
          <p style={{ fontSize: 16, color: '#888' }}>Загрузка...</p>
        </div>
      )}
      renderError={(error) => {
        console.error('LiveStore error:', error)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: '0 32px', fontFamily: 'system-ui, sans-serif', gap: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Ошибка инициализации</p>
            <p style={{ fontSize: 14, color: '#e53e3e', margin: 0, textAlign: 'center', wordBreak: 'break-word' }}>
              {error instanceof Error ? error.message : String(error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '8px 24px', fontSize: 14, border: '1px solid #ccc', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
            >
              Перезагрузить
            </button>
          </div>
        )
      }}
    >
      <DebugExpose />
      {children}
    </LiveStoreProvider>
  )
}
