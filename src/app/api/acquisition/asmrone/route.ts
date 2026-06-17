import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { inspect, downloadWork } from '@/lib/acquisition/asmrone';

/** POST: inspect a work or download it */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, input, targetDir } = await req.json();
  if (!input) return NextResponse.json({ error: 'input (RJ code) required' }, { status: 400 });

  try {
    if (action === 'inspect') {
      const result = await inspect(input);
      return NextResponse.json(result);
    }

    if (action === 'download') {
      if (!targetDir) return NextResponse.json({ error: 'targetDir required for download' }, { status: 400 });

      const result = await downloadWork(input, targetDir);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}. Use "inspect" or "download".` }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Acquisition failed' },
      { status: 500 },
    );
  }
}
