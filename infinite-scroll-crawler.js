const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');

const csv = fs.readFileSync('./csv/data.csv');
const records = parse(csv.toString('utf-8'));

fs.readdir('images', (err) => {
    if (err) {
        fs.mkdirSync('images');
    }
});

const crawler = async () => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto('https://unsplash.com/');
        let result = [];

        while (result.length <= 5) {
            const images = await page.evaluate(() => {
                window.scrollTo(0, 0);
                const srcs = [];
                const imgEl = document.querySelectorAll('.IEpfq');
                console.log(imgEl);
                if (imgEl.length) {
                    imgEl.forEach((v) => {
                        let src = v.querySelector('img').src;
                        if (src) {
                            srcs.push(src);
                        }
                        v.parentElement.removeChild(v);
                    });
                }
                window.scrollBy(0, 100);
                return srcs;
            });
            result = result.concat(images);
            await page.waitForSelector('.IEpfq');
            console.log('엘리먼트 로딩!!! 현재 src.length: ', result.length);
        }
        result.forEach(async (src) => {
            console.log(src.replace(/\?.*?$/, ''));
            const image = await axios.get(src.replace(/\?.*?$/, ''), {
                responseType: 'arraybuffer',
            });
            fs.writeFileSync(`./images/${new Date().getTime()}.jpeg`, image.data);
        });
        // console.log(result);
        await page.close();
        await browser.close();
    } catch (error) {
        console.log(error);
    }
};

crawler();
