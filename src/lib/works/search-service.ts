import { prisma } from '@/lib/prisma';

export interface WorksQuery {
  keyword?: string;
  exclude?: string;
  circleName?: string;
  vaName?: string;
  tagName?: string;
  hasSubtitle?: boolean;
  favorite?: boolean;
  userId?: string;
  minDurationMin?: number;
  maxDurationMin?: number;
  sort?: 'recent' | 'title' | 'tracks' | 'duration';
  page?: number;
  pageSize?: number;
}

export async function searchWorks(query: WorksQuery) {
  const { keyword, exclude, circleName, vaName, tagName, hasSubtitle, favorite, userId, minDurationMin, maxDurationMin, sort = 'recent', page = 1, pageSize = 20 } = query;
  const where: any = { AND: [] };

  if (keyword) {
    where.AND.push({
      OR: [
        { displayTitle: { contains: keyword } },
        { originalTitle: { contains: keyword } },
        { workCode: { contains: keyword.toUpperCase() } },
        { circle: { name: { contains: keyword } } },
        { workVAs: { some: { voiceActor: { name: { contains: keyword } } } } },
        { workTags: { some: { tag: { name: { contains: keyword } } } } },
      ],
    });
  }

  if (exclude) {
    where.AND.push({
      NOT: {
        OR: [
          { displayTitle: { contains: exclude } },
          { originalTitle: { contains: exclude } },
          { workTags: { some: { tag: { name: { contains: exclude } } } } },
        ],
      },
    });
  }

  if (circleName) where.AND.push({ circle: { name: { contains: circleName } } });
  if (vaName) where.AND.push({ workVAs: { some: { voiceActor: { name: { contains: vaName } } } } });
  if (tagName) where.AND.push({ workTags: { some: { tag: { name: { contains: tagName } } } } });
  if (hasSubtitle) where.AND.push({ trackSubtitles: { some: {} } });
  if (favorite && userId) where.AND.push({ favorites: { some: { userId } } });
  if (minDurationMin != null) where.AND.push({ durationSec: { gte: minDurationMin * 60 } });
  if (maxDurationMin != null) where.AND.push({ durationSec: { lte: maxDurationMin * 60 } });

  if (where.AND.length === 0) delete where.AND;

  const orderBy: any = sort === 'title' ? { displayTitle: 'asc' } : sort === 'tracks' ? { trackCount: 'desc' } : sort === 'duration' ? { durationSec: 'desc' } : { updatedAt: 'desc' };

  const [works, total] = await Promise.all([
    prisma.work.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { circle: true, _count: { select: { tracks: true } } },
    }),
    prisma.work.count({ where }),
  ]);

  return { works, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
