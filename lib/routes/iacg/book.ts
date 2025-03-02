import { Route } from '@/types';
import got from '@/utils/got';
import cache from '@/utils/cache';
import { config } from '@/config';
import NotFoundError from '@/errors/types/not-found';
import InvalidParameterError from '@/errors/types/invalid-parameter';
import { load } from 'cheerio';

export const route: Route = {
    path: '/book/:category/page/:page',
    parameters: {
        category: '分类，默认为每日一本',
        page: '页码，默认为 1',
    },
    categories: ['blog'],
    example: '/book/day-book',
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['b.iacg.site'],
            target: '/book',
        },
        {
            source: ['b.iacg.site'],
            target: '/book/:category',
        },
    ],
    name: '一本',
    maintainers: ['LonelySteve'],
    handler,
};

async function handler(ctx) {
    const category = ctx.req.param('category') ?? 'day-book';
    const page = ctx.req.param('page') ?? 'page';
    const root = 'https://b.iacg.site';
    const path = `${root}/book/${category}/page/${page}`;

    const response = await cache.tryGet(path, async () => await got(path), config.cache.routeExpire, false);
    if (response === null) {
        throw new NotFoundError(`NotFound: iacg.site is not available.`);
    }
    if (response.data.length < 1) {
        throw new InvalidParameterError(`Invalid Response.`);
    }

    const html = response.data;

    const $ = load(html);

    const items = $('a.media-content')
        .toArray()
        .map((el) => {
            const imageSrc = $(el).find('img').attr('data-src');
            const description = `<img src="${imageSrc}" alt="cover">`;
            const { href, title } = $(el).attr();
            return {
                title,
                description,
                link: href,
            };
        });

    return {
        title: `IACG.RIP - ${category}`,
        link: `https://b.iacg.site/book/${category}/page/${page}`,
        item: items,
    };
}
