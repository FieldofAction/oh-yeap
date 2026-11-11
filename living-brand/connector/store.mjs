// The practitioner's own storage. One folder per engagement, so each client's
// records, log and context packages are separate files that are never loaded
// together. Nothing here is sent anywhere; it lives where the connector runs.
//
//   <home>/workbench.json                    methods, preferences, engagement index
//   <home>/engagements/<id>/packet.json      one brand partition and its record
//   <home>/engagements/<id>/log.jsonl        what was done in that engagement
//   <home>/engagements/<id>/packages.json    context packages issued from it
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readPacket, toPacket, startFromPacket, startEngagement, PACKET_FORMAT } from '../../src/living-brand/domain/index.js';
import { fernway } from '../../src/living-brand/data/fernway.js';
import { engagements as sample, practitioner as samplePractitioner } from '../../src/living-brand/data/workspace.js';

const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,62}$/;

export class StoreError extends Error {}

export function openStore(home = process.env.LIVING_BRAND_HOME || join(homedir(), '.living-brand')) {
  const benchPath = join(home, 'workbench.json');
  const dir = id => {
    if (!SAFE_ID.test(String(id))) throw new StoreError(`"${id}" is not an engagement id.`);
    return join(home, 'engagements', id);
  };
  const writeJson = (path, value) => { const tmp = `${path}.tmp`; writeFileSync(tmp, JSON.stringify(value, null, 1)); renameSync(tmp, path); };
  const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

  // First run: a workbench with the fictional sample, so there is something to try.
  if (!existsSync(benchPath)) {
    mkdirSync(join(home, 'engagements'), { recursive: true });
    writeJson(benchPath, {
      format: 'living-brand.workbench/0.2',
      practitioner: { name: process.env.LIVING_BRAND_PRACTITIONER || 'Practitioner', methods: samplePractitioner.methods, preferences: samplePractitioner.preferences },
      engagements: [],
    });
    const state = startEngagement({ fernway }, sample['eng-fernway']);
    savePacket(toPacket(state), { note: 'Fictional sample, installed on first run.' });
    // An ended engagement is remembered by its metadata alone; its material is gone.
    const bench = readJson(benchPath);
    bench.engagements.push({ id: 'eng-brightloop', client: 'Brightloop', role: sample['eng-brightloop'].role, basis: 'fictional', status: 'ended', endedOn: sample['eng-brightloop'].grant.revokedAt });
    writeJson(benchPath, bench);
  }

  function bench() { return readJson(benchPath); }

  function savePacket(packet, { note } = {}) {
    const { brand, engagement } = readPacket(packet); // refuses anything inconsistent
    const d = dir(engagement.id);
    mkdirSync(d, { recursive: true });
    writeJson(join(d, 'packet.json'), packet);
    const b = bench();
    const row = { id: engagement.id, client: brand.name, role: engagement.role, project: engagement.project, basis: brand.basis || 'company-record', status: 'open' };
    b.engagements = [...b.engagements.filter(e => e.id !== engagement.id), row];
    writeJson(benchPath, b);
    if (note) log(engagement.id, { action: 'packet-saved', note });
    return row;
  }

  // Loading one engagement reads one folder. No other client's file is opened.
  function load(id) {
    const row = bench().engagements.find(e => e.id === id);
    if (!row) throw new StoreError(`No engagement "${id}". Use list_engagements to see what can be opened.`);
    if (row.status === 'ended') throw new StoreError(`The ${row.client} engagement ended${row.endedOn ? ` on ${row.endedOn}` : ''}. Its material is no longer held here.`);
    const path = join(dir(id), 'packet.json');
    if (!existsSync(path)) throw new StoreError(`The ${row.client} engagement has no packet on disk.`);
    const state = startFromPacket(readJson(path));
    if (state.tenant !== state.engagement.brandId) throw new StoreError('Packet does not match its engagement.');
    return state;
  }

  function save(state, entry) {
    writeJson(join(dir(state.engagement.id), 'packet.json'), toPacket(state));
    if (entry) log(state.engagement.id, entry);
  }

  function log(id, entry) {
    appendFileSync(join(dir(id), 'log.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
  }

  function packages(id) {
    const path = join(dir(id), 'packages.json');
    return existsSync(path) ? readJson(path) : [];
  }
  function savePackages(id, list) { writeJson(join(dir(id), 'packages.json'), list); }

  // Ending an engagement removes the client's material from this store. The
  // caller is handed the final record first, to give to the client.
  function end(id, endedOn) {
    const b = bench();
    const row = b.engagements.find(e => e.id === id);
    if (!row) throw new StoreError(`No engagement "${id}".`);
    row.status = 'ended'; row.endedOn = endedOn;
    writeJson(benchPath, b);
    rmSync(dir(id), { recursive: true, force: true });
    return row;
  }

  function updateBench(fn) { const b = bench(); fn(b); writeJson(benchPath, b); return b; }

  return { home, bench, load, save, savePacket, log, packages, savePackages, end, updateBench, PACKET_FORMAT };
}
