import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Count unique employees who logged today
    const todayQuery = `
      SELECT COUNT(DISTINCT ashima_id) as count
      FROM freemeal_logs
      WHERE DATE(time_claimed) = ?
    `;
    
    const todayResult = await executeQuery({ 
      query: todayQuery, 
      values: [today] 
    });
    
    // Count total logs
    const totalLogsQuery = `
      SELECT COUNT(*) as count
      FROM freemeal_logs
    `;
    
    const totalLogsResult = await executeQuery({ query: totalLogsQuery });
    
    // Count entries with time in only (no time out)
    const timeInOnlyQuery = `
      SELECT COUNT(*) as count
      FROM freemeal_logs
    `;
    
    const timeInOnlyResult = await executeQuery({ query: timeInOnlyQuery });
    
    // Count entries with both time in and time out
    const completeLogsQuery = `
      SELECT COUNT(*) as count
      FROM freemeal_logs
    `;
    
    const completeLogsResult = await executeQuery({ query: completeLogsQuery });
    
    return NextResponse.json({
      todayCount: todayResult[0].count,
      total_logs: totalLogsResult[0].count,
      in_only: timeInOnlyResult[0].count,
      complete_logs: completeLogsResult[0].count
    });
  } catch (error) {
    console.error("Failed to fetch free meal stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch free meal stats" },
      { status: 500 }
    );
  }
}