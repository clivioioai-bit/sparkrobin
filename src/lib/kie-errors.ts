// Kie.ai API Error Code Mapping
// 根据Kie.ai API文档映射失败原因

export const KIE_ERROR_CODES = {
  // API级别错误
  '400': 'Invalid request parameters',
  '401': 'Authentication failed, please check API Key',
  '402': 'Insufficient account balance',
  '404': 'Resource not found',
  '422': 'Parameter validation failed',
  '429': 'Request rate limit exceeded',
  '500': 'Internal server error',

  // 任务级别错误（failCode字段）
  'MODEL_RATE_LIMIT': 'Model rate limit exceeded, please try again later',
  'MODEL_BUSY': 'Model is busy, suggest changing to 8s or try again later',
  'CONTENT_BLOCKED': 'Content violates usage policy, please modify and retry',
  'PROMPT_TOO_LONG': 'Prompt exceeds maximum length limit',
  'INVALID_ASPECT_RATIO': 'Invalid aspect ratio parameter',
  'IMAGE_UPLOAD_FAILED': 'Image upload failed',
  'GENERATION_TIMEOUT': 'Generation timeout',
  'UNKNOWN_ERROR': 'Unknown error occurred during generation',
} as const;

export type KieErrorCode = keyof typeof KIE_ERROR_CODES;

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(failCode?: string, failMsg?: string): string {
  // 优先使用API文档中的failMsg
  if (typeof failMsg === 'string' && failMsg.trim()) {
    return failMsg.trim();
  }

  // 使用预定义的错误代码映射
  if (failCode && failCode in KIE_ERROR_CODES) {
    return KIE_ERROR_CODES[failCode as KieErrorCode];
  }

  // 默认错误消息
  return 'Video generation failed. Please try again.';
}

/**
 * 判断是否为可重试的错误
 */
export function isRetryableError(failCode?: string): boolean {
  const retryableCodes = [
    'MODEL_RATE_LIMIT',
    'MODEL_BUSY',
    '429', // Rate limit
    '500', // Internal server error
  ];

  return failCode ? retryableCodes.includes(failCode) : false;
}

/**
 * 判断是否为内容政策错误
 */
export function isContentPolicyError(failCode?: string, failMsg?: string): boolean {
  const contentPolicyCodes = [
    'CONTENT_BLOCKED',
  ];

  // 检查错误代码
  if (failCode && contentPolicyCodes.includes(failCode)) {
    return true;
  }

  // 检查错误消息中是否包含内容策略相关关键词
  if (typeof failMsg === 'string' && failMsg) {
    const lowerMsg = failMsg.toLowerCase();
    const contentPolicyKeywords = [
      'content policy',
      'content policies',
      'violate',
      'violates',
      'violation',
      "openai's content policies",
      'content may violate',
      'usage policy',
      'policy violation',
      'content blocked',
      'unsafe content',
      'inappropriate content'
    ];

    return contentPolicyKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  return false;
}

/**
 * 从错误响应中提取错误信息
 */
export function extractErrorFromResponse(
  responseText: string,
  statusCode?: number
): { errorMessage?: string; errorCode?: string; failCode?: string; failMsg?: string } {
  let errorMessage: string | undefined;
  let errorCode: string | undefined;
  let failCode: string | undefined;
  let failMsg: string | undefined;

  // 尝试解析为 JSON
  try {
    const errorData = JSON.parse(responseText);

    // 提取错误消息（按优先级）
    const rawMessage = errorData.msg || errorData.message || errorData.error || errorData.errorMessage;
    if (typeof rawMessage === 'string') {
      errorMessage = rawMessage;
    } else if (rawMessage != null) {
      try {
        errorMessage = JSON.stringify(rawMessage);
      } catch {
        errorMessage = String(rawMessage);
      }
    }
    errorCode = errorData.code || errorData.errorCode || (statusCode ? String(statusCode) : undefined);
    failCode = errorData.failCode || errorData.fail_code || errorCode;
    failMsg = errorData.failMsg || errorData.fail_msg || errorMessage;

    // 如果错误消息包含 "Error code" 和 "Error message" 格式
    if (errorMessage && errorMessage.includes('Error code:') && errorMessage.includes('Error message:')) {
      const codeMatch = errorMessage.match(/Error code:\s*(\d+)/i);
      const msgMatch = errorMessage.match(/Error message:\s*(.+)/i);
      if (codeMatch) errorCode = codeMatch[1];
      if (msgMatch) errorMessage = msgMatch[1].trim();
    }
  } catch {
    // 如果不是 JSON，直接使用文本
    errorMessage = responseText.trim();

    // 尝试从文本中提取错误代码和消息
    if (errorMessage.includes('Error code:') && errorMessage.includes('Error message:')) {
      const codeMatch = errorMessage.match(/Error code:\s*(\d+)/i);
      const msgMatch = errorMessage.match(/Error message:\s*(.+)/i);
      if (codeMatch) {
        errorCode = codeMatch[1];
        failCode = codeMatch[1];
      }
      if (msgMatch) {
        errorMessage = msgMatch[1].trim();
        failMsg = errorMessage;
      }
    } else {
      if (statusCode) {
        errorCode = String(statusCode);
        failCode = String(statusCode);
      }
      failMsg = errorMessage;
    }
  }

  // 如果检测到内容策略违规，设置相应的错误代码
  if (isContentPolicyError(failCode, failMsg || errorMessage)) {
    failCode = 'CONTENT_BLOCKED';
    if (!errorMessage || !isContentPolicyError(undefined, errorMessage)) {
      errorMessage = KIE_ERROR_CODES.CONTENT_BLOCKED;
    }
  }

  return {
    errorMessage,
    errorCode,
    failCode,
    failMsg: failMsg || errorMessage
  };
}
