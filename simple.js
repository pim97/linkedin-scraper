const Scrappey = require('scrappey-wrapper');

// Replace the following details with your own details
const SCRAPPEY_API_KEY = 'API_KEY';

// Create an instance of Scrappey
const scrappey = new Scrappey(SCRAPPEY_API_KEY);

async function run() {
    try {

        const scrape = await scrappey.get({
            "url": "http://www.linkedin.com/company/gigxr",
            "session": session.session,
        })

        console.log(JSON.stringify(scrape.solution, undefined, 4))

    } catch (error) {
        console.error(error);
    }
}

run();