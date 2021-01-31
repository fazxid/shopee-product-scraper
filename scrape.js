/*
 * Shopee Product Scraper
 * @author Fazxid | https://github.com/fazxid/shopee-product-scraper
 */

const path = require('path');
const { exit } = require('process');
const shopeeScraper = require('./lib/node-shopee-scraper');

const scrape = new shopeeScraper({
    mainUrl : 'https://shopee.co.id/',
    userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36',
    savePath : path.join(__dirname, './storage/'),
    headless : true,
    extract : ['data','image']

})

if(process.argv[2]!==undefined) {

    (async () => {
        try {
            let response = await scrape.go(process.argv[2].toString())
            console.log(`\n\n`)
            console.log(response)
            exit()
    
        } catch (err) {
            console.log(err)

        }

    })();

} else {
    console.log(`Argument not valid`)
}