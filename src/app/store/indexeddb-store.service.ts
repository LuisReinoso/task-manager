// store/indexeddb-store.service.ts
import { Injectable } from '@angular/core';
import { Task, TaskStoreInterface } from './task-store.interface';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TaskDB extends DBSchema {
  tasks: {
    key: number;
    value: Task;
    indexes: { 'by-dueDate': Date };
  };
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDBStoreService implements TaskStoreInterface {
  private dbPromise: Promise<IDBPDatabase<TaskDB>>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB() {
    return await openDB<TaskDB>('task-manager-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('tasks', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-dueDate', 'dueDate');
      },
    });
  }

  public async getAllTasks(): Promise<Task[]> {
    const db = await this.dbPromise;
    return await db.getAll('tasks');
  }

  public async addTask(task: Task): Promise<void> {
    const db = await this.dbPromise;
    await db.add('tasks', task);
  }

  public async updateTask(task: Task): Promise<void> {
    const db = await this.dbPromise;
    await db.put('tasks', task);
  }

  public async deleteTask(taskId: number): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('tasks', taskId);
  }
}
