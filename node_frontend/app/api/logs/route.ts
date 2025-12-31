import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * API route to write frontend logs to filesystem
 * Logs are written to logs/frontend/ directory in JSON format
 */
export async function POST(request: NextRequest) {
  try {
    const logs = await request.json();
    
    // Ensure logs array
    if (!Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Expected array of log entries' },
        { status: 400 }
      );
    }

    // Always write logs to server (file logging is always enabled)
    // Create logs/frontend directory if it doesn't exist
    const logsDir = join(process.cwd(), 'logs', 'frontend');
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true });
    }

    // Generate filename with timestamp (one file per day)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `frontend-${today}.json`;
    const filepath = join(logsDir, filename);

    // Read existing logs if file exists
    let existingLogs: any[] = [];
    try {
      if (existsSync(filepath)) {
        const fs = await import('fs/promises');
        const content = await fs.readFile(filepath, 'utf-8');
        existingLogs = JSON.parse(content);
      }
    } catch (error) {
      // If file doesn't exist or is invalid, start fresh
      existingLogs = [];
    }

    // Append new logs
    const allLogs = [...existingLogs, ...logs];

    // Keep only last 1000 entries per file to prevent file bloat
    const trimmedLogs = allLogs.slice(-1000);

    // Write to file
    await writeFile(filepath, JSON.stringify(trimmedLogs, null, 2), 'utf-8');

    return NextResponse.json({ 
      message: 'Logs written successfully',
      count: logs.length 
    });
  } catch (error) {
    console.error('Failed to write logs:', error);
    return NextResponse.json(
      { error: 'Failed to write logs' },
      { status: 500 }
    );
  }
}

