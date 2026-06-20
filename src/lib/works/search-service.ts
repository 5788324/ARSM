import { prisma } from '@/lib/prisma';

export interface WorksQuery {
  keyword?: string;
  circleId?: string;
  vaId?: string;
  tagId?: string;
  hasSubtitle?: boolean;
  favorite?: boolean;
  userId?: string;
  sort?: 'recent' | 'title' | 'tracks';
  page?: number;
  pageSize?: number;
}

export async function searchWorks(query: WorksQuery) {
  const { keyword, circleId, vaId, tagId, hasSubtitle, favorite, userId, sort = 'recent', page = 1, pageSize = 20 } = query;
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
  if (circleId) where.AND.push({ circleId });
  if (vaId) where.AND.push({ workVAs: { some: { voiceActorId: vaId } } });
  if (tagId) where.AND.push({ workTags: { some: { tagId } } });
  if (hasSubtitle) where.AND.push({ trackSubtitles: { some: {} } });
  if (favorite && userId) where.AND.push({ favorites: { some: { userId } } });

  if (where.AND.length === 0) delete where.AND;

  const orderBy: any = sort === 'title' ? { displayTitle: 'asc' } : sort === 'tracks' ? { trackCount: 'desc' } : { updatedAt: 'desc' };

  const [works, total] = await Promise.all([
    prisma.work.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        circle: true,
        _count: { select: { tracks: true } },
      },
    }),
    prisma.work.count({ where }),
  ]);

  return { works, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
