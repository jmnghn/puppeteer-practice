const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');

const csv = fs.readFileSync('./csv/data.csv');
const records = parse(csv.toString('utf-8'));

fs.readdir('screenshot', (err) => {
    if (err) {
        fs.mkdirSync('screenshot');
    }
});
fs.readdir('poster', (err) => {
    if (err) {
        fs.mkdirSync('poster');
    }
});

const csvResult = [];

const crawler = async () => {
    try {
        const browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production',
            args: ['--window-size=1920,1080'],
        });
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        page.setUserAgent(
            '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36"',
        );

        for (const [idx, record] of records.entries()) {
            await page.goto(record[1]);
            const result = await page.evaluate(() => {
                const scoreEl = document.querySelector('.score.score_left .star_score');
                let score = '';
                if (scoreEl) {
                    score = scoreEl.textContent;
                }
                const posterEl = document.querySelector('.poster img');
                let poster = '';

                if (posterEl) {
                    poster = posterEl.src;
                }

                return {
                    score,
                    poster,
                };
            });

            if (result.score) {
                console.log(`${idx}. ${record[0]}의 평점 ${result.score.trim()}`);
                csvResult[idx] = [record[0], record[1], result.score.trim()];
            } else {
                csvResult[idx] = [];
            }
            if (result.poster) {
                // 풀페이지 스크린 샷
                page.screenshot({
                    path: `./screenshot/${record[0]}.png`,
                    fullPage: true,
                });
                // 클립 영역 스크린 샷
                // await page.screenshot({
                //     path: `./screenshot/${record[0]}.png`,
                //     clip: {
                //         x: 100,
                //         y: 100,
                //         width: 100,
                //         height: 100,
                //     },
                // });
                console.log(result.poster);
                const posterResult = await axios.get(result.poster.replace(/\?.*?$/, ''), {
                    responseType: 'arraybuffer',
                });
                fs.writeFileSync(`./poster/${record[0]}.jpg`, posterResult.data);
            }
            // await page.waitFor(1000);
        }
        await page.close();
        await browser.close();

        const str = stringify(csvResult);
        fs.writeFileSync('./csv/result2.csv', str);
    } catch (error) {
        console.log(error);
    }
};

crawler();
