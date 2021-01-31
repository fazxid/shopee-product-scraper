# Shopee Product Scraper

Scrape Data & Images From Marketplace Shopee

## Installation

```bash
$ git clone https://github.com/fazxid/node-google-translate
$ npm install
```

## Example

```js
const shopeeScraper = require('./lib/node-shopee-scraper');

const scrape = new shopeeScraper({
    mainUrl : 'https://shopee.co.id/',
    userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36',
    savePath : path.join(__dirname, './storage/'),
    headless : true,
    extract : ['data','image']

})

```

## Command

node scrape '{storename}'

```bash
$ node scrape 'samsung.official'
```

## License

MIT
