import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * API route to write frontend logs to filesystem
 * Logs are written to logs/frontend/ directory in JSON format
 * 
 * Note: In high-concurrency scenarios, some logs may be lost due to race conditions.
 * This is acceptable for logging as it's non-critical data.
 */
export async function POST(request: NextRequest) {
  try {
    // Handle both JSON body and sendBeacon (text/plain) body
    let logs: any[];
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      logs = await request.json();
    } else {
      // Handle sendBeacon (text/plain)
      const body = await request.text();
      try {
        logs = JSON.parse(body);
      } catch {
        return NextResponse.json(
          { error: 'Invalid log data format' },
          { status: 400 }
        );
      }
    }
    
    // Ensure logs array
    if (!Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Expected array of log entries' },
        { status: 400 }
      );
    }

    if (logs.length === 0) {
      return NextResponse.json({ 
        message: 'No logs to write',
        count: 0 
      });
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
    // Note: Race condition possible here, but acceptable for logging
    let existingLogs: any[] = [];
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    while (retryCount < MAX_RETRIES) {
      try {
        if (existsSync(filepath)) {
          const content = await readFile(filepath, 'utf-8');
          if (content.trim()) {
            existingLogs = JSON.parse(content);
            // Validate it's an array
            if (!Array.isArray(existingLogs)) {
              existingLogs = [];
            }
          }
        }
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          // If file is corrupted after retries, start fresh
          // Log the error but don't fail the request
          console.error(`Failed to read log file after ${MAX_RETRIES} retries:`, error);
          existingLogs = [];
          break;
        }
        // Wait a bit before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 10 * retryCount));
      }
    }

    // Append new logs
    const allLogs = [...existingLogs, ...logs];

    // Keep only last 1000 entries per file to prevent file bloat
    const trimmedLogs = allLogs.slice(-1000);

    // Write to file with retry logic
    retryCount = 0;
    while (retryCount < MAX_RETRIES) {
      try {
        await writeFile(filepath, JSON.stringify(trimmedLogs, null, 2), 'utf-8');
        break; // Success
      } catch (error) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          console.error(`Failed to write log file after ${MAX_RETRIES} retries:`, error);
          return NextResponse.json(
            { error: 'Failed to write logs after retries' },
            { status: 500 }
          );
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 10 * retryCount));
      }
    }

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

