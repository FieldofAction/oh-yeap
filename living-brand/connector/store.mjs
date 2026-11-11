// The practitioner's own storage. One folder per engagement, so each client's
// records, log and context packages are separate files that are never loaded
// together. Nothing here is sent anywhere; it lives where the connector runs,
// readable only by the account that runs it.
//
//   <home>/workbench.json                    methods, preferences, and an index of engagements (client name, role, project)
//   <home>/engagements/<id>/packet.json      one brand partition and its record
//   <home>/engagements/<id>/log.jsonl        what was done in that engagement
//   <home>/engagements/<id>/packages.json    context packages issued from it
//   <home>/handed-over/<id>-<date>.json      the final record of an ended engagement, to give to the client
//   <home>/exports/                          packages and packets saved on request
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, renameSync, rmSync, readdirSync, chmodSync, statSync, rmdirSync, lstatSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readPacket, toPacket, startFromPacket, startEngagement, PACKET_FORMAT } from '../../src/living-brand/domain/index.js';
import { fernway } from '../../src/living-brand/data/fernway.js';
import { engagements as sample, closed as sampleClosed, practitioner as samplePractitioner } from '../../src/living-brand/data/workspace.js';

const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,62}$/;
const PRIVATE_DIR = 0o700;
const PRIVATE_FILE = 0o600;

export class StoreError extends Error {}

