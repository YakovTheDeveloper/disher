import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'

export class WebSocketServer extends makeDurableObject() {}

export default makeWorker({
  validatePayload: (payload: any) => {
    // TODO: add real auth validation when ready
    // For now, accept all connections
  },
})
