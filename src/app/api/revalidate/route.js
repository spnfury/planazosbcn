import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// POST /api/revalidate — On-demand revalidation for admin changes
// Body: { paths: ["/", "/restaurantes", "/restaurantes/123"] }
export async function POST(request) {
  try {
    const body = await request.json();
    const paths = body.paths || ['/'];

    for (const path of paths) {
      revalidatePath(path, 'page');
    }

    // Always revalidate the home page
    revalidatePath('/', 'page');

    return NextResponse.json({ 
      revalidated: true, 
      paths,
      timestamp: Date.now() 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
