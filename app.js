import Koa from 'koa'
import { koaBody } from 'koa-body'
import koaStatic from 'koa-static'
import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk';
import koaCors from 'koa-cors'
import koaRouter from 'koa-router'

const app = new Koa()
const router = new koaRouter()

const uploadHost = `http://localhost:3000/`;
const uploadRealHost = `http://localhost:3000/uploads/`;

app.use(koaCors())

app.use(koaBody({
    formidable: {
        uploadDir: path.resolve('./uploads')
    },
    multipart: true
}))

app.use(koaStatic(path.resolve('./uploads')))



router.post('/upload', (ctx, next) => {
    //如果没上传文件就不做处理
    if (!ctx.request.files?.f1) {
        return
    }
    let file = ctx.request.files.f1
    let result = []

    //处理多文件
    if (file && Array.isArray(file)) {
        file.forEach(item => {
            const orginName = item.originalFilename
            const filePath = item.filepath
            const newFilename = item.newFilename
            const extArr = orginName.split('.')
            const ext = extArr[extArr.length - 1]

            fs.renameSync(filePath, `${filePath}.${ext}`)
            result.push(`${uploadHost}${newFilename}.${ext}`)
        })
    } else {
        const orginName = file.originalFilename
        const filePath = file.filepath
        const newFilename = file.newFilename
        const extArr = orginName.split('.')
        const ext = extArr[extArr.length - 1]

        fs.renameSync(filePath, `${filePath}.${ext}`)
        result.push(`${uploadHost}${newFilename}.${ext}`)
    }



    ctx.body = {
        data: result
    }
})


router.post('/bigUpload', (ctx) => {
    let body = ctx.request.body
    let files = ctx.request.files ? ctx.request.files.f1 : []
    let result = []
    let fileToken = ctx.request.body.token
    let fineIndex = ctx.request.body.index

    if (files && !Array.isArray(files)) {//单文件上传容错
        files = [files];
    }

    files && files.forEach(item => {
        const filePath = item.filepath
        const section = `${fileToken}-${fineIndex}`
        fs.renameSync(filePath, path.resolve('./uploads', section));
        result.push(`${uploadHost}${section}`)
    })

    if (body.type === 'merge') {
        let token = body.token
        let filename = +new Date() + '_' + body.filename
        let chunkCount = body.chunkCount

        let folder = path.resolve('./uploads')

        let writeStream = fs.createWriteStream(path.join(folder, filename))
        let cindex = 0

        function fnMergeFile() {
            let fname = path.resolve(folder, `${token}-${cindex}`)
            let readStream = fs.createReadStream(fname)
            readStream.pipe(writeStream, { end: false })
            readStream.on('end', () => {
                fs.unlink(fname, (err) => {
                    if (err) {
                        throw err
                    }
                })
                if (cindex + 1 < chunkCount) {
                    cindex += 1
                    fnMergeFile()
                }
            })
        }
        fnMergeFile()
        result.push(`${uploadHost}${filename}`)
    }

    ctx.body = {
        f1: result
    }
})


app.use(router.routes(), router.allowedMethods())

app.listen(3000, () => {
    console.log(chalk.blue.bold('server on localhost:3000!'))
})