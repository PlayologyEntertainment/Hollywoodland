import type { SaveEnvelope } from './SaveEnvelope';

const DATABASE_NAME = 'hollywoodland';
const DATABASE_VERSION = 1;
const SAVE_STORE = 'saves';

export class IndexedDbSaveRepository {
  private databasePromise: Promise<IDBDatabase> | undefined;

  public async list(): Promise<readonly SaveEnvelope[]> {
    const database = await this.open();
    return this.request(database.transaction(SAVE_STORE).objectStore(SAVE_STORE).getAll());
  }
  public async get(saveId: string): Promise<SaveEnvelope | undefined> {
    const database = await this.open();
    return this.request(database.transaction(SAVE_STORE).objectStore(SAVE_STORE).get(saveId));
  }
  public async put(save: SaveEnvelope): Promise<void> {
    const database = await this.open();
    await this.transaction(database, (store) => store.put(save));
  }

  private open(): Promise<IDBDatabase> {
    this.databasePromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onerror = () => reject(request.error ?? new Error('Could not open save storage.'));
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(SAVE_STORE)) {
          request.result.createObjectStore(SAVE_STORE, { keyPath: 'saveId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });
    return this.databasePromise;
  }

  private request<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Save storage request failed.'));
    });
  }

  private transaction(database: IDBDatabase, action: (store: IDBObjectStore) => IDBRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(SAVE_STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Save transaction failed.'));
      action(transaction.objectStore(SAVE_STORE));
    });
  }
}
