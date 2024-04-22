import { Buffer } from "node:buffer";
import {
  Chunk,
  StorageAdapterInterface,
  type StorageKey,
} from "npm:@automerge/automerge-repo@1.1.5";
import pg from "npm:pg@8.11.5";

export function keyToArray(key: StorageKey): Buffer[] {
  return key.map(k => Buffer.from(k, "utf8"));
}

export function arrayToKey(array: Buffer[]): StorageKey {
  return array.map(a => a.toString("utf8"));
}

export class PostgresStorageAdapter implements StorageAdapterInterface {
  private pool: pg.Pool;
  private tableName: string;

  constructor(pool: pg.Pool, tableName: string) {
    this.pool = pool;
    this.tableName = pg.escapeIdentifier(tableName);
  }
  
  async load(key: StorageKey): Promise<Uint8Array | undefined> {
    const keyArray = keyToArray(key);
    const result = await this.pool.query(`select value from ${this.tableName} where key = $1`, [keyArray]);
    if (result.rows.length == 0) {
      return undefined;
    }
    return Uint8Array.from(result.rows[0].value);
  }

  async save(key: StorageKey, data: Uint8Array): Promise<void> {
    const keyArray = keyToArray(key);
    await this.pool.query(
      `insert into ${this.tableName} (key, value) values ($1, $2)` +
      "on conflict (key) do update set value = $2",
     [keyArray, Buffer.from(data)]);
  }

  async remove(key: StorageKey): Promise<void> {
    const keyArray = keyToArray(key);
    await this.pool.query(`delete from ${this.tableName} where key = $1`, [keyArray]);
  }

  async loadRange(keyPrefix: StorageKey): Promise<Chunk[]> {
    let result;
    if (keyPrefix.length == 0) {
      result = await this.pool.query(`select key, value from ${this.tableName}`);
    } else {
      const lowerBound = keyToArray(keyPrefix);
      const upperBound = lowerBound.map(buf => Buffer.from(buf));
      upperBound[upperBound.length - 1] = Buffer.concat([upperBound[upperBound.length - 1], Buffer.from([0])]);
      result = await this.pool.query(`select key, value from ${this.tableName} where key >= $1 and key < $2`, [lowerBound, upperBound]);
    }
    return result.rows.map(row => ({ key: arrayToKey(row.key), data: Uint8Array.from(row.value) }));
  }

  async removeRange(keyPrefix: StorageKey): Promise<void> {
    if (keyPrefix.length == 0) {
      await this.pool.query(`delete from ${this.tableName}`);
      return;
    }
    const lowerBound = keyToArray(keyPrefix);
    const upperBound = lowerBound.map(buf => Buffer.from(buf));
    upperBound[upperBound.length - 1] = Buffer.concat([upperBound[upperBound.length - 1], Buffer.from([0])]);
    await this.pool.query(`delete from ${this.tableName} where key >= $1 and key < $2`, [lowerBound, upperBound]);
  }
}