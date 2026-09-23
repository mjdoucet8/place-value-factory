export type PendingGameCommand = {
  id: string;
  studentId: string;
  attemptId: string;
  orderId: string;
  kind: "response" | "hint";
  payload: {
    commandId: string;
    expectedRevision: number;
    leaseEpoch: number;
    tabId: string;
    [key: string]: unknown;
  };
  queuedAt: string;
};

const databaseName = "place-value-factory-outbox-v1";
const objectStoreName = "pending-commands";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Device storage is unavailable."));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(objectStoreName, { keyPath: "id" });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, done: (value: T) => void) => void,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = database.transaction(objectStoreName, mode);
      let result: T;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(tx.error ?? new Error("Device storage failed."));
      try {
        operation(tx.objectStore(objectStoreName), (value) => {
          result = value;
        });
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  } finally {
    database.close();
  }
}

export const outbox = {
  async get(studentId: string, attemptId: string) {
    return transaction<PendingGameCommand | null>("readonly", (store, done) => {
      const request = store.get(`${studentId}:${attemptId}`);
      request.onsuccess = () => done(request.result ?? null);
    });
  },
  async list(studentId: string) {
    return transaction<PendingGameCommand[]>("readonly", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () =>
        done(
          (request.result as PendingGameCommand[]).filter(
            (command) => command.studentId === studentId,
          ),
        );
    });
  },
  async put(command: PendingGameCommand) {
    let conflict = false;
    try {
      return await transaction<void>("readwrite", (store, done) => {
        const request = store.get(command.id);
        request.onsuccess = () => {
          const existing = request.result as PendingGameCommand | undefined;
          if (
            existing &&
            existing.payload.commandId !== command.payload.commandId
          ) {
            conflict = true;
            store.transaction.abort();
            return;
          }
          store.put(command);
          done();
        };
      });
    } catch (error) {
      if (conflict) throw new Error("Finish saving the earlier command first.");
      throw error;
    }
  },
  async remove(command: PendingGameCommand) {
    return transaction<void>("readwrite", (store, done) => {
      const request = store.get(command.id);
      request.onsuccess = () => {
        if (request.result?.payload.commandId === command.payload.commandId)
          store.delete(command.id);
        done();
      };
    });
  },
};
