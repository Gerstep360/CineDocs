/**
 * CineDocs Studio - Safe Local Persistence Engine (IndexedDB + Redundant LocalStorage + Snapshots)
 * Starts completely clean without pre-seeded demo data.
 */
import { Project } from '../types/script';

const DB_NAME = 'CineDocsStudioDB_v2';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const LOCAL_STORAGE_KEY = 'cinedocs_studio_projects_v2';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no disponible en este navegador'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const StorageService = {
  async getProjects(): Promise<Project[]> {
    try {
      const db = await openDB();
      return new Promise<Project[]>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const list = (request.result as Project[]) || [];
          // Sort by most recently updated
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          resolve(list);
        };

        request.onerror = () => {
          resolve(this.getProjectsFromLocalStorage());
        };
      });
    } catch {
      return this.getProjectsFromLocalStorage();
    }
  },

  async getProjectById(id: string): Promise<Project | null> {
    const all = await this.getProjects();
    return all.find((p) => p.id === id) || null;
  },

  async saveProject(project: Project): Promise<void> {
    project.updatedAt = new Date().toISOString();

    // 1. Write to primary IndexedDB store
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.put(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Fallo en escritura primaria IndexedDB, usando espejo seguro en LocalStorage', err);
    }

    // 2. Redundant write to LocalStorage mirror
    try {
      const existing = this.getProjectsFromLocalStorage();
      const index = existing.findIndex((p) => p.id === project.id);
      if (index >= 0) {
        existing[index] = project;
      } else {
        existing.unshift(project);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Fallo al escribir espejo en LocalStorage:', e);
    }
  },

  async deleteProject(id: string, permanently = false): Promise<void> {
    const project = await this.getProjectById(id);
    if (!project) return;

    if (!permanently && !project.isDeleted) {
      project.isDeleted = true;
      await this.saveProject(project);
      return;
    }

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error al eliminar de IndexedDB:', e);
    }

    try {
      const existing = this.getProjectsFromLocalStorage().filter((p) => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Error al eliminar de LocalStorage:', e);
    }
  },

  async restoreProject(id: string): Promise<void> {
    const project = await this.getProjectById(id);
    if (project) {
      project.isDeleted = false;
      await this.saveProject(project);
    }
  },

  async duplicateProject(id: string): Promise<Project | null> {
    const original = await this.getProjectById(id);
    if (!original) return null;

    const copy: Project = JSON.parse(JSON.stringify(original));
    copy.id = `proj-${Date.now()}`;
    copy.title = `${original.title} (Copia)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.isDeleted = false;
    copy.driveFolderId = undefined;
    copy.lastSyncedAt = undefined;

    await this.saveProject(copy);
    return copy;
  },

  getProjectsFromLocalStorage(): Project[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error al leer respaldo local:', e);
    }
    return [];
  },

  exportFullBackupJSON(projects: Project[]): string {
    return JSON.stringify(
      {
        version: '2.0.0',
        app: 'CineDocs Studio',
        exportedAt: new Date().toISOString(),
        projects,
      },
      null,
      2
    );
  },

  async importBackupJSON(jsonString: string): Promise<number> {
    try {
      const parsed = JSON.parse(jsonString);
      const projectsToImport: Project[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.projects)
        ? parsed.projects
        : [];

      let importedCount = 0;
      for (const p of projectsToImport) {
        if (p.id && p.title) {
          await this.saveProject(p);
          importedCount++;
        }
      }
      return importedCount;
    } catch (e) {
      console.error('Error importando respaldo JSON:', e);
      throw new Error('El archivo JSON seleccionado no tiene un formato válido.');
    }
  },
};
