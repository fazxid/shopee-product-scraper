/*
 * Shopee Product Scraper
 * @author Fazxid | https://github.com/fazxid/shopee-product-scraper
 */

const fs = require('fs')

module.exports = {

    async createDirectory(path) {
        let prefix = ['images','data','doc']
        for await(let name of prefix) {
            await fs.mkdirSync(`${path}/${name}`, {recursive: true}, (err) => {
                if (err) throw err
            })
        }
    },
        
    async writeFile(path, data, encode='utf8') {
        await fs.writeFileSync(path, data, encode, (err) => {
            if (err) throw err
            return true
        })
    },

    async writeStream(path) {
        return await fs.createWriteStream(path, (err) => {
            if (err) throw err
        })
    },

    async readFile(path, encode='utf8') {
        return await fs.readFileSync(path, function (err, data) {
            if (err) throw err
            return data
        })
    },

    validateFileName(str) {
        return str.replace(/[^a-zA-Z0-9\-]/gi, '')
    }

}