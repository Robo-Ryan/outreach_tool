const { chromium } = require('playwright');
const ExcelJS = require('exceljs');

const SELECTORS = {
    LOGIN_EMAIL_INPUT: 'input[id="email"]',
    LOGIN_PASSWORD_INPUT: 'input[id="pass"]',
    LOGIN_BUTTON: 'button[name="login"]',
    MESSAGE_BUTTON: 'span:has-text("Message")',
    MESSAGE_BOX: 'p[class="xat24cr xdj266r"]',
    MESSAGE_BOX_CLOSE: `//div[@aria-label='Close chat']//*[name()='svg']`,
    MIN_WAIT_TIME: 5,
    MAX_WAIT_TIME: 10, 
    MINUTE: 60*1000
};

async function loginToFacebook(page, email, password) {
    await page.goto("https://www.facebook.com");
    await page.fill(SELECTORS.LOGIN_EMAIL_INPUT, email);
    await page.fill(SELECTORS.LOGIN_PASSWORD_INPUT, password);
    await Promise.all([
        page.waitForNavigation(), 
        page.click(SELECTORS.LOGIN_BUTTON) 
    ]);
}

async function sendMessageToUser(page, url, message) {
    await page.goto(url);
    await page.waitForSelector(SELECTORS.MESSAGE_BUTTON);
    await page.click(SELECTORS.MESSAGE_BUTTON);
    await page.waitForSelector(SELECTORS.MESSAGE_BOX);
    await page.click(SELECTORS.MESSAGE_BOX);
    await page.keyboard.type(`${message}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await page.waitForSelector(SELECTORS.MESSAGE_BOX_CLOSE);
    await page.click(SELECTORS.MESSAGE_BOX_CLOSE);
    const wait = randomInteger() * SELECTORS.MINUTE
    console.log('waiting', (wait/SELECTORS.MINUTE), 'minutes before next outreach')
    await page.waitForTimeout(wait);
}

async function processWorkbook(page, workbook) {
    const worksheet = workbook.getWorksheet(1); 

    for (let i = 2; i <= worksheet.actualRowCount; i++) {
        const url = worksheet.getCell(`A${i}`).text;
        const message = worksheet.getCell(`B${i}`).text;
        await sendMessageToUser(page, url, message);
    }
}

function randomInteger() {
  return Math.floor(Math.random() * (SELECTORS.MAX_WAIT_TIME - SELECTORS.MIN_WAIT_TIME + 1)) + SELECTORS.MIN_WAIT_TIME;
}

async function start() {
    const email = process.argv[2];
    const password = process.argv[3];
    const excelFilePath = process.argv[4] || 'input.xlsx'

    if (!email || !password) {
        console.error("Usage: node script.js <email> <password>");
        return;
    }

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    
    try {
        const page = await context.newPage();
        await loginToFacebook(page, email, password);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelFilePath);
        await processWorkbook(page, workbook);
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await browser.close();
    }
}

start();


