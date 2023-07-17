import { glob } from 'glob'
import sharp from 'sharp'
import fs from 'fs'

const out = 'out' as const

const { width, cwd } = (() => {
    const args = process.argv;

    const widthIndex = args.findIndex(arg => arg === '-w' || arg === '--width')
    const widthRaw = widthIndex !== -1 ? Number(args.at(widthIndex + 1)) : NaN
    const width = isNaN(widthRaw) ? 1024 : widthRaw 

    if (isNaN(widthRaw)) {
        console.log('Width not provided using default which is 1024, pass -w or --width to define it')
    }

    const pathIndex = args.findIndex(arg => arg === '-p' || arg === '--path')
    const path = pathIndex !== -1 ? args.at(pathIndex + 1) : ''

    if (!path) {
        throw new Error('Path not provided, pass -p or --path to define it')
    }

    return {
        width,
        cwd: path.at(-1) === '/' ? path : `${path}/`
    }
})();

(async () => {
    if (fs.existsSync(out)) {
        console.log('"out" directory already exist - remove it before running the script')

        return
    }

    console.log('Creating "out" directory...')
    fs.mkdirSync(out)

    const folders = await glob('**/', { cwd })
    console.log('Creating directories...')
    folders.forEach(folder => {
        if (folder === '.') {
            return
        }

        console.log(`${folder} directory created`)
        fs.mkdirSync(`${out}/${folder}`)
    })

    const images = await glob('**/*.{png,jpeg,jpg,webp}', { cwd })

    console.log('Resizing files...')
    await Promise.all(images.map(async image => {
        const filePath = `${cwd}/${image}`
        const meta = await sharp(filePath).metadata()
        const height = Math.floor((width / (meta.width ?? 0)) * (meta.height ?? 0))
        await sharp(filePath)
            .resize(width, height)
            .toFile(`${out}/${image}`)
        console.log(`${image} image resized`)
    }))

    console.log('✨ Done!')
})()