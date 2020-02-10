const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const fs = require('fs');
const puppetter = require('puppeteer');
const axios = require('axios');

const csv = fs.readFileSync('./csv/data.csv');
const records = parse(csv.toString('utf-8'));

console.log(records.entries());

const crawler = async () => {
    // const browser = await puppetter.launch({ headless: process.env.NODE_ENV === 'production' });
    try {
        // 브라우저를 실행하고
        const browser = await puppetter.launch({ headless: false });

        const result = [];

        /* 
        // Promise.all() 방식 - 여러개의 탭을 동시에 open. 하지만 순서를 보장하지 못함.
        await Promise.all(
            records.map(async (row, idx) => {
                // 읽어온 csv 로 맵을 돌려서
                try {
                    const page = await browser.newPage(); // 행의 갯수 만큼 탭을 열고
                    page.setUserAgent(
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
                    );
                    await page.goto(row[1]); // 탭별로 각 링크로 이동하고

                    // 방법 1
                    // const scoreEl = await page.$('.score.score_left .star_score'); // page.$() 인자에 선택자를 넣어서 원하는 element 를 반환받고
                    // if (scoreEl) {
                    //     const text = await page.evaluate((tag) => {
                    //         // page.evalute(callback, element); 로 DOM 에 접근해 text 를 가져옴. - 두번째 인자로 넣어주는 element 를 콜백의 인자로 받는게 사용법!
                    //         return tag.textContent;
                    //     }, scoreEl);
                    //     console.log(`${row[0]}의 평점: ${text.trim()}`);
                    //     result[idx] = [row[0], row[1], text.trim()];
                    // }
                    // 방법 1 끝

                    // 방법 2
                    // const text = await page.evaluate(() => {
                    //     const score = document.querySelector('.score.score_left .star_score'); // document 객체를 쓸 수 있음. +ㅁ+)...
                    //     if (score) {
                    //         return score.textContent;
                    //     }
                    // });
                    // if (text) {
                    //     console.log(`${row[0]}의 평점: ${text.trim()}`);
                    //     result[idx] = [row[0], row[1], text.trim()];
                    // }
                    // 방법 2 끝 - 나도 이게 더 깔끔하고 좋은 것 같다. 만약 엘리먼트를 여러개 가져와야 한다고 해도 그렇고...

                    await page.close(); // 탭닫고
                } catch (error) {
                    console.log(error);
                }
            }),
        );
        // Promise.all() 방식 끝.
        */

        // for...of 방식
        const page = await browser.newPage();

        for (const [idx, row] of records.entries()) {
            page.setUserAgent(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
            );
            await page.goto(row[1]);
            console.log(await page.evaluate('navigator.userAgent'));
            const text = await page.evaluate(() => {
                const score = document.querySelector('.score.score_left .star_score');
                if (score) {
                    return score.textContent;
                }
            });
            if (text) {
                console.log(`${row[0]}의 평점: ${text.trim()}`);
                result[idx] = [row[0], row[1], text.trim()];
                console.log(idx);
            }
            await page.waitFor(3000); // 페이지별로 3초 대기... (사람이 사용하는 것 처럼 =ㅅ=...)
        }
        await page.close();
        // for...of 방식 끝

        await browser.close(); // 브라우저 닫고 끝.

        const str = stringify(result);
        fs.writeFileSync('./csv/result.csv', str);
    } catch (error) {
        console.log(error);
    }
};

crawler();
