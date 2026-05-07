/**
 * ASR/TTS 代理服务 - Cloudflare Worker
 * 转发前端请求到阿里云语音服务 RESTful API
 */

export default {
  /**
   * 处理请求入口
   */
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    const url = new URL(request.url);

    // GET 请求：TTS 合成接口
    if (request.method === 'GET') {
      if (url.pathname === '/api/tts/synthesize') {
        return handleTTS(request, env);
      }
    }

    // POST 请求：ASR 识别接口
    if (request.method === 'POST') {
      if (url.pathname === '/api/asr/recognize') {
        return handleASR(request, env, ctx);
      }
    }

    return corsResponse(
      new Response('Not Found', { status: 404 }),
      request, env
    );
  }
};

/**
 * 获取允许的 Origin
 * 生产环境建议配置为具体域名
 */
function getAllowedOrigin(request, env) {
  // 可通过环境变量配置允许的域名列表
  // const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',');
  // const origin = request.headers.get('Origin');
  // if (allowedOrigins.includes(origin)) return origin;
  
  // 开发阶段允许所有来源，生产环境请修改
  return '*';
}

/**
 * 处理 CORS 预检请求
 */
function handleCORS(request, env) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request, env),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * 为响应添加 CORS 头
 */
function corsResponse(response, request, env) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', getAllowedOrigin(request, env));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * 返回 JSON 响应
 */
function jsonResponse(data, status = 200, request, env) {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
  return corsResponse(response, request, env);
}

/**
 * 保存音频到 R2
 */
async function saveAudioToR2(audioBuffer, format, env) {
  try {
    if (!env.AUDIO_BUCKET) {
      console.log('[R2] AUDIO_BUCKET not configured, skipping upload');
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `asr/${timestamp}.${format}`;
    
    await env.AUDIO_BUCKET.put(filename, audioBuffer, {
      httpMetadata: {
        contentType: format === 'wav' ? 'audio/wav' : `audio/${format}`
      }
    });
    
    console.log(`[R2] Audio saved: ${filename}, size: ${audioBuffer.byteLength} bytes`);
    return filename;
  } catch (error) {
    console.error('[R2] Failed to save audio:', error.message);
    return null;
  }
}

/**
 * 处理 ASR 识别请求
 */
async function handleASR(request, env, ctx) {
  try {
    // 检查必要的环境变量
    if (!env.ALIYUN_APPKEY || !env.ALIYUN_TOKEN) {
      console.error('Missing required secrets: ALIYUN_APPKEY or ALIYUN_TOKEN');
      return jsonResponse(
        { status: 50000000, message: '服务配置错误' },
        500, request, env
      );
    }

    // 解析 FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const format = formData.get('format') || 'wav';
    const sampleRate = formData.get('sampleRate') || '16000';

    // 验证音频文件
    if (!audioFile) {
      return jsonResponse(
        { status: 40000000, message: '缺少音频文件' },
        400, request, env
      );
    }

    // 验证文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return jsonResponse(
        { status: 40000003, message: '音频文件过大，请控制在 10MB 以内' },
        400, request, env
      );
    }

    // 获取音频二进制数据
    const audioBuffer = await audioFile.arrayBuffer();

    // 保存音频到 R2（异步，不阻塞 ASR 请求）
    if (ctx) {
      ctx.waitUntil(saveAudioToR2(audioBuffer, format, env));
    }

    // 构建阿里云 ASR 请求 URL
    const asrUrl = new URL(env.ALIYUN_ASR_URL);
    asrUrl.searchParams.set('appkey', env.ALIYUN_APPKEY);
    asrUrl.searchParams.set('format', format);
    asrUrl.searchParams.set('sample_rate', sampleRate);
    asrUrl.searchParams.set('enable_punctuation_prediction', 'true');
    asrUrl.searchParams.set('enable_inverse_text_normalization', 'true');

    console.log(`[ASR] Sending request to Aliyun, audio size: ${audioBuffer.byteLength} bytes`);

    // 发送请求到阿里云 ASR
    const asrResponse = await fetch(asrUrl.toString(), {
      method: 'POST',
      headers: {
        'X-NLS-Token': env.ALIYUN_TOKEN,
        'Content-Type': 'application/octet-stream',
        'Content-Length': audioBuffer.byteLength.toString()
      },
      body: audioBuffer
    });

    // 获取响应头中的 task_id（用于排查问题）
    const taskId = asrResponse.headers.get('task_id');
    console.log(`[ASR] Response received, task_id: ${taskId}`);

    // 解析响应
    const result = await asrResponse.json();

    // 记录日志
    if (result.status === 20000000) {
      console.log(`[ASR] Success, result: ${result.result?.substring(0, 50)}...`);
    } else {
      console.error(`[ASR] Failed, status: ${result.status}, message: ${result.message}`);
    }

    return jsonResponse(result, 200, request, env);

  } catch (error) {
    console.error('[ASR] Error:', error.message, error.stack);
    return jsonResponse(
      { status: 50000000, message: error.message || '识别服务异常' },
      500, request, env
    );
  }
}

/**
 * 处理 TTS 语音合成请求
 */
async function handleTTS(request, env) {
  try {
    // 检查必要的环境变量
    if (!env.ALIYUN_APPKEY || !env.ALIYUN_TOKEN) {
      console.error('Missing required secrets: ALIYUN_APPKEY or ALIYUN_TOKEN');
      return jsonResponse(
        { status: 50000000, message: '服务配置错误' },
        500, request, env
      );
    }

    // 从 URL 参数获取文本和配置
    const url = new URL(request.url);
    const text = url.searchParams.get('text');
    const format = url.searchParams.get('format') || 'mp3';
    const sampleRate = url.searchParams.get('sample_rate') || '16000';
    const voice = url.searchParams.get('voice') || 'xiaoyun';

    // 验证参数
    if (!text) {
      return jsonResponse(
        { status: 40000003, message: '缺少 text 参数' },
        400, request, env
      );
    }

    if (text.length > 300) {
      return jsonResponse(
        { status: 40000003, message: '文本长度超过 300 字符限制' },
        400, request, env
      );
    }

    // 构建阿里云 TTS URL（GET 方式）
    const ttsUrl = new URL('https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts');
    ttsUrl.searchParams.set('appkey', env.ALIYUN_APPKEY);
    ttsUrl.searchParams.set('token', env.ALIYUN_TOKEN);
    ttsUrl.searchParams.set('text', text);
    ttsUrl.searchParams.set('format', format);
    ttsUrl.searchParams.set('sample_rate', sampleRate);
    ttsUrl.searchParams.set('voice', voice);

    console.log(`[TTS] Sending request to Aliyun, text length: ${text.length}, voice: ${voice}`);

    // 请求阿里云 TTS
    const ttsResponse = await fetch(ttsUrl.toString(), { method: 'GET' });

    // 检查响应
    const contentType = ttsResponse.headers.get('Content-Type');
    
    if (contentType === 'audio/mpeg') {
      // 成功：返回音频流
      console.log('[TTS] Success, returning audio stream');
      return corsResponse(
        new Response(ttsResponse.body, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' }
        }),
        request, env
      );
    } else {
      // 失败：返回错误信息
      const errorBody = await ttsResponse.json();
      console.error(`[TTS] Failed, status: ${errorBody.status}, message: ${errorBody.message}`);
      return jsonResponse(errorBody, 400, request, env);
    }

  } catch (error) {
    console.error('[TTS] Error:', error.message, error.stack);
    return jsonResponse(
      { status: 50000000, message: error.message || '语音合成服务异常' },
      500, request, env
    );
  }
}
