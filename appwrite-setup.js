/**
 * Appwrite Setup Script
 * Run once: node appwrite-setup.js
 *
 * Creates the database and all collections with correct attributes and indexes.
 * Requires node-appwrite and your API key in .env.
 */

import * as sdk from 'node-appwrite'
import { readFileSync } from 'fs'

// Load .env manually (no dotenv dependency needed)
const env = {}
try {
  readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim()
  })
} catch { console.error('❌  .env file not found. Copy .env.example to .env first.'); process.exit(1) }

const ENDPOINT   = env.VITE_APPWRITE_ENDPOINT  || 'https://cloud.appwrite.io/v1'
const PROJECT_ID = env.VITE_APPWRITE_PROJECT_ID
const API_KEY    = env.APPWRITE_API_KEY
const DB_ID      = env.VITE_APPWRITE_DATABASE_ID || 'task-manager-db'

if (!PROJECT_ID || !API_KEY) {
  console.error('❌  VITE_APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in .env')
  process.exit(1)
}

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const databases = new sdk.Databases(client)

const ANY  = [sdk.Permission.read(sdk.Role.users()), sdk.Permission.write(sdk.Role.users())]

async function run() {
  console.log('🚀  Starting Appwrite setup…\n')

  // ── Database ──────────────────────────────────────────────────────────────
  try {
    await databases.create(DB_ID, 'Task Manager DB')
    console.log(`✅  Created database: ${DB_ID}`)
  } catch (e) {
    if (e.code === 409 || (e.message && e.message.includes('maximum number of databases'))) {
      console.log(`⏭   Using existing database: ${DB_ID}`)
    } else throw e
  }

  const collections = [
    // ── profiles ────────────────────────────────────────────────────────────
    {
      id: 'profiles', name: 'Profiles',
      attrs: [
        { type: 'string',  key: 'userId',    size: 64,  required: true },
        { type: 'string',  key: 'name',      size: 128, required: false, default: '' },
      ],
      indexes: [{ key: 'userId_idx', type: 'key', attrs: ['userId'] }]
    },
    // ── workspaces ───────────────────────────────────────────────────────────
    {
      id: 'workspaces', name: 'Workspaces',
      attrs: [
        { type: 'string', key: 'name',      size: 128, required: true },
        { type: 'string', key: 'createdBy', size: 64,  required: true },
        { type: 'string', key: 'joinCode',  size: 16,  required: true },
      ],
      indexes: [{ key: 'joinCode_idx', type: 'unique', attrs: ['joinCode'] }]
    },
    // ── workspace_members ────────────────────────────────────────────────────
    {
      id: 'workspace_members', name: 'Workspace Members',
      attrs: [
        { type: 'string', key: 'workspaceId', size: 64,  required: true },
        { type: 'string', key: 'userId',      size: 64,  required: true },
        { type: 'string', key: 'role',        size: 16,  required: true, default: 'member' },
        { type: 'string', key: 'userName',    size: 128, required: false, default: '' },
      ],
      indexes: [
        { key: 'ws_user_idx', type: 'key', attrs: ['workspaceId', 'userId'] },
        { key: 'user_idx',    type: 'key', attrs: ['userId'] },
      ]
    },
    // ── tasks ────────────────────────────────────────────────────────────────
    {
      id: 'tasks', name: 'Tasks',
      attrs: [
        { type: 'string',   key: 'workspaceId',    size: 64,   required: true },
        { type: 'string',   key: 'title',          size: 256,  required: true },
        { type: 'string',   key: 'description',    size: 4096, required: false, default: '' },
        { type: 'string',   key: 'status',         size: 32,   required: true, default: 'todo' },
        { type: 'string',   key: 'priority',       size: 16,   required: true, default: 'medium' },
        { type: 'string',   key: 'dueDate',        size: 16,   required: false, default: null },
        { type: 'string',   key: 'region',         size: 128,  required: false, default: '' },
        { type: 'string[]', key: 'tags',                       required: false },
        { type: 'string',   key: 'createdBy',      size: 64,   required: false, default: '' },
        { type: 'string',   key: 'createdByName',  size: 128,  required: false, default: '' },
        { type: 'string',   key: 'assignedTo',     size: 64,   required: false, default: '' },
        { type: 'string',   key: 'assignedToName', size: 128,  required: false, default: '' },
      ],
      indexes: [
        { key: 'ws_idx',     type: 'key', attrs: ['workspaceId'] },
        { key: 'status_idx', type: 'key', attrs: ['status'] },
      ]
    },
    // ── regions ──────────────────────────────────────────────────────────────
    {
      id: 'regions', name: 'Regions',
      attrs: [
        { type: 'string', key: 'workspaceId', size: 64,  required: true },
        { type: 'string', key: 'name',        size: 128, required: true },
      ],
      indexes: [{ key: 'ws_idx', type: 'key', attrs: ['workspaceId'] }]
    },
    // ── tags ─────────────────────────────────────────────────────────────────
    {
      id: 'tags', name: 'Tags',
      attrs: [
        { type: 'string', key: 'workspaceId', size: 64,  required: true },
        { type: 'string', key: 'name',        size: 128, required: true },
      ],
      indexes: [{ key: 'ws_idx', type: 'key', attrs: ['workspaceId'] }]
    },
  ]

  for (const col of collections) {
    // Create collection
    try {
      await databases.createCollection(DB_ID, col.id, col.name, ANY)
      console.log(`✅  Created collection: ${col.name}`)
    } catch (e) {
      if (e.code === 409) { console.log(`⏭   Collection exists: ${col.name}`); continue }
      else throw e
    }

    // Create attributes
    for (const attr of col.attrs) {
      try {
        if (attr.type === 'string[]') {
          await databases.createStringAttribute(DB_ID, col.id, attr.key, 128, false, undefined, true)
        } else if (attr.type === 'string') {
          await databases.createStringAttribute(
            DB_ID, col.id, attr.key, attr.size, attr.required,
            attr.default !== undefined ? attr.default : undefined
          )
        }
        process.stdout.write(`   ↳ attr: ${attr.key}\n`)
      } catch (e) {
        if (e.code === 409) process.stdout.write(`   ↳ attr exists: ${attr.key}\n`)
        else console.warn(`   ⚠️  ${attr.key}: ${e.message}`)
      }
    }

    // Wait for attributes to be ready before creating indexes
    await new Promise(r => setTimeout(r, 1500))

    // Create indexes
    for (const idx of (col.indexes || [])) {
      try {
        await databases.createIndex(DB_ID, col.id, idx.key, idx.type, idx.attrs)
        process.stdout.write(`   ↳ index: ${idx.key}\n`)
      } catch (e) {
        if (e.code === 409) process.stdout.write(`   ↳ index exists: ${idx.key}\n`)
        else console.warn(`   ⚠️  index ${idx.key}: ${e.message}`)
      }
    }
  }

  console.log('\n🎉  Setup complete! You can now run: npm run dev\n')
}

run().catch(e => { console.error('❌  Setup failed:', e.message); process.exit(1) })
