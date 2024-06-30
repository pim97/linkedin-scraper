const Scrappey = require('scrappey-wrapper');
const fs = require('fs');
const cheerio = require('cheerio');

// Replace the following details with your own details
const SCRAPPEY_API_KEY = 'API_KEY';

// Create an instance of Scrappey
const scrappey = new Scrappey(SCRAPPEY_API_KEY);

// Optional to add proxy, one is added if not added
const PROXY = 'http://user:pass@host:port'

function parse(html) {
    const $ = cheerio.load(html);

    function extractData($, testId) {
        const element = $(`div[data-test-id="${testId}"] dd`);
        return element.length ? element.text().trim() : '';
    }

    function extractLocations($) {
        const locations = [];
        $('ul[data-impression-id="org-locations_show-more-less"] li').each((i, el) => {
            const address = $(el).find('div[id^="address-"] p').map((i, p) => $(p).text().trim()).get().join(', ');
            if (address) {
                locations.push(address);
            }
        });
        return locations;
    }

    // Function to extract employee data
    function extractEmployees($) {
        const employees = [];
        $('section[data-test-id="employees-at"] ul li a').each((i, el) => {
            const name = $(el).find('h3.base-main-card__title').text().trim();
            const title = $(el).find('h4.base-main-card__subtitle').text().trim();
            const profileUrl = $(el).attr('href');
            if (name && title) {
                employees.push({ name, title, profileUrl });
            }
        });
        return employees;
    }

    // Function to extract the "About us" section
    function extractAboutUs() {
        const aboutSection = $('section[data-test-id="about-us"]');
        const description = aboutSection.find('p[data-test-id="about-us__description"]').text().trim();
        const website = aboutSection.find('a[data-tracking-control-name="about_website"]').attr('href');

        return {
            description,
            website,
        };
    }

    function extractJobLinks($) {
        const jobLinks = [];

        $('div[class^="flex-1"]').each((index, element) => {
            $(element).find('ul.my-1 li.tw-link-column-item a').each((i, el) => {
                const jobTitle = $(el).text().trim();
                const jobUrl = $(el).attr('href');
                jobLinks.push({ title: jobTitle, url: jobUrl });
            });
        });

        return jobLinks;
    }

    const founded = extractData($, 'about-us__foundedOn');
    const locations = extractLocations($);
    const employees = extractEmployees($);
    const aboutUs = extractAboutUs($);
    const industry = extractData($, 'about-us__industry');
    const companySize = extractData($, 'about-us__size');
    const headquarters = extractData($, 'about-us__headquarters');
    const organizationType = extractData($, 'about-us__organizationType');
    const jobLinks = extractJobLinks($);

    return {
        industry,
        companySize,
        headquarters,
        organizationType,
        locations,
        employees,
        founded,
        aboutUs,
        // jobLinks,
    }
}

async function run() {
    try {

        const loadFromFile = false;

        if (!loadFromFile) {

            /**
             * Creates a session
             */
            const session = await scrappey.createSession({
                // proxy: PROXY //optional, resi proxy by default provided by Scrappey
            })

            const url = "http://www.linkedin.com/company/gigxr"

            const scrape = await scrappey.get({
                "url": url,
                "session": session.session,
            })

            const html = scrape.solution.response
            const innerText = scrape.solution.innerText

            fs.writeFileSync('linkedin.html', html)
            fs.writeFileSync('linnertext', innerText)

            // console.log(JSON.stringify(scrape.solution, undefined, 4))
            const data = parse(html);
            console.log(JSON.stringify(data, undefined, 4));

            /**
             * Response is
             * 
             * {
                "industry": "Software Development",
                "companySize": "11-50 employees",
                "headquarters": "Los Angeles, California",
                "organizationType": "Privately Held",
                "locations": [
                    "1318 Pacific Avenue, Venice, Los Angeles, California 90291, US",
                    "Epworth House, 25 City Rd, Shoreditch, London, Greater London EC1Y 1AA, GB"
                ],
                "employees": [
                    {
                        "name": "Michael Tessler",
                        "title": "Managing Partner at True North Advisory",
                        "profileUrl": "https://www.linkedin.com/in/michaeltessler1?trk=org-employees"     
                    },
                    {
                        "name": "Dave Lin",
                        "title": "VP of Engineering @ GIGXR | Immersive Solutions, Mixed Reality",        
                        "profileUrl": "https://www.linkedin.com/in/davelin10017?trk=org-employees"        
                    },
                    {
                        "name": "John Payne",
                        "title": "CEO | Exec Chairman |  Advisor | Startups | Jumpstarts",
                        "profileUrl": "https://www.linkedin.com/in/johnpayne?trk=org-employees"
                    },
                    {
                        "name": "David King Lassman",
                        "title": "Founder at GIGXR",
                        "profileUrl": "https://www.linkedin.com/in/dkl64?trk=org-employees"
                    }
                ],
                "founded": "2019",
                "aboutUs": {
                    "description": "At GIGXR we have a proven track record for recognizing key problems in education and training and unlocking the potential of extended reality (XR) technologies to solve them. \n\nWe are an energetic and responsive company creating innovative applications to 
            solve perennial problems around visualization and 3D understanding in the education and training market. \n\nOur flagship applications, HoloPatient and HoloHuman, facilitate clinical skills practice and anatomy learning. Designed to simulate, enhance and extend already existing pedagogical approaches, our tools support active and collaborative learning, simulation and visualisation of 3D concepts. \n\nConnected and powered by our proprietary management platform, these applications provide the ultimate visual tools for education and training in medical, nursing, health science, and anatomy ideal for schools in higher education, vocational education, hospitals, industry, government and college prep markets.",
                    "website": "https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fwww%2Egigxr%2Ecom%2F&urlhash=PFoQ&trk=about_website"
                }
            }
             */

            await scrappey.destroySession({
                "session": session.session
            })
        } else {
            const html = fs.readFileSync('linkedin.html', 'utf8');
            const data = parse(html);
            console.log(JSON.stringify(data, undefined, 4));
        }

    } catch (error) {
        console.error(error);
    }
}

run();