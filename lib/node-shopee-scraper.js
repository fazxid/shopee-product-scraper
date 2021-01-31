/*
 * Shopee Product Scraper
 * @author Fazxid | https://github.com/fazxid/shopee-product-scraper
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { exit } = require('process');
const puppeteer = require('puppeteer')
const fsm = require('./filesystem')

module.exports = class shopeeScraper {

    constructor(config) {
        this.mainUrl = config.mainUrl
        this.userAgent = config.userAgent
        this.savePath = config.savePath
        this.headless = config.headless===undefined ? true : config.headless
        this.urlStreamImage = 'https://cf.shopee.co.id/file/'
        this.extract = config.extract
    }

    productUrl = []
    productDetail = []

    async go(store) {

        await fsm.createDirectory(this.savePath+store)
        let main = await this.main(store)
        console.log(main)

        if (Array.isArray(main.product)) this.productUrl.push(...main.product)        

        if (main.pagination.length>=1) {
            
            let pagi=1
            let pagiLength = main.pagination.length
            while (pagi < pagiLength ) {
                let page = await this.pages(store, pagi)

                console.log(page)

                if (parseInt(page.pagination[page.pagination.length-1]) > pagiLength) pagiLength++

                if (Array.isArray(page.product)) this.productUrl.push(...page.product)       

                pagi++;
            
            }
        }

        for await (let [key, url] of this.productUrl.entries()) {
            
            let urlApi = this.createUrlApi(url)

            if (urlApi!==false) {

                console.log(`${key+1}|${this.productUrl.length} GET ${urlApi}`)

                let detail = await this.getItem(urlApi)
                this.productDetail.push(detail)
            }                

        }




        if (this.extract.indexOf('data')!==-1) await this.extractData(store, this.productDetail)
        if (this.extract.indexOf('image')!==-1)  await this.extractImage(store, this.productDetail)

        return {
            status: 'Finish :-)',
            dataExtract: this.savePath+store
        }

    }

    createUrlApi(url) {

        let params = url.split('.')
        let shopid = params[params.length-2]
        let itemid = params[params.length-1]

        if (shopid===undefined || itemid===undefined) return false
        else return `https://shopee.co.id/api/v2/item/get?itemid=${itemid}&shopid=${shopid}`

    }

    async main(store) {
        if (store===undefined) return false

        let url = this.mainUrl + store.trim()
        console.log(`\nPage #1 : ${url}`)

        let pagination = []
        let product = []

        await puppeteer.launch({
                devtools: false,
                headless: this.headless
            })
            .then(async browser => {
                let page = await browser.newPage()
                await page.setUserAgent(this.userAgent)
                await page.goto(url, {waitUntil: 'networkidle2'}).then(function () {
                    return page.content()
                })
                .then(html => {

                    let $ = cheerio.load(html)
                    let title = $('title')
                    console.log(`Site Title : ${title.text()}`)
                    
                    $('.shop-search-result-view__item').each(function (i, elem) {
                        product.push($(this).find('a').attr('href'))
                    })       

                    $('.shopee-page-controller > button[class=shopee-button-no-outline]').each(function (i, elem) {
                        pagination.push($(this).text().trim())                
                    })

                })               

                await browser.close()

            }).catch(console.error)
            
        return {product:product, pagination:pagination}

    }
    
    async pages(store, page) {

        let pagination = []
        let product=[]
        let url = this.mainUrl + store + '?page=' + page + '&sortBy=pop'

        console.log(`Page #${page+1} : ${url}`)

        await puppeteer.launch({
                devtools: false,
                headless: this.headless
            })
            .then(async browser => {
                let page = await browser.newPage()
                await page.setUserAgent(this.userAgent)
                await page.goto(url, {waitUntil: 'networkidle2'}).then(function () {
                    return page.content()
                })
                .then(html => {

                    let $ = cheerio.load(html)
                    let title = $('title')
                    console.log(`Site Title : ${title.text()}`)
                    
                    $('.shop-search-result-view__item').each(function (i, elem) {
                        product.push($(this).find('a').attr('href'))
                    })       

                    $('.shopee-page-controller > button[class=shopee-button-no-outline]').each(function (i, elem) {
                        pagination.push($(this).text().trim())                
                    })

                })               

                await browser.close()

            }).catch(console.error)

        return {product:product, pagination:pagination}

    }

    async getItem(url) {

        let response = await axios(url, {
            method: 'get',
            withCredentials: true,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9,id;q=0.8,ms;q=0.7',
                'User-Agent': this.userAgent
            }
        }).then((res) => {
            return res.data
        }, (err) => {
            console.log(`ERR - ${url}`)
            return err.toString()
        }) 

        return response

    }

    async extractImage(store, items) {

        if (Array.isArray(items)) {

            console.log(`\n\n# DOWNLOAD IMAGE -> ${this.savePath}${store}/images`)

            for await(let [key, item] of items.entries()) {

                console.log(`${key+1}/${items.length} DOWNLOAD IMAGE - ${item.item.name}`)

                if (typeof item.item.images==='object') {

                    for await(let [key, value] of item.item.images.entries()) {                        

                        let fileName = fsm.validateFileName(item.item.name) + '-img-' + key + '.jpg'
                        let fileStream = await fsm.writeStream(`${this.savePath}${store}/images/${fileName}`)
                        let urlStreamImage = this.urlStreamImage + value

                        let getImage = await axios({
                            url : urlStreamImage,
                            method: 'GET',
                            responseType: 'stream'
                        })

                        getImage.data.pipe(fileStream)

                        new Promise((resolve, reject) => {
                            fileStream.on('finish', resolve)
                            fileStream.on('error', reject)
                        })

                    }

                }                               
                
            }


        }

    }

    async extractData(store, items) {

        if (Array.isArray(items)) {

            console.log(`\n\n# EXTRACT DATA -> ${this.savePath}${store}/data`)

            for await(let [key, item] of items.entries()) {

                let itemData, fileName, fileExt
                
                if(typeof item === 'object') {
                    console.log(item.item.name)
                    itemData = JSON.stringify(item, null, 4)
                    fileName = fsm.validateFileName(item.item.name)                
                    fileExt = '.json'

                } else {
                    itemData = item.toString()
                    fileName = key
                    fileExt = '.log'

                }                 

                await fsm.writeFile(`${this.savePath}${store}/data/${fileName}${fileExt}`, itemData, 'utf8')
                
            }

        }

    }

}




