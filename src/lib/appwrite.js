import { Client, Account, Databases, ID, Query } from 'appwrite'

// ── Client ────────────────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

export const account   = new Account(client)
export const databases = new Databases(client)
export { client }

const DB  = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'task-manager-db'

// ── Helpers ───────────────────────────────────────────────────────────────────
// Appwrite documents use $id — normalise to id for the rest of the app
function doc(d) {
  if (!d) return null
  const { $id, $createdAt, $updatedAt, ...rest } = d
  return { id: $id, createdAt: $createdAt, updatedAt: $updatedAt, ...rest }
}
function docs(list) { return (list?.documents || []).map(doc) }

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function signUp(email, password, name) {
  // Create account
  await account.create(ID.unique(), email, password, name)
  // Immediately sign in
  await account.createEmailPasswordSession(email, password)
  // Create profile document
  const user = await account.get()
  await databases.createDocument(DB, 'profiles', ID.unique(), { userId: user.$id, name })
  return user
}

export async function signIn(email, password) {
  await account.createEmailPasswordSession(email, password)
  return account.get()
}

export async function signOut() {
  await account.deleteSession('current')
}

export async function getCurrentUser() {
  try { return await account.get() }
  catch { return null }
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const res = await databases.listDocuments(DB, 'profiles', [Query.equal('userId', userId)])
  return docs(res)[0] || null
}

export async function updateProfile(userId, name) {
  const profile = await getProfile(userId)
  if (!profile) {
    await databases.createDocument(DB, 'profiles', ID.unique(), { userId, name })
  } else {
    await databases.updateDocument(DB, 'profiles', profile.id, { name })
  }
  // Also update userName in all workspace_members entries for this user
  const memberships = await databases.listDocuments(DB, 'workspace_members', [
    Query.equal('userId', userId), Query.limit(50)
  ])
  await Promise.all(
    memberships.documents.map(m =>
      databases.updateDocument(DB, 'workspace_members', m.$id, { userName: name })
    )
  )
}

// ── Workspaces ────────────────────────────────────────────────────────────────
export async function getWorkspaces(userId) {
  // Find all memberships for this user
  const memberships = await databases.listDocuments(DB, 'workspace_members', [
    Query.equal('userId', userId), Query.limit(50)
  ])
  if (!memberships.documents.length) return []

  const wsIds = memberships.documents.map(m => m.workspaceId)
  const wsRes = await databases.listDocuments(DB, 'workspaces', [
    Query.equal('$id', wsIds), Query.limit(50)
  ])

  return wsRes.documents.map(ws => {
    const membership = memberships.documents.find(m => m.workspaceId === ws.$id)
    return { ...doc(ws), role: membership?.role || 'member' }
  })
}

export async function createWorkspace(name, userId, userName) {
  const { randomJoinCode } = await import('./constants.js')
  const joinCode = randomJoinCode()

  const ws = await databases.createDocument(DB, 'workspaces', ID.unique(), {
    name, createdBy: userId, joinCode
  })

  // Add creator as owner member
  await databases.createDocument(DB, 'workspace_members', ID.unique(), {
    workspaceId: ws.$id, userId, role: 'owner', userName: userName || ''
  })

  // Seed default regions & tags
  const defaultRegions = ['Serbia', 'Macedonia', 'Poland']
  const defaultTags    = ['IT', 'SCM']
  await Promise.all([
    ...defaultRegions.map(r => databases.createDocument(DB, 'regions', ID.unique(), { workspaceId: ws.$id, name: r })),
    ...defaultTags.map(t    => databases.createDocument(DB, 'tags',    ID.unique(), { workspaceId: ws.$id, name: t })),
  ])

  return doc(ws)
}