export function openStore(home = process.env.LIVING_BRAND_HOME || join(homedir(), '.living-brand')) {
  const benchPath = join(home, 'workbench.json');
  const engagementsDir = join(home, 'engagements');
  const dir = id => {
    if (typeof id !== 'string' || !SAFE_ID.test(id)) throw new StoreError(`"${String(id).slice(0, 40)}" is not an engagement id.`);
    const path = join(engagementsDir, id);
    // A folder that is really a link to somewhere else is not written through.
    try { if (lstatSync(path).isSymbolicLink()) throw new StoreError('That engagement\'s folder is a link to another place. The connector will not read or write through it.'); }
    catch (error) { if (error instanceof StoreError) throw error; }
    return path;
  };
  const privateDir = path => { mkdirSync(path, { recursive: true, mode: PRIVATE_DIR }); try { chmodSync(path, PRIVATE_DIR); } catch { /* not ours to change */ } };
  // Write beside the target under a name no other process will pick, then move it into place.
  const writeJson = (path, value) => { const tmp = `${path}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`; writeFileSync(tmp, JSON.stringify(value, null, 1), { mode: PRIVATE_FILE }); renameSync(tmp, path); };
  const readJson = (path, what) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { throw new StoreError(`${what} cannot be read; the file is damaged or missing.`); } };

  // One writer at a time. A second connector on the same folder waits its turn
  // instead of overwriting what the first has just saved.
  const lockPath = join(home, '.lock');
  const withLock = fn => {
    const started = Date.now();
    for (;;) {
      try { mkdirSync(lockPath); break; }
      catch {
        try { if (Date.now() - statSync(lockPath).mtimeMs > 10_000) rmdirSync(lockPath); } catch { /* released meanwhile */ }
        if (Date.now() - started > 5_000) throw new StoreError('The workbench folder is busy in another process. Try again.');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
      }
    }
    try { return fn(); } finally { try { rmdirSync(lockPath); } catch { /* already gone */ } }
  };

  privateDir(home);
  privateDir(engagementsDir);

  const rowFor = (id, status) => {
    const packet = readJson(join(dir(id), 'packet.json'), 'That engagement\'s record');
    const { brand, engagement } = readPacket(packet);
    return { id: engagement.id, client: brand.name, brandId: brand.id, role: engagement.role, project: engagement.project, basis: brand.basis, status };
  };

  if (!existsSync(benchPath)) {
    withLock(() => {
      if (existsSync(benchPath)) return;
      const folders = readdirSync(engagementsDir).filter(name => SAFE_ID.test(name));
      const practitioner = { name: process.env.LIVING_BRAND_PRACTITIONER || 'Practitioner', methods: [...samplePractitioner.methods], preferences: { ...samplePractitioner.preferences } };
      if (folders.length) {
        // The index is missing but records are here: rebuild it from them. Nothing is overwritten.
        const rows = folders.map(id => { try { return rowFor(id, 'open'); } catch { return { id, client: 'Unreadable record', role: '', project: '', basis: 'company-record', status: 'unreadable' }; } });
        writeJson(benchPath, { format: 'living-brand.workbench/0.2', practitioner, engagements: rows, rebuiltOn: new Date().toISOString().slice(0, 10) });
        return;
      }
      // First run: a workbench with the fictional sample, so there is something to try.
      const state = startEngagement({ fernway }, sample['eng-fernway'], {}, { asOf: sample['eng-fernway'].asOf });
      privateDir(dir(state.engagement.id));
      writeJson(join(dir(state.engagement.id), 'packet.json'), toPacket(state));
      writeJson(benchPath, {
        format: 'living-brand.workbench/0.2', practitioner,
        engagements: [
          { id: 'eng-fernway', client: 'Fernway', brandId: 'fernway', role: sample['eng-fernway'].role, project: sample['eng-fernway'].project, basis: 'fictional', status: 'open' },
          // An ended engagement is remembered by name alone; its material is gone.
          ...sampleClosed.map(c => ({ id: c.id, client: c.clientLabel, brandId: c.brandId, role: c.role, basis: 'fictional', status: 'ended', endedOn: c.grant.revokedAt })),
        ],
      });
    });
  }

  function bench() {
    const b = readJson(benchPath, 'The workbench index');
    if (!b || !Array.isArray(b.engagements) || !b.practitioner) throw new StoreError('The workbench index is damaged. Move workbench.json aside and start the connector again; it rebuilds the index from the engagement folders.');
    return b;
  }

  function log(id, entry) {
    appendFileSync(join(dir(id), 'log.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n', { mode: PRIVATE_FILE });
  }

  // Store a packet as an engagement. The caller has already decided this is allowed.
  function savePacket(packet, { note } = {}) {
    const { brand, engagement } = readPacket(packet); // refuses anything inconsistent
    const d = dir(engagement.id);
    return withLock(() => {
      privateDir(d);
      writeJson(join(d, 'packet.json'), packet);
      const b = bench();
      const row = { id: engagement.id, client: brand.name, brandId: brand.id, role: engagement.role, project: engagement.project, basis: brand.basis, status: 'open' };
      b.engagements = [...b.engagements.filter(e => e.id !== engagement.id), row];
      writeJson(benchPath, b);
      if (note) log(engagement.id, { action: 'packet-saved', note });
      return row;
    });
  }

  const row = id => {
    const found = bench().engagements.find(e => e.id === id);
    if (!found) throw new StoreError(`No engagement "${String(id).slice(0, 40)}". Use list_engagements to see what can be opened.`);
    return found;
  };

  // Loading one engagement reads one folder. No other client's file is opened.
  // asOf is today: access that has ended cannot be opened, except to export or end it.
  function load(id, { asOf, allowExpired = false } = {}) {
    const found = row(id);
    if (found.status === 'ended') throw new StoreError(`The ${found.client} engagement ended${found.endedOn ? ` on ${found.endedOn}` : ''}. Its material is no longer held here.`);
    const path = join(dir(id), 'packet.json');
    if (!existsSync(path)) throw new StoreError(`The ${found.client} engagement has no record on disk.`);
    const packet = readJson(path, `The ${found.client} engagement's record`);
    let state;
    try { state = startFromPacket(packet, { asOf }); }
    catch (error) {
      if (!(allowExpired && /expired on/.test(error.message))) throw error;
      state = startFromPacket(packet, { asOf: packet.engagement.grant.expires });
      state.expired = packet.engagement.grant.expires;
    }
    if (state.engagement.id !== id || state.tenant !== state.engagement.brandId) throw new StoreError('The record in that folder belongs to a different engagement.');
    return state;
  }

  function save(state, entry) {
    withLock(() => {
      const { expired, ...clean } = state; void expired;
      writeJson(join(dir(state.engagement.id), 'packet.json'), toPacket(clean));
      if (entry) log(state.engagement.id, entry);
    });
  }

  function packages(id) {
    const path = join(dir(id), 'packages.json');
    if (!existsSync(path)) return [];
    const list = readJson(path, 'That engagement\'s context packages');
    if (!Array.isArray(list)) throw new StoreError('That engagement\'s context packages cannot be read; the file is damaged.');
    return list;
  }
  function savePackages(id, list) { withLock(() => writeJson(join(dir(id), 'packages.json'), list)); }

  const saveOutside = (folder, name, value) => {
    const target = join(home, folder);
    privateDir(target);
    const path = join(target, name);
    writeJson(path, value);
    return path;
  };

  // Ending an engagement writes the whole final record to one file to give to
  // the client, and only then removes that client's folder from this store.
  function end(id, endedOn, finalRecord) {
    return withLock(() => {
      const path = saveOutside('handed-over', `${id}-${endedOn}.json`, finalRecord);
      if (!existsSync(path)) throw new StoreError('The final record could not be written, so nothing was removed.');
      rmSync(dir(id), { recursive: true, force: true });
      const b = bench();
      const found = b.engagements.find(e => e.id === id);
      if (found) { found.status = 'ended'; found.endedOn = endedOn; }
      writeJson(benchPath, b);
      return path;
    });
  }

  // A record that can no longer be read can still be removed: whatever is in
  // the folder is kept, unparsed, in the handed-over folder first.
  function endUnreadable(id, endedOn) {
    return withLock(() => {
      const d = dir(id);
      const raw = {};
      for (const name of existsSync(d) ? readdirSync(d) : []) { try { raw[name] = readFileSync(join(d, name), 'utf8'); } catch { raw[name] = null; } }
      const path = saveOutside('handed-over', `${id}-${endedOn}-unreadable.json`, { note: 'This engagement\'s record could not be read. Its files are kept here as they were.', files: raw });
      rmSync(d, { recursive: true, force: true });
      const b = bench();
      const found = b.engagements.find(e => e.id === id);
      if (found) { found.status = 'ended'; found.endedOn = endedOn; }
      writeJson(benchPath, b);
      return path;
    });
  }

  function updateBench(fn) { return withLock(() => { const b = bench(); fn(b); writeJson(benchPath, b); return b; }); }

  return { home, bench, row, load, save, savePacket, log, packages, savePackages, saveOutside, end, endUnreadable, updateBench, PACKET_FORMAT };
}
