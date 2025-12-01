import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format meta description to optimal length (120-160 characters)
 * Bing and Google recommend meta descriptions between 120-160 characters
 */
export function formatMetaDescription(description: string, title?: string): string {
  if (!description) {
    return title || '';
  }

  // Remove extra whitespace and trim
  let formatted = description.trim().replace(/\s+/g, ' ');

  // If too short (< 120 chars), try to extend it intelligently
  if (formatted.length < 120) {
    // If we have a title and the description is very short, append title context
    if (title && formatted.length < 80) {
      const titleSuffix = ` - ${title}`;
      if (formatted.length + titleSuffix.length <= 160) {
        formatted = formatted + titleSuffix;
      }
    }
    // If still too short but acceptable, return as is (minimum 50 chars is acceptable)
    if (formatted.length >= 50) {
      return formatted;
    }
    // If very short, use title as fallback
    return title || formatted;
  }

  // If too long (> 160 chars), truncate at word boundary
  if (formatted.length > 160) {
    const truncated = formatted.substring(0, 157);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 120) {
      return truncated.substring(0, lastSpace) + '...';
    }
    // If no good word boundary, just truncate
    return truncated + '...';
  }

  return formatted;
}

/**
 * Safely parse JSON from a Response, handling HTML error pages
 */
export async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  // Check if response is JSON
  if (!contentType.includes('application/json')) {
    // Check if it looks like JSON (starts with { or [)
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      // Likely HTML error page
      throw new Error(`Expected JSON but received ${contentType}. Status: ${response.status}. Response preview: ${text.substring(0, 200)}`);
    }
  }
  
  try {
    return JSON.parse(text);
  } catch (parseError) {
    throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}. Status: ${response.status}. Response preview: ${text.substring(0, 200)}`);
  }
}
