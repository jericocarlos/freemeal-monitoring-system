import { NextResponse } from "next/server";
import { generateFreemealCsv } from '@/lib/reports';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const search = searchParams.get('search') || '';
    const logType = searchParams.get('log_type') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    // Support special range keywords (e.g., start_date=previous_week)
    const useRange = (startDate === 'previous_week' || endDate === 'previous_week');
    const params = useRange ? { search, logType, range: 'previous_week' } : { search, logType, startDate, endDate };
    const { csv, filename } = await generateFreemealCsv(params);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Failed to export free meal logs:", error);
    return NextResponse.json(
      { message: "Failed to export free meal logs" },
      { status: 500 }
    );
  }
}