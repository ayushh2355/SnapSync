import { SearchController } from '@/controllers/search.controller';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return SearchController.searchMedia(req);
}