export async function joinWorkspaceByCode(joinCode, userId, userName) {
  // Find workspace by join code
  const res = await databases.listDocuments(DB, 'workspaces', [
    Query.equal('joinCode', joinCode.toUpperCase().trim())
  ])
  if (!res.documents.length) throw new Error('Invalid join code. Please check and try again.')

  const ws = res.documents[0]

  // Check not already a member
  const existing = await databases.listDocuments(DB, 'workspace_members', [
    Query.equal('workspaceId', ws.$id),
    Query.equal('userId', userId),
  ])
  if (existing.documents.length) throw new Error('You are already a member of this workspace.')

  await databases.createDocument(DB, 'workspace_members', ID.unique(), {
    workspaceId: ws.$id, userId, role: 'member', userName: userName || ''
  })

  return doc(ws)
}

export async function getWorkspaceMembers(workspaceId) {
  const res = await databases.listDocuments(DB, 'workspace_members', [
    Query.equal('workspaceId', workspaceId), Query.limit(50)
  ])
  return docs(res)
}

export async function removeMember(memberId) {
  await databases.deleteDocument(DB, 'workspace_members', memberId)
}

export async function getWorkspaceJoinCode(workspaceId) {
  const ws = await databases.getDocument(DB, 'workspaces', workspaceId)
  return ws.joinCode
}

export async function regenerateJoinCode(workspaceId) {
  const { randomJoinCode } = await import('./constants.js')
  const joinCode = randomJoinCode()
  await databases.updateDocument(DB, 'workspaces', workspaceId, { joinCode })
  return joinCode
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function getTasks(workspaceId) {
  const res = await databases.listDocuments(DB, 'tasks', [
    Query.equal('workspaceId', workspaceId),
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ])
  return docs(res)
}

export async function createTask(workspaceId, userId, userName, data) {
  const d = await databases.createDocument(DB, 'tasks', ID.unique(), {
    workspaceId,
    createdBy:     userId,
    createdByName: userName || '',
    ...sanitiseTask(data),
  })
  return doc(d)
}

export async function updateTask(taskId, data) {
  const d = await databases.updateDocument(DB, 'tasks', taskId, sanitiseTask(data))
  return doc(d)
}

export async function deleteTask(taskId) {
  await databases.deleteDocument(DB, 'tasks', taskId)
}

function sanitiseTask(data) {
  // Remove undefined/null cleanly; Appwrite rejects undefined
  return {
    title:          data.title          || '',
    description:    data.description    || '',
    status:         data.status         || 'todo',
    priority:       data.priority       || 'medium',
    dueDate:        data.dueDate        || null,
    region:         data.region         || '',
    tags:           data.tags           || [],
    assignedTo:     data.assignedTo     || '',
    assignedToName: data.assignedToName || '',
  }
}

// ── Regions ───────────────────────────────────────────────────────────────────
export async function getRegions(workspaceId) {
  const res = await databases.listDocuments(DB, 'regions', [
    Query.equal('workspaceId', workspaceId), Query.orderAsc('name'), Query.limit(100)
  ])
  return docs(res)
}

export async function addRegion(workspaceId, name) {
  const d = await databases.createDocument(DB, 'regions', ID.unique(), { workspaceId, name })
  return doc(d)
}

export async function deleteRegion(regionId) {
  await databases.deleteDocument(DB, 'regions', regionId)
}

// ── Tags ──────────────────────────────────────────────────────────────────────
export async function getTags(workspaceId) {
  const res = await databases.listDocuments(DB, 'tags', [
    Query.equal('workspaceId', workspaceId), Query.orderAsc('name'), Query.limit(100)
  ])
  return docs(res)
}

export async function addTag(workspaceId, name) {
  const d = await databases.createDocument(DB, 'tags', ID.unique(), { workspaceId, name })
  return doc(d)
}

export async function deleteTag(tagId) {
  await databases.deleteDocument(DB, 'tags', tagId)
}

// ── Realtime ──────────────────────────────────────────────────────────────────
// Subscribe to live task changes in a workspace.
// Returns an unsubscribe function.
export function subscribeToTasks(workspaceId, onChange) {
  return client.subscribe(
    `databases.${DB}.collections.tasks.documents`,
    event => {
      // Filter to this workspace only
      if (event.payload?.workspaceId === workspaceId) {
        onChange(event)
      }
    }
  )
}
