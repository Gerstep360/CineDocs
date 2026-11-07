/**
 * Google Drive & Local Directory Structure Manager
 *
 * Google Drive Hierarchy:
 *   Gerstep/Guiones/[Peliculas | Series | Videos | Contenido Episodico | Personalizados]/[Nombre del Guion]/[Temporada X/][Archivo]
 *
 * Local Directory Hierarchy:
 *   Documento/Gerstep/[Peliculas | Series | Videos | Contenido Episodico | Personalizados]/[Nombre del Guion]/[Temporada X/][Archivo]
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Project, ProjectCategory, ScriptDocument } from '../types/script';
import { Exporters } from './exporters';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el permiso de acceso para Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const googleDriveLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export function sanitizeFolderName(raw: string): string {
  return (raw || 'Sin Titulo')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ');
}

export function getCategoryFolderName(category: ProjectCategory): string {
  switch (category) {
    case 'movie':
      return 'Peliculas';
    case 'series':
      return 'Series';
    case 'video':
      return 'Videos';
    case 'episodic':
      return 'Contenido Episodico';
    default:
      return 'Personalizados';
  }
}

/**
 * Returns the Google Drive directory path for a project/document:
 * Gerstep/Guiones/[Categoría]/[Nombre del Guion]/[Temporada X]
 */
export function getTargetDrivePath(
  category: ProjectCategory,
  projectTitle?: string,
  seasonTitle?: string
): string {
  const baseRoot =
    (import.meta as any).env?.VITE_GOOGLE_DRIVE_ROOT_FOLDER || 'Gerstep/Guiones';
  const cleanRoot = baseRoot.replace(/^\/+|\/+$/g, '');
  const categoryFolder = getCategoryFolderName(category);

  if (!projectTitle) {
    return `${cleanRoot}/${categoryFolder}`;
  }

  const cleanProj = sanitizeFolderName(projectTitle);
  if (category === 'series' && seasonTitle) {
    return `${cleanRoot}/${categoryFolder}/${cleanProj}/${sanitizeFolderName(
      seasonTitle
    )}`;
  }

  return `${cleanRoot}/${categoryFolder}/${cleanProj}`;
}

/**
 * Returns the Local Directory path for a project/document:
 * Documento/Gerstep/[Categoría]/[Nombre del Guion]/[Temporada X/][Archivo]
 */
export function getTargetLocalDirectoryPath(
  category: ProjectCategory,
  projectTitle?: string,
  seasonTitle?: string,
  documentTitle?: string
): string {
  const categoryFolder = getCategoryFolderName(category);
  const cleanProj = sanitizeFolderName(projectTitle || 'Mi Guion');

  const segments = ['Documento', 'Gerstep', categoryFolder, cleanProj];
  if (category === 'series' && seasonTitle) {
    segments.push(sanitizeFolderName(seasonTitle));
  }
  if (documentTitle) {
    segments.push(`${sanitizeFolderName(documentTitle)}.fountain`);
  }

  return segments.join('/');
}

async function findOrCreateFolder(
  folderName: string,
  parentId: string | null,
  token: string
): Promise<string> {
  const escapedName = folderName.replace(/'/g, "\\'");
  const parentClause = parentId ? `'${parentId}' in parents` : `'root' in parents`;
  const q = `mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and ${parentClause} and trashed=false`;

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error('Error al consultar carpetas en Google Drive');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    }),
  });

  if (!createRes.ok) {
    throw new Error(`No se pudo crear la carpeta "${folderName}" en Google Drive`);
  }

  const createdFolder = await createRes.json();
  return createdFolder.id;
}

/**
 * Ensures the full project directory hierarchy exists in Google Drive:
 * Gerstep/Guiones/[Categoría]/[Nombre del Guion]/[Temporada X (if series)]
 */
export async function ensureCategoryFolderHierarchy(
  category: ProjectCategory,
  token: string,
  projectTitle?: string,
  seasonTitle?: string
): Promise<{ folderId: string; fullPath: string }> {
  const fullPath = getTargetDrivePath(category, projectTitle, seasonTitle);
  const parts = fullPath.split('/').filter(Boolean);

  let currentParentId: string | null = null;
  for (const part of parts) {
    currentParentId = await findOrCreateFolder(part, currentParentId, token);
  }

  if (!currentParentId) {
    throw new Error('No se pudo resolver la ruta de carpetas en Google Drive');
  }

  return { folderId: currentParentId, fullPath };
}

export async function checkExistingScriptFileInDrive(
  fileName: string,
  folderId: string,
  existingFileId: string | undefined,
  token: string
): Promise<{ id: string; name: string; webViewLink?: string } | null> {
  if (existingFileId) {
    const checkRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existingFileId}?fields=id,name,trashed,webViewLink`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (checkRes.ok) {
      const fileData = await checkRes.json();
      if (!fileData.trashed) {
        return fileData;
      }
    }
  }

  const escapedName = fileName.replace(/'/g, "\\'");
  const q = `name='${escapedName}' and '${folderId}' in parents and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,webViewLink)&spaces=drive`;

  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
  }

  return null;
}

/**
 * Uploads or updates a script document inside its own dedicated project directory in Google Drive
 */
export async function uploadScriptToGoogleDrive(params: {
  project: Project;
  document: ScriptDocument;
  folderId: string;
  existingFileId?: string;
  token: string;
  seasonTitle?: string;
}): Promise<{
  fileId: string;
  webViewLink: string;
  folderPath: string;
}> {
  const { project, document: scriptDoc, folderId, existingFileId, token, seasonTitle } =
    params;
  const folderPath = getTargetDrivePath(
    project.category,
    project.title,
    seasonTitle
  );

  const safeDocName = `${sanitizeFolderName(
    scriptDoc.title || project.title
  )}.fountain`;

  const fountainContent = Exporters.exportToFountain(
    scriptDoc.blocks,
    `${project.title} — ${scriptDoc.title}`,
    project.author
  );

  const metadata: Record<string, any> = {
    name: safeDocName,
    mimeType: 'text/plain',
    description: `Guion de ${project.title} (${folderPath})`,
  };

  if (!existingFileId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------cinedocs_multipart_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    fountainContent +
    closeDelimiter;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name,webViewLink`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';

  const method = existingFileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al guardar en Google Drive: ${errText}`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    webViewLink:
      data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    folderPath,
  };
}

/**
 * Saves the script directly into the user's local directory structure:
 * Documento/Gerstep/[Categoría]/[Nombre del Guion]/[Temporada X/][Archivo]
 */
export async function saveToLocalGerstepDirectory(params: {
  project: Project;
  document: ScriptDocument;
  seasonTitle?: string;
}): Promise<{ savedPath: string; usedNativeFS: boolean }> {
  const { project, document: scriptDoc, seasonTitle } = params;
  const categoryFolder = getCategoryFolderName(project.category);
  const projectFolder = sanitizeFolderName(project.title);
  const fileName = `${sanitizeFolderName(scriptDoc.title || project.title)}.fountain`;
  const jsonBackupName = `${sanitizeFolderName(
    scriptDoc.title || project.title
  )}.gerstep.json`;

  const targetRelativePath = getTargetLocalDirectoryPath(
    project.category,
    project.title,
    seasonTitle,
    scriptDoc.title || project.title
  );

  const fountainContent = Exporters.exportToFountain(
    scriptDoc.blocks,
    `${project.title} — ${scriptDoc.title}`,
    project.author
  );

  const win = window as any;
  if (typeof win.showDirectoryPicker === 'function') {
    try {
      const rootHandle = await win.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      const gerstepDir = await rootHandle.getDirectoryHandle('Gerstep', {
        create: true,
      });
      const catDir = await gerstepDir.getDirectoryHandle(categoryFolder, {
        create: true,
      });
      const projDir = await catDir.getDirectoryHandle(projectFolder, {
        create: true,
      });

      let targetDir = projDir;
      if (project.category === 'series' && seasonTitle) {
        targetDir = await projDir.getDirectoryHandle(
          sanitizeFolderName(seasonTitle),
          { create: true }
        );
      }

      // Write .fountain script
      const fileHandle = await targetDir.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(fountainContent);
      await writable.close();

      // Also write structured JSON project metadata inside its directory
      const jsonHandle = await targetDir.getFileHandle(jsonBackupName, {
        create: true,
      });
      const jsonWritable = await jsonHandle.createWritable();
      await jsonWritable.write(JSON.stringify({ project, document: scriptDoc }, null, 2));
      await jsonWritable.close();

      return { savedPath: targetRelativePath, usedNativeFS: true };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Selección de carpeta cancelada por el usuario.');
      }
      // Fallback to browser download if running inside restricted cross-origin iframe
    }
  }

  Exporters.downloadBlob(
    fountainContent,
    `${projectFolder}__${fileName}`,
    'text/plain;charset=utf-8'
  );
  return { savedPath: targetRelativePath, usedNativeFS: false };
}
