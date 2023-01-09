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

app.use(router.routes(), router.allowedMethods())

app.listen(3000, () => {
    console.log(chalk.blue.bold('server on localhost:3000!'))
})