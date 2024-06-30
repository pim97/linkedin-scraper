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

    const pageTitle = $('title').text();
    const profileFirstName = $('meta[property="profile:first_name"]').attr('content');
    const profileLastName = $('meta[property="profile:last_name"]').attr('content');
    const profileDescription = $('meta[name="description"]').attr('content');
    const profileImageUrl = $('meta[property="og:image"]').attr('content');
    const profileUrl = $('meta[property="og:url"]').attr('content');

    // Extracting name and influencer icon
    const name = $('.top-card-layout__title').text().trim();
    const isInfluencer = $('.top-card__influencer-icon').length > 0;

    // Extracting location, follower count, and connection count
    const location = $('.profile-info-subheader').find('div.not-first-middot > span').first().text().trim();
    const followerCount = $('span:contains("followers")').text().trim();
    const connectionCount = $('span:contains("connections")').text().trim();

    // Extracting mutual connections
    const mutualConnections = [];
    $('.face-pile__image').each((index, element) => {
        const imageUrl = $(element).attr('data-delayed-url');
        mutualConnections.push(imageUrl);
    });


    // Extracting current company
    const currentCompany = $('a[data-section="currentPositionsDetails"]').find('.top-card-link__description').text().trim();

    // Extracting education details
    const educationDetails = $('a[data-section="educationsDetails"]').find('.top-card-link__description').text().trim();

    // Extracting personal website
    const personalWebsite = $('a[data-section="websites"]').find('.top-card-link__description').text().trim();

    const articles = [];

    $('section[data-section="articles"] ul li').each((index, element) => {
        const title = $(element).find('.base-main-card__title').text().trim();
        const url = $(element).find('.base-card__full-link').attr('href');
        const author = $(element).find('.base-main-card__subtitle a').text().trim();
        const date = $(element).find('.base-main-card__metadata-item').text().trim();

        articles.push({
            title,
            url,
            author,
            date
        });
    });

    const contributions = [];

    $('section[data-section="contributions"] ul.show-more-less__list li.contributions__list-item-wrapper').each((index, element) => {
        const title = $(element).find('.contribution-title-link').text().trim();
        const url = $(element).find('.contribution-title-link').attr('href');
        const description = $(element).find('.contribution-item p').text().trim();
        const timestamp = $(element).find('.contribution__time').text().trim();

        contributions.push({
            title,
            url,
            description,
            timestamp
        });
    });


    return {
        'title': pageTitle,
        'first_name': profileFirstName,
        'last_name': profileLastName,
        'description': profileDescription,
        'image_url': profileImageUrl,
        'profile_url': profileUrl,
        'name': name,
        'is_influencer': isInfluencer,
        'location': location,
        'follower_count': followerCount,
        'connection_count': connectionCount,
        'current_company': currentCompany,
        'education_details': educationDetails,
        'personal_website': personalWebsite,
        'articles': articles,
        'contributions': contributions,
        // 'mutual_connections': mutualConnections,
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

            const url = "https://www.linkedin.com/in/jamescaancbe/"

            const scrape = await scrappey.get({
                "url": url,
                "session": session.session,
            })

            const html = scrape.solution.response
            const innerText = scrape.solution.innerText

            fs.writeFileSync('linkedi-person.html', html)
            fs.writeFileSync('linnertext-person', innerText)

            // console.log(JSON.stringify(scrape.solution, undefined, 4))
            const data = parse(html);
            console.log(JSON.stringify(data, undefined, 4));

            await scrappey.destroySession({
                "session": session.session
            })
        } else {
            const html = fs.readFileSync('linkedin-person.html', 'utf8');
            const data = parse(html);
            console.log(JSON.stringify(data, undefined, 4));
        }

    } catch (error) {
        console.error(error);
    }
}

run();
