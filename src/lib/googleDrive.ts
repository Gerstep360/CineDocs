/**
 * Google Drive Integration via Firebase Auth (Client-Side OAuth Token)
 * Organizes scripts in: Gerstep/Guiones/[Peliculas | Series | Videos | Contenido Episodico | Personalizados]
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

// In-memory token cache (never stored in localStorage/sessionStorage per security rules)
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

export function getTargetDrivePath(category: ProjectCategory): string {
  const baseRoot =
    (import.meta as any).env?.VITE_GOOGLE_DRIVE_ROOT_FOLDER || 'Gerstep/Guiones';
  const cleanRoot = baseRoot.replace(/^\/+|\/+$/g, '');
  const categoryFolder = getCategoryFolderName(category);
  return `${cleanRoot}/${categoryFolder}`;
}

/**
 * Finds or creates a single folder inside a parent folder in Google Drive
 */
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

  // Create folder if it doesn't exist
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
 * Ensures the full hierarchy "Gerstep/Guiones/[Categoría]" exists and returns the leaf folder ID
 */
export async function ensureCategoryFolderHierarchy(
  category: ProjectCategory,
  token: string
): Promise<{ folderId: string; fullPath: string }> {
  const fullPath = getTargetDrivePath(category);
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

/**
 * Checks if a script file already exists in the target folder or by fileId
 */
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
 * Uploads or updates a script document inside Gerstep/Guiones/[Categoría]
 */
export async function uploadScriptToGoogleDrive(params: {
  project: Project;
  document: ScriptDocument;
  folderId: string;
  existingFileId?: string;
  token: string;
}): Promise<{
  fileId: string;
  webViewLink: string;
  folderPath: string;
}> {
  const { project, document: scriptDoc, folderId, existingFileId, token } = params;
  const folderPath = getTargetDrivePath(project.category);

  const safeProjectName = project.title.trim();
  const safeDocName =
    project.category === 'series'
      ? `${safeProjectName} - ${scriptDoc.title}.fountain`
      : `${safeProjectName}.fountain`;

  const fountainContent = Exporters.exportToFountain(
    scriptDoc.blocks,
    `${project.title} — ${scriptDoc.title}`,
    project.author
  );

  const metadata: Record<string, any> = {
    name: safeDocName,
    mimeType: 'text/plain',
    description: `Guion creado con CineDocs Studio (${folderPath})`,
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
