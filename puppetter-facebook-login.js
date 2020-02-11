const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

const crawler = async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--window-size=1920,1080', '--disable-notifications'],
        });
        const page = await browser.newPage();
        page.setViewport({
            width: 1080,
            height: 1080,
        });
        await page.goto('https://www.facebook.com/');
        const id = process.env.ID;
        const pass = process.env.PASS;
        // evalute() 를 활용한 방법
        // await page.evaluate(
        //     (id, pass) => {
        //         document.getElementById('email').value = id;
        //         document.getElementById('pass').value = pass;
        //         document.getElementById('loginbutton').click();
        //     },
        //     id,
        //     pass,
        // );
        // evalute() 를 활용한 방법 끝

        // page API 를 활용한 방법
        await page.type('#email', id);
        await page.type('#pass', pass);
        await page.hover('#loginbutton');
        await page.waitFor(3000);
        await page.click('#loginbutton');
        await page.waitForResponse((res) => {
            return res.url().includes('login_attempt');
        });
        await page.waitFor(3000);
        // await page.keyboard.press('Escape'); // '--disable-notifications' 옵션으로 확인
        await page.click('#userNavigationLabel');
        await page.waitForSelector('._54ni:last-child');
        await page.click('._54ni:last-child');
        // page API 를 활용한 방법 끝

        // await page.close();
        // browser.close();
    } catch (error) {
        console.log(error);
    }
};

crawler();
