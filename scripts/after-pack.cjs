const fs = require('fs/promises')
const path = require('path')

const sourceFileNameFor = (platformName, archName) => {
  if (platformName === 'darwin' && archName === 'arm64') return 'ffmpeg-arm'
  if (platformName === 'darwin' && archName === 'x64') return 'ffmpeg-intel'
  if (platformName === 'win32' && archName === 'x64') return 'ffmpeg.exe'
  if (platformName === 'linux' && archName === 'x64') return 'ffmpeg-linux-x64'
  return null
}

const targetFileNameFor = (platformName) => (platformName === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')

function isPlatformCompatible(fileName, platformName, archName) {
  if (fileName.includes('darwin') && platformName !== 'darwin') return false
  if (fileName.includes('win32') && platformName !== 'win32') return false
  if (fileName.includes('linux') && platformName !== 'linux') return false

  if (fileName.includes('arm64') && archName !== 'arm64') return false
  if (fileName.includes('x64') && archName !== 'x64') return false
  if (fileName.includes('ia32') && archName !== 'ia32') return false

  return true
}

async function findNodeFiles(dir, basePath, platformName, archName) {
  const nodeFiles = []
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' && dir.includes('.pnpm')) continue
        if (!isPlatformCompatible(entry.name, platformName, archName)) continue
        const childFiles = await findNodeFiles(fullPath, basePath, platformName, archName)
        nodeFiles.push(...childFiles)
      } else if (entry.isFile() && entry.name.endsWith('.node')) {
        if (!isPlatformCompatible(entry.name, platformName, archName)) continue
        try {
          const realPath = await fs.realpath(fullPath)
          nodeFiles.push({ source: realPath, relative: path.relative(basePath, fullPath) })
        } catch {
          nodeFiles.push({ source: fullPath, relative: path.relative(basePath, fullPath) })
        }
      }
    }
  } catch {}
  return nodeFiles
}

async function copyNativeModules(context) {
  const projectDir = context.packager.projectDir
  const resourcesDir = context.packager.getResourcesDir(context.appOutDir)
  const unpackedDir = path.join(resourcesDir, 'app.asar.unpacked')
  const nodeModulesPath = path.join(projectDir, 'node_modules')
  const platformName = context.electronPlatformName
  const archName = String(context.arch)

  const nodeFiles = await findNodeFiles(nodeModulesPath, nodeModulesPath, platformName, archName)

  if (nodeFiles.length === 0) {
    console.log('[afterPack] No native modules (.node files) found in node_modules')
    return
  }

  console.log(`[afterPack] Found ${nodeFiles.length} native modules to copy`)

  for (const { source, relative } of nodeFiles) {
    const targetPath = path.join(unpackedDir, 'node_modules', relative)
    const targetDir = path.dirname(targetPath)

    try {
      await fs.mkdir(targetDir, { recursive: true })
      await fs.copyFile(source, targetPath)
      console.log(`[afterPack] Copied native module: ${relative}`)
    } catch (error) {
      console.warn(`[afterPack] Failed to copy native module ${relative}:`, error.message)
    }
  }
}

exports.default = async function afterPack(context) {
  await copyNativeModules(context)
  const platformName = context.electronPlatformName
  const archName = String(context.arch)
  const sourceFileName = sourceFileNameFor(platformName, archName)

  if (!sourceFileName) return

  const sourcePath = path.join(context.packager.projectDir, 'resources', 'ffmpeg', sourceFileName)
  const resourcesDir = context.packager.getResourcesDir(context.appOutDir)
  const targetDir = path.join(resourcesDir, 'app.asar.unpacked', 'resources', 'ffmpeg')
  const targetPath = path.join(targetDir, targetFileNameFor(platformName))

  try {
    await fs.access(sourcePath)
  } catch {
    console.warn(
      `[afterPack] optional bundled ffmpeg missing for ${platformName}-${archName}: ${sourcePath}. ` +
        'The package will be created without built-in MP4 export support.'
    )
    return
  }

  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.mkdir(targetDir, { recursive: true })
  await fs.copyFile(sourcePath, targetPath)

  if (platformName !== 'win32') {
    await fs.chmod(targetPath, 0o755)
  }

  console.log(`[afterPack] bundled ffmpeg ${sourceFileName} -> ${targetPath}`)
}
