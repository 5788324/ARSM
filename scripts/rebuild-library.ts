import { prisma } from '../src/lib/prisma';
import { runImport } from '../src/lib/import/service';

async function main() {
  const rootPath = process.argv[2] || process.env.LIBRARY_ROOT;
  if (!rootPath) {
    throw new Error('缺少扫描目录，请传入路径参数或设置 LIBRARY_ROOT');
  }

  const result = await runImport({ rootPath, groupByTop: true });
  console.log(JSON.stringify(result, null, 2));

  await prisma.$disconnect();

  if (result.status === 'failed') {
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
