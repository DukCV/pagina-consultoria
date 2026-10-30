/**
 * Valida y mide la configuración de Claude Code del proyecto (`npm run check:ai`).
 *
 * Comprueba: frontmatter y campos de agentes, skills y reglas; nombres únicos; que los `paths` de las
 * reglas coincidan con archivos reales; límites de tamaño; JSON de settings; rutas citadas que ya no
 * existen; líneas duplicadas entre instrucciones; y estima el contexto fijo frente al de bajo demanda
 * (aprox. caracteres / 4: es una estimación, no un recuento exacto de tokens).
 *
 * Solo módulos de Node, sin dependencias. Sale con código 1 si hay errores (los avisos no fallan).
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CLAUDE_DIR = path.join(ROOT, '.claude')
const errors = []
const warnings = []
const error = (message) => errors.push(message)
const warn = (message) => warnings.push(message)

const VALID_TOOLS = new Set(['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash', 'PowerShell', 'WebFetch', 'WebSearch', 'NotebookEdit', 'TodoWrite', 'Agent'])
const VALID_MODELS = new Set(['sonnet', 'opus', 'haiku', 'fable', 'inherit'])
const MAX_SKILL_DESCRIPTION = 1536
const MAX_SKILL_LINES = 500
const MAX_CLAUDE_MD_LINES = 200
const HEAVY_PATHS = ['./dist/**', './node_modules/**', './models-source/**', './public/models/**', './package-lock.json']
const tokens = (text) => Math.ceil(text.length / 4)
const rel = (file) => path.relative(ROOT, file).replaceAll('\\', '/')
const read = (file) => fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
const exists = (file) => fs.existsSync(file)

/** Frontmatter YAML mínimo: `clave: valor` y listas `- item`. Devuelve null si no empieza en la línea 1. */
function parseFrontmatter(text) {
  const lines = text.split('\n')
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end < 0) return null
  const data = {}
  let listKey = null
  for (const line of lines.slice(1, end)) {
    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && listKey) {
      data[listKey].push(item[1].replace(/^["']|["']$/g, ''))
      continue
    }
    const pair = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!pair) continue
    const value = pair[2].replace(/^["']|["']$/g, '')
    listKey = value === '' ? pair[1] : null
    data[pair[1]] = value === '' ? [] : value
  }
  return { data, body: lines.slice(end + 1).join('\n') }
}

function listFiles(dir, filter = () => true) {
  if (!exists(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(full, filter) : filter(full) ? [full] : []
  })
}

// ---- Archivos del proyecto (para validar `paths` y referencias) --------------------------------------------
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', 'test-results', 'playwright-report', 'models-source', 'models'])
function projectFiles(dir = ROOT) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED_DIRS.has(entry.name)) return []
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? projectFiles(full) : [rel(full)]
  })
}

function expandBraces(pattern) {
  const match = pattern.match(/\{([^{}]+)\}/)
  if (!match) return [pattern]
  return match[1].split(',').flatMap((option) => expandBraces(pattern.replace(match[0], option)))
}

function globToRegExp(glob) {
  let source = ''
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i]
    if (char === '*' && glob[i + 1] === '*') {
      const slash = glob[i + 2] === '/'
      source += slash ? '(?:.*/)?' : '.*'
      i += slash ? 2 : 1
    } else if (char === '*') source += '[^/]*'
    else if (char === '?') source += '[^/]'
    else source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${source}$`)
}

const FILES = projectFiles()
const matchesAny = (glob) => expandBraces(glob).some((pattern) => FILES.some((file) => globToRegExp(pattern).test(file)))

// ---- Carga y validación -------------------------------------------------------------------------------------
const report = { fixed: [], onDemand: [] }
const instructionTexts = [] // para detectar duplicados

// CLAUDE.md
const claudeMdPath = path.join(ROOT, 'CLAUDE.md')
if (!exists(claudeMdPath)) error('Falta CLAUDE.md en la raíz.')
else {
  const text = read(claudeMdPath)
  const lines = text.split('\n').length
  if (lines > MAX_CLAUDE_MD_LINES) error(`CLAUDE.md tiene ${lines} líneas (máximo recomendado ${MAX_CLAUDE_MD_LINES}).`)
  if (/^@\S+/m.test(text)) warn('CLAUDE.md usa @imports: se cargan siempre junto al archivo y no ahorran contexto.')
  report.fixed.push(['CLAUDE.md', tokens(text)])
  instructionTexts.push(['CLAUDE.md', text])
}
const localPath = path.join(ROOT, 'CLAUDE.local.md')
if (exists(localPath)) report.fixed.push(['CLAUDE.local.md', tokens(read(localPath))])

// Reglas
const ruleFiles = listFiles(path.join(CLAUDE_DIR, 'rules'), (f) => f.endsWith('.md'))
for (const file of ruleFiles) {
  const text = read(file)
  const fm = parseFrontmatter(text)
  const name = rel(file)
  const extra = fm ? Object.keys(fm.data).filter((key) => key !== 'paths') : []
  if (extra.length) warn(`${name}: campos de frontmatter ignorados por Claude Code (${extra.join(', ')}).`)
  const patterns = fm?.data.paths ?? []
  const list = Array.isArray(patterns) ? patterns : String(patterns).split(',').map((p) => p.trim())
  for (const pattern of list) if (!matchesAny(pattern)) warn(`${name}: el patrón «${pattern}» no coincide con ningún archivo.`)
  if (!list.length) warn(`${name}: sin \`paths\`: se carga siempre (coste fijo).`)
  const lines = text.split('\n').length
  if (lines > 60) warn(`${name}: ${lines} líneas (las reglas deben ser breves).`)
  ;(list.length ? report.onDemand : report.fixed).push([name, tokens(text)])
  instructionTexts.push([name, fm?.body ?? text])
}

