const puppeteer = require('puppeteer');
const db = require('./models');

const crawler = async () => {
    await db.sequelize.sync();
    try {
        let browser = await puppeteer.launch({
            headless: false,
            args: ['--window-size=1920,1080', '--disable-notifications'],
        });
        let page = await browser.newPage();
        page.setViewport({
            width: 1080,
            height: 1080,
        });
        await page.goto('http://spys.one/free-proxy-list/KR/');
        const proxies = await page.evaluate(() => {
            const ips = Array.from(document.querySelectorAll('tr > td:first-of-type > .spy14')).map((v) => {
                return v.textContent.split('document.write')[0];
            });
            const types = Array.from(document.querySelectorAll('tr > td:nth-of-type(2)'))
                .slice(5, 35)
                .map((v) => {
                    return v.textContent.split(' ')[0];
                });
            const latencies = Array.from(document.querySelectorAll('tr > td:nth-of-type(6) .spy1')).map(
                (v) => v.textContent,
            );
            return ips.map((v, i) => {
                return {
                    ip: v,
                    type: types[i],
                    latency: latencies[i],
                };
            });
        });
        const filtered = proxies
            .filter((v) => {
                return v.type.startsWith('HTTP');
            })
            .sort((p, c) => {
                return p.latency - c.latency;
            });
        Promise.all(
            filtered.map(async (v, i) => {
                await db.Porxy.create({
                    ip: v.ip,
                    type: v.type,
                    latency: v.latency,
                });
            }),
        );
        const fastestIP = await db.Porxy.findOne({
            where: { id: 88 },
        });
        await page.close();
        await browser.close();
        // console.log(filtered);
        // console.log(filtered[2].ip);
        browser = await puppeteer.launch({
            headless: false,
            args: ['--window-size=1920,1080', '--disable-notifications', `--proxy-server=${fastestIP.ip}`],
        });
        // multi browser
        const context = await browser.createIncognitoBrowserContext();
        await browser.browserContexts();
        const contextPage = await context.newPage();
        await contextPage.goto(
            'https://search.naver.com/search.naver?sm=top_sug.pre&fbm=0&acr=1&acq=%EB%82%B4+%EC%95%84%EC%9D%B4&qdt=0&ie=utf8&query=%EB%82%B4+%EC%95%84%EC%9D%B4%ED%94%BC+%EC%A3%BC%EC%86%8C+%ED%99%95%EC%9D%B8',
        );
        // multi browser 끝
        page = await browser.newPage();
        await page.goto(
            'https://search.naver.com/search.naver?sm=top_sug.pre&fbm=0&acr=1&acq=%EB%82%B4+%EC%95%84%EC%9D%B4&qdt=0&ie=utf8&query=%EB%82%B4+%EC%95%84%EC%9D%B4%ED%94%BC+%EC%A3%BC%EC%86%8C+%ED%99%95%EC%9D%B8',
        );
    } catch (error) {
        console.log(error);
    }
};

crawler();
