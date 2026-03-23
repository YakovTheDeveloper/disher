# initSession — Flow Diagram

```mermaid
flowchart TD
    A([initSession]) --> B[fetchLocalCounts\nidbCount × 6 collections]
    B --> C{userToken\nin localStorage?}

    C -- yes --> D[setSyncStatus syncing\nstartSession userToken]
    D -- ok --> E([setSyncStatus synced ✓\nsyncComplete: true])
    D -- fail --> F([setSyncStatus offline ✗\nsyncComplete: false])

    C -- no --> G[fetchServerCounts\nGET /api/system/counts]

    G -- null / error --> H{isServerReachable?\nHEAD triplit server}
    H -- no + localData --> I([setSyncStatus synced\nuse cache, syncComplete: false])
    H -- no + empty --> J([setSyncStatus offline ✗])
    H -- yes --> K[doAnonSync attempt=1\nAPI down but Triplit up]

    G -- ok --> L{counts match?\nlocal === server\nfor each collection}
    L -- yes --> M([setSyncStatus synced\nsyncComplete: true ✓])
    L -- no --> N[doAnonSync attempt=1\nmismatch detected]

    K & N --> doAnonSync

    subgraph doAnonSync["doAnonSync(localCounts, serverCounts, attempt)"]
        direction TB
        DA{ANON_TOKEN\nexists?}
        DA -- no --> DB([setSyncStatus offline ✗])
        DA -- yes --> DC[setSyncStatus syncing\nstartSession ANON_TOKEN]
        DC -- fail --> DD([setSyncStatus offline ✗])
        DC -- ok --> DE[syncSystemCollections\nwaitForServerResponse × 6\n120s per collection independently]
        DE --> DF[endSession]
        DF --> DG[fetchLocalCounts again]
        DG --> DH{counts match\nserverCounts?}
        DH -- yes --> DI([setSyncStatus synced ✓\nsyncComplete: true])
        DH -- no + attempt < 3 --> DJ[delay 5s\ndoAnonSync attempt+1]
        DH -- no + attempt = 3 --> DK([setSyncStatus synced\nsyncComplete: false ⚠])
    end
```

## Collections tracked
`nutrients`, `foods`, `foodPortions`, `foodNutrients`, `dailyNorms`, `dailyNormItems`

## Timeouts
| | |
|---|---|
| Health check | 2 000 ms |
| Sync per collection | 120 000 ms (2 мин, независимо) |
| Server counts fetch | 5 000 ms |
| Retry delay | 5 000 ms |
| Max retry attempts | 3 |

## Session modes
| Mode | Stays connected? |
|---|---|
| `user` (JWT in localStorage) | yes — persistent session |
| `anon` | no — connect → sync → verify → disconnect (retry if needed) |

## Sync Progress states (per collection)
| State | Meaning |
|---|---|
| `pending` | Waiting to start |
| `syncing` | Subscription active, waiting for onRemoteFulfilled |
| `done` | onRemoteFulfilled received |
| `timeout` | 120s elapsed without onRemoteFulfilled |