// Skills
const skillDirs = fs.existsSync(path.join(CLAUDE_DIR, 'skills'))
  ? fs.readdirSync(path.join(CLAUDE_DIR, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory())
  : []
const skillNames = new Set()
for (const dir of skillDirs) {
  const file = path.join(CLAUDE_DIR, 'skills', dir.name, 'SKILL.md')
  if (!exists(file)) {
    error(`skills/${dir.name}: falta SKILL.md.`)
    continue
  }
  const text = read(file)
  const fm = parseFrontmatter(text)
  const label = `skills/${dir.name}`
  if (!fm) {
    error(`${label}: el frontmatter debe empezar en la primera línea con \`---\`.`)
    continue
  }
  if (fm.data.name !== dir.name) error(`${label}: \`name\` («${fm.data.name}») debe coincidir con la carpeta.`)
  if (skillNames.has(fm.data.name)) error(`${label}: nombre duplicado.`)
  skillNames.add(fm.data.name)
  const description = fm.data.description ?? ''
  if (!description) error(`${label}: falta \`description\`.`)
  if (description.length > MAX_SKILL_DESCRIPTION) error(`${label}: la descripción supera ${MAX_SKILL_DESCRIPTION} caracteres (se trunca).`)
  const lines = text.split('\n').length
  if (lines > MAX_SKILL_LINES) error(`${label}: ${lines} líneas (máximo ${MAX_SKILL_LINES}).`)
  if (fm.data['allowed-tools']) warn(`${label}: define allowed-tools; revísalo (concede permisos sin preguntar).`)
  if (/^!`/m.test(text)) warn(`${label}: contiene comandos \`!\`…\` que se ejecutan al cargar la skill.`)
  report.fixed.push([`${label} (descripción)`, tokens(`${fm.data.name} ${description}`)])
  report.onDemand.push([`${label} (cuerpo)`, tokens(fm.body)])
  instructionTexts.push([label, fm.body])
}

// Agentes
const agentFiles = listFiles(path.join(CLAUDE_DIR, 'agents'), (f) => f.endsWith('.md'))
const agentNames = new Set(agentFiles.map((f) => path.basename(f, '.md')))
const seenAgents = new Set()
for (const file of agentFiles) {
  const text = read(file)
  const fm = parseFrontmatter(text)
  const label = rel(file)
  if (!fm) {
    error(`${label}: frontmatter inválido o ausente.`)
    continue
  }
  const { name, description, tools, disallowedTools, model } = fm.data
  if (!name || !description) error(`${label}: \`name\` y \`description\` son obligatorios.`)
  if (name !== path.basename(file, '.md')) warn(`${label}: \`name\` («${name}») difiere del nombre de archivo.`)
  if (seenAgents.has(name)) error(`${label}: nombre de agente duplicado.`)
  seenAgents.add(name)
  if (model && !VALID_MODELS.has(model) && !model.startsWith('claude-')) error(`${label}: model «${model}» no válido.`)
  for (const entry of String(tools ?? '').split(/,(?![^(]*\))/).map((t) => t.trim()).filter(Boolean)) {
    const tool = entry.replace(/\(.*\)$/, '')
    if (!VALID_TOOLS.has(tool) && !tool.startsWith('mcp__')) error(`${label}: herramienta desconocida «${tool}».`)
    const spawn = entry.match(/^Agent\((.*)\)$/)
    for (const target of spawn ? spawn[1].split(',').map((s) => s.trim()) : []) {
      if (!agentNames.has(target)) error(`${label}: Agent(${target}) no existe.`)
    }
  }
  if (tools && disallowedTools) warn(`${label}: usa tools y disallowedTools a la vez.`)
  if (String(description ?? '').length > 450) warn(`${label}: descripción larga (${description.length} car.): ocupa contexto fijo.`)
  report.fixed.push([`${label} (descripción)`, tokens(`${name} ${description}`)])
  report.onDemand.push([`${label} (instrucciones)`, tokens(fm.body)])
}

// Settings
const settingsPath = path.join(CLAUDE_DIR, 'settings.json')
if (exists(settingsPath)) {
  try {
    const settings = JSON.parse(read(settingsPath))
    const deny = settings.permissions?.deny ?? []
    const missing = HEAVY_PATHS.filter((p) => !deny.includes(`Read(${p})`))
    if (missing.length) warn(`settings.json: sin Read deny para ${missing.join(', ')} (lecturas innecesarias posibles).`)
  } catch (cause) {
    error(`settings.json no es JSON válido: ${cause.message}`)
  }
} else warn('No existe .claude/settings.json.')

// Docs
const docFiles = listFiles(path.join(CLAUDE_DIR, 'docs'), (f) => f.endsWith('.md'))
for (const file of docFiles) {
  const text = read(file)
  const lines = text.split('\n').length
  if (lines > 130) warn(`${rel(file)}: ${lines} líneas (objetivo ≤ 120).`)
  report.onDemand.push([rel(file), tokens(text)])
  instructionTexts.push([rel(file), text])
}

// ---- Referencias a rutas que ya no existen ------------------------------------------------------------------
const ROOTS = ['.claude/', 'src/', 'tools/', 'e2e/']
const ROOT_FILES = new Set(['CLAUDE.md', 'index.html', 'playwright.config.js', 'vite.config.js', 'package.json'])
const optionalMentions = /public\/(robots|sitemap)/
for (const [source, text] of instructionTexts) {
  for (const match of text.matchAll(/`([^`\s]+)`/g)) {
    const ref = match[1].replace(/[.,;:]+$/, '')
    if (/[*<>{}|]/.test(ref) || optionalMentions.test(ref)) continue
    const isRoot = ROOTS.some((r) => ref.startsWith(r)) || ROOT_FILES.has(ref)
    if (isRoot && !exists(path.join(ROOT, ref))) warn(`${source}: la ruta «${ref}» no existe.`)
  }
}

// ---- Duplicados entre instrucciones -------------------------------------------------------------------------
const lineOwners = new Map()
for (const [source, text] of instructionTexts) {
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.length < 50 || line.startsWith('|') || line.startsWith('#') || line.startsWith('---')) continue
    const owners = lineOwners.get(line) ?? new Set()
    owners.add(source)
    lineOwners.set(line, owners)
  }
}
for (const [line, owners] of lineOwners) {
  if (owners.size > 1) warn(`Línea duplicada en ${[...owners].join(' y ')}: «${line.slice(0, 70)}…»`)
}

// ---- Informe ------------------------------------------------------------------------------------------------
const sum = (rows) => rows.reduce((total, [, n]) => total + n, 0)
const table = (rows) => rows.map(([name, n]) => `  ${String(n).padStart(5)}  ${name}`).join('\n')
console.log('Contexto FIJO (se carga en cada sesión), estimación ≈ caracteres/4:')
console.log(table(report.fixed))
console.log(`  ${String(sum(report.fixed)).padStart(5)}  TOTAL fijo\n`)
console.log('Contexto BAJO DEMANDA (solo al usarse o al tocar archivos coincidentes):')
console.log(table(report.onDemand))
console.log(`  ${String(sum(report.onDemand)).padStart(5)}  TOTAL bajo demanda (nunca se carga entero a la vez)\n`)
console.log(`Recursos: ${agentFiles.length} agentes · ${skillDirs.length} skills · ${ruleFiles.length} reglas · ${docFiles.length} documentos`)
for (const message of warnings) console.log(`AVISO  ${message}`)
for (const message of errors) console.log(`ERROR  ${message}`)
console.log(errors.length ? `\n${errors.length} error(es), ${warnings.length} aviso(s).` : `\nSin errores (${warnings.length} aviso(s)).`)
process.exit(errors.length ? 1 : 0)
