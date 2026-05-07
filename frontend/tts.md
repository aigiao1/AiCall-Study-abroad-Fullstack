---
description: 本文详解如何调用语音合成RESTful API，内容覆盖GET/POST请求、参数配置及流式合成，并提供Java、Python、C++等多语言代码示例与状态码，助您快速集成。
title: RESTful API
image: https://img.alicdn.com/imgextra/i1/O1CN012QgtoH1c1Mu70xD3w_!!6000000003540-2-tps-640-640.png
---

[官方文档](/)

输入文档关键字查找

语音合成RESTful API支持HTTPS GET和POST两种方法的请求，将待合成的文本上传到服务端，服务端返回文本的语音合成结果，开发者需要保证在语音合成结果返回之前连接不中断。

## 功能介绍

将用户上传的文本合成语音。用户可以通过请求参数对如下属性进行设置：

* 音频格式：PCM、WAV、MP3。
* 采样率：8000 Hz、16000 Hz。
* 发音人：详见音色列表。
* 语速。
* 语调。
* 音量。

**重要** 
* **建议使用流式合成机制**：随着TTS合成效果不断提升，算法的复杂度也越来越高，对您而言，可能会遇到合成耗时变长的情况，使用流式合成可以提供更快的响应速度。本文档及SDK示例中有相关流式处理示例代码可供参考。
* **上传文本长度限制**：上传文本长度不能超过300字符，超过的字符会被截断。对于更长的文本，请[下载Java示例](#h2-8cj-mek-p7x)查看SDK中的长文本切分及拼接示例。
* **不支持纯JavaScript直接调用RESTful接口**：使用纯JavaScript直接访问RESTful接口可能会遇到跨域问题（Cross-Origin Resource Sharing, CORS），并且存在泄露App Key的风险。

## 前提条件

* 已准备项目Appkey，详情请参见[创建项目](https://help.aliyun.com/zh/isi/create-a-project#2572188)。
* 已获取Access Token，详情请参见[获取Token概述](https://help.aliyun.com/zh/isi/overview-of-obtaining-an-access-token#587dee8029x7r)。

## 服务地址

| **访问类型**     | **说明**                                                                                                                                                                                                                                                            | **URL**                                                                                                                                                                                   | **Host**                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 外网访问（默认上海地域） | 所有服务器均可使用外网访问URL。                                                                                                                                                                                                                                                 | 上海：nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts北京：nls-gateway-cn-beijing.aliyuncs.com/stream/v1/tts深圳：nls-gateway-cn-shenzhen.aliyuncs.com/stream/v1/tts                            | 上海：nls-gateway-cn-shanghai.aliyuncs.com北京：nls-gateway-cn-beijing.aliyuncs.com深圳：nls-gateway-cn-shenzhen.aliyuncs.com                            |
| ECS内网访问      | 使用阿里云上海、北京、深圳ECS（即ECS地域为华东2（上海）、华北2（北京）、华南1（深圳）），可使用内网访问URL。 ECS的经典网络不能访问AnyTunnel，即不能在内网访问语音服务；如果希望使用AnyTunnel，需要创建专有网络在其内部访问。**说明** 使用内网访问方式，将不产生ECS实例的公网流量费用。关于ECS的网络类型请参见[网络类型](https://help.aliyun.com/zh/ecs/user-guide/network-types#concept-nfj-dz2-5db)。 | 上海：nls-gateway-cn-shanghai-internal.aliyuncs.com/stream/v1/tts北京：nls-gateway-cn-beijing-internal.aliyuncs.com/stream/v1/tts深圳：nls-gateway-cn-shenzhen-internal.aliyuncs.com/stream/v1/tts | 上海：nls-gateway-cn-shanghai-internal.aliyuncs.com北京：nls-gateway-cn-beijing-internal.aliyuncs.com深圳：nls-gateway-cn-shenzhen-internal.aliyuncs.com |

**重要** 
* 支持的协议类型：  
   * 外网访问：支持HTTP和HTTPS协议。  
   * ECS内网访问：只支持HTTP协议。
* 本文的示例使用的是外网访问的方式。在实际业务场景中，请根据实际情况适配URL。

## 交互流程

客户端向服务端发送携带待识别文本的请求，服务端返回携带合成语音数据的响应。



**说明** 

服务端的响应除了音频流之外，都会在返回信息的header包含本次识别任务的task\_id参数，是本次请求的唯一标识。

## 请求参数

语音合成服务兼容 GET 和 POST 请求方法：

* 如果使用GET方法，需要使用查询字符串（Query String）的方式传参。查询字符串以键值对的方式拼接到URL中（格式为“?key1=value1&key2=value2”）。
* 如果使用POST方法，需要在请求体（Body）中设置这些参数。

GET和POST方法的请求参数一致，如下表所示：

| **名称**       | **类型**  | **是否必选** | **描述**                                                                                                                                                                                                                                                                                           |
| ------------ | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| appkey       | String  | 是        | 项目appkey。                                                                                                                                                                                                                                                                                        |
| text         | String  | 是        | 待合成的文本，需要为UTF-8编码。使用GET方法，需要再采用RFC 3986规范进行urlencode编码；使用POST方法请不要进行urlencode编码，否则会导致合成结果有误。**说明** 调用某音色的多情感内容，需要在text中加上ssml-emotion标签，详情请参见[<emotion>](https://help.aliyun.com/zh/isi/developer-reference/ssml-overview#title-i3w-j10-5yw)。只有支持多情感的音色，才能使用<emotion>标签，否则会报错：Illegal ssml text。 |
| token        | String  | 否        | 若不设置token参数，需要在HTTP Headers中设置X-NLS-Token字段来指定Token。                                                                                                                                                                                                                                             |
| format       | String  | 否        | 音频编码格式，支持PCM/WAV/MP3格式。默认值：pcm。                                                                                                                                                                                                                                                                  |
| sample\_rate | Integer | 否        | 音频采样率，支持16000 Hz和8000 Hz，默认值：16000 Hz。                                                                                                                                                                                                                                                           |
| voice        | String  | 否        | 发音人，默认值：xiaoyun。更多发音人请参见[接口说明](https://help.aliyun.com/zh/isi/developer-reference/overview-of-speech-synthesis#topic-2572243)。                                                                                                                                                                   |
| volume       | Integer | 否        | 音量，取值范围：0\~100，默认值：50。                                                                                                                                                                                                                                                                           |
| speech\_rate | Integer | 否        | 语速，取值范围：-500\~500，默认值：0。                                                                                                                                                                                                                                                                         |
| pitch\_rate  | Integer | 否        | 语调，取值范围：-500\~500，默认值：0。                                                                                                                                                                                                                                                                         |

## GET方法上传文本

* 完整URL：`https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts`
* 请求头：  
   * `X-NLS-Token`（String，可选）：服务鉴权Token。
* 带参数URL示例（参数说明参见[请求参数](#section-uq2-bcr-yq4)）  
```  
# text文本："今天是周一，天气挺好的。"  
https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts?appkey=${您的appkey}&token=${您的token}&text=%E4%BB%8A%E5%A4%A9%E6%98%AF%E5%91%A8%E4%B8%80%EF%BC%8C%E5%A4%A9%E6%B0%94%E6%8C%BA%E5%A5%BD%E7%9A%84%E3%80%82&format=wav&sample_rate=16000  
```

**重要** 
* 服务鉴权Token有如下两种设置方式：  
   * （推荐）在请求参数`token`中设置  
   * 在请求头`X-NLS-Token`字段设置
* 参数`text`必须采用`UTF-8`编码，再采用RFC 3986规范进行urlencode编码。如加号`+` 编码为`%2B`，星号`*`编码为`%2A`，`%7E`编码为`~`。

## POST方法上传文本

* 完整URL：`https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts`
* 请求头：  
   * `Content-Type`（String，必选）：必须为“application/json”，表明请求体的内容为JSON格式字符串。  
   * `X-NLS-Token`（String，可选）：服务鉴权Token。  
   * `Content-Length`（String，可选）：请求体的内容长度。
* 请求体示例（参数说明参见[请求参数](#section-uq2-bcr-yq4)）  
```  
  {  
    "appkey":"31f932fb",  
    "text":"今天是周一，天气挺好的。",  
    "token":"450343c793aaaaaa****",  
    "format":"wav"  
  }  
```

**重要** 
* 服务鉴权Token参数有如下两种设置方式：  
   * 推荐在请求体通过参数`token`设置.  
   * 在HTTPS Headers的`X-NLS-Token`字段设置。
* 使用POST方法的请求，请求体中的请求参数`text`必须采用`UTF-8`编码，但是不进行urlencode编码，否则会导致合成结果有误。注意与GET方法请求的区别。

## 响应结果

GET方法和POST方法请求的响应相同。

请求成功/失败通过Headers的`Content-Type`字段来区分：

* 成功响应  
   * Headers的`Content-Type`字段内容为`audio/mpeg`，表示合成成功，合成的语音数据在响应体中。  
   * 响应内容为合成音频的二进制数据。
* 失败响应  
   * Headers没有`Content-Type`字段，或者`Content-Type`字段内容为`application/json`，表示合成失败，错误信息在响应体中。  
   * Headers的`X-NLS-RequestId`字段内容为请求任务的task\_id。  
   * 响应体内容为错误信息，以JSON格式的字符串表示。如下所示：  
   ```  
   {  
       "task_id":"8f95d0b9b6e948bc98e8d0ce64b0****",  
       "result":"",  
       "status":40000000,  
       "message":"Gateway:CLIENT_ERROR:in post data, json format illegal"  
   }  
   ```  
   * 错误信息字段如下表  
   | **名称**   | **类型**  | **描述**                  |  
   | -------- | ------- | ----------------------- |  
   | task\_id | String  | 32位请求任务ID，请记录该值，用于排查错误。 |  
   | result   | String  | 服务结果                    |  
   | status   | Integer | 服务状态码                   |  
   | message  | String  | 服务状态描述                  |

## 服务状态码

| **服务状态码** | **服务状态描述**             | **解决办法**              |
| --------- | ---------------------- | --------------------- |
| 20000000  | 请求成功                   | 无。                    |
| 40000000  | 默认的客户端错误码              | 检查对应的错误消息。            |
| 40000001  | 身份认证失败                 | 检查使用的令牌是否正确，是否过期。     |
| 40000002  | 无效的消息                  | 检查发送的消息是否符合要求。        |
| 40000003  | 无效的参数                  | 检查参数值设置是否合理。          |
| 40000004  | 空闲超时                   | 确认是否长时间没有发送数据到服务端。    |
| 40000005  | 请求数量过多                 | 检查是否超过了并发连接数或者每秒钟请求数。 |
| 40000010  | 试用期已结束，并且未开通商用版、或账户欠费。 | 请登录控制台确认服务开通状态以及账户余额。 |
| 50000000  | 默认的服务端错误               | 内部服务错误，需要客户端进行重试。     |
| 50000001  | 内部GRPC调用错误             | 内部服务错误，需要客户端进行重试。     |

## Java示例

**说明** 

更多的Java示例可以[下载nls-restful-java-demo.zip](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20220929/egtn/nls-restful-java-demo.zip)查看。

依赖文件内容如下：

```
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>3.9.1</version>
</dependency>
<!-- http://mvnrepository.com/artifact/com.alibaba/fastjson -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.83</version>
</dependency>
<dependency>
    <groupId>org.asynchttpclient</groupId>
    <artifactId>async-http-client</artifactId>
    <version>2.5.4</version>
</dependency>

```

示例代码如下：

```
import java.io.File;
import java.io.FileOutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
public class SpeechSynthesizerRestfulDemo {
    private String accessToken;
    private String appkey;
    public SpeechSynthesizerRestfulDemo(String appkey, String token) {
        this.appkey = appkey;
        this.accessToken = token;
    }
    /**
     * HTTPS GET请求
     */
    public void processGETRequet(String text, String audioSaveFile, String format, int sampleRate, String voice) {
        /**
         * 设置HTTPS GET请求：
         * 1.使用HTTPS协议
         * 2.语音识别服务域名：nls-gateway-cn-shanghai.aliyuncs.com
         * 3.语音识别接口请求路径：/stream/v1/tts
         * 4.设置必须请求参数：appkey、token、text、format、sample_rate
         * 5.设置可选请求参数：voice、volume、speech_rate、pitch_rate
         */
        String url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
        url = url + "?appkey=" + appkey;
        url = url + "&token=" + accessToken;
        url = url + "&text=" + text;
        url = url + "&format=" + format;
        url = url + "&voice=" + voice;
        url = url + "&sample_rate=" + String.valueOf(sampleRate);
        // voice 发音人，可选，默认是xiaoyun。
        // url = url + "&voice=" + "xiaoyun";
        // volume 音量，范围是0~100，可选，默认50。
        // url = url + "&volume=" + String.valueOf(50);
        // speech_rate 语速，范围是-500~500，可选，默认是0。
        // url = url + "&speech_rate=" + String.valueOf(0);
        // pitch_rate 语调，范围是-500~500，可选，默认是0。
        // url = url + "&pitch_rate=" + String.valueOf(0);
        System.out.println("URL: " + url);
        /**
         * 发送HTTPS GET请求，处理服务端的响应。
         */
        Request request = new Request.Builder().url(url).get().build();
        try {
            long start = System.currentTimeMillis();
            OkHttpClient client = new OkHttpClient();
            Response response = client.newCall(request).execute();
            System.out.println("total latency :" + (System.currentTimeMillis() - start) + " ms");
            System.out.println(response.headers().toString());
            String contentType = response.header("Content-Type");
            if ("audio/mpeg".equals(contentType)) {
                File f = new File(audioSaveFile);
                FileOutputStream fout = new FileOutputStream(f);
                fout.write(response.body().bytes());
                fout.close();
                System.out.println("The GET request succeed!");
            }
            else {
                // ContentType 为 null 或者为 "application/json"
                String errorMessage = response.body().string();
                System.out.println("The GET request failed: " + errorMessage);
            }
            response.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    /**
     * HTTPS POST请求
     */
    public void processPOSTRequest(String text, String audioSaveFile, String format, int sampleRate, String voice) {
        /**
         * 设置HTTPS POST请求：
         * 1.使用HTTPS协议
         * 2.语音合成服务域名：nls-gateway-cn-shanghai.aliyuncs.com
         * 3.语音合成接口请求路径：/stream/v1/tts
         * 4.设置必须请求参数：appkey、token、text、format、sample_rate
         * 5.设置可选请求参数：voice、volume、speech_rate、pitch_rate
         */
        String url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
        JSONObject taskObject = new JSONObject();
        taskObject.put("appkey", appkey);
        taskObject.put("token", accessToken);
        taskObject.put("text", text);
        taskObject.put("format", format);
        taskObject.put("voice", voice);
        taskObject.put("sample_rate", sampleRate);
        // voice 发音人，可选，默认是xiaoyun。
        // taskObject.put("voice", "xiaoyun");
        // volume 音量，范围是0~100，可选，默认50。
        // taskObject.put("volume", 50);
        // speech_rate 语速，范围是-500~500，可选，默认是0。
        // taskObject.put("speech_rate", 0);
        // pitch_rate 语调，范围是-500~500，可选，默认是0。
        // taskObject.put("pitch_rate", 0);
        String bodyContent = taskObject.toJSONString();
        System.out.println("POST Body Content: " + bodyContent);
        RequestBody reqBody = RequestBody.create(MediaType.parse("application/json"), bodyContent);
        Request request = new Request.Builder()
            .url(url)
            .header("Content-Type", "application/json")
            .post(reqBody)
            .build();
        try {
            OkHttpClient client = new OkHttpClient();
            Response response = client.newCall(request).execute();
            String contentType = response.header("Content-Type");
            if ("audio/mpeg".equals(contentType)) {
                File f = new File(audioSaveFile);
                FileOutputStream fout = new FileOutputStream(f);
                fout.write(response.body().bytes());
                fout.close();
                System.out.println("The POST request succeed!");
            }
            else {
                // ContentType 为 null 或者为 "application/json"
                String errorMessage = response.body().string();
                System.out.println("The POST request failed: " + errorMessage);
            }
            response.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("SpeechSynthesizerRestfulDemo need params: <token> <app-key>");
            System.exit(-1);
        }
        String token = args[0];
        String appkey = args[1];
        SpeechSynthesizerRestfulDemo demo = new SpeechSynthesizerRestfulDemo(appkey, token);
        String text = "今天是周一，天气挺好的。";
        // 采用RFC 3986规范进行urlencode编码。
        String textUrlEncode = text;
        try {
            textUrlEncode = URLEncoder.encode(textUrlEncode, "UTF-8")
                .replace("+", "%20")
                .replace("*", "%2A")
                .replace("%7E", "~");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        System.out.println(textUrlEncode);
        String audioSaveFile = "syAudio.wav";
        String format = "wav";
        int sampleRate = 16000;
        demo.processGETRequet(textUrlEncode, audioSaveFile, format, sampleRate, "siyue");
        //demo.processPOSTRequest(text, audioSaveFile, format, sampleRate, "siyue");
        System.out.println("### Game Over ###");
    }
}
```

Java（流式合成）示例代码如下：

```
import java.io.File;
import java.io.FileOutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.concurrent.CountDownLatch;
import io.netty.handler.codec.http.HttpHeaders;
import org.asynchttpclient.AsyncHandler;
import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.AsyncHttpClientConfig;
import org.asynchttpclient.DefaultAsyncHttpClient;
import org.asynchttpclient.DefaultAsyncHttpClientConfig;
import org.asynchttpclient.HttpResponseBodyPart;
import org.asynchttpclient.HttpResponseStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 此示例演示了
 * 1. TTS的RESTFul接口调用。
 * 2. 启用HTTP chunked机制的处理方式（流式返回）。
 */
public class SpeechSynthesizerRestfulChunkedDemo {
    private static Logger logger = LoggerFactory.getLogger(SpeechSynthesizerRestfulChunkedDemo.class);
    private String accessToken;
    private String appkey;
    public SpeechSynthesizerRestfulChunkedDemo(String appkey, String token) {
        this.appkey = appkey;
        this.accessToken = token;
    }
    public void processGETRequet(String text, String audioSaveFile, String format, int sampleRate, String voice, boolean chunked) {
        /**
         * 设置HTTPS GET请求：
         * 1.使用HTTPS协议
         * 2.语音识别服务域名：nls-gateway-cn-shanghai.aliyuncs.com
         * 3.语音识别接口请求路径：/stream/v1/tts
         * 4.设置必须请求参数：appkey、token、text、format、sample_rate
         * 5.设置可选请求参数：voice、volume、speech_rate、pitch_rate
         */
        String url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
        url = url + "?appkey=" + appkey;
        url = url + "&token=" + accessToken;
        url = url + "&text=" + text;
        url = url + "&format=" + format;
        url = url + "&voice=" + voice;
        url = url + "&sample_rate=" + String.valueOf(sampleRate);
        System.out.println("URL: " + url);
        try {
            AsyncHttpClientConfig config = new DefaultAsyncHttpClientConfig.Builder()
                .setConnectTimeout(3000)
                .setKeepAlive(true)
                .setReadTimeout(10000)
                .setRequestTimeout(50000)
                .setMaxConnections(1000)
                .setMaxConnectionsPerHost(200)
                .setPooledConnectionIdleTimeout(-1)
                .build();
            AsyncHttpClient httpClient = new DefaultAsyncHttpClient(config);
            CountDownLatch latch = new CountDownLatch(1);
            AsyncHandler<org.asynchttpclient.Response> handler = new AsyncHandler<org.asynchttpclient.Response>() {
                FileOutputStream outs;
                boolean firstRecvBinary = true;
                long startTime = System.currentTimeMillis();
                int httpCode = 200;
                @Override
                public State onStatusReceived(HttpResponseStatus httpResponseStatus) throws Exception {
                    logger.info("onStatusReceived status {}", httpResponseStatus);
                    httpCode = httpResponseStatus.getStatusCode();
                    if (httpResponseStatus.getStatusCode() != 200) {
                        logger.error("request error " +  httpResponseStatus.toString());
                    }
                    return null;
                }
                @Override
                public State onHeadersReceived(HttpHeaders httpHeaders) throws Exception {
                    outs = new FileOutputStream(new File("tts.wav"));
                    return null;
                }
                @Override
                public State onBodyPartReceived(HttpResponseBodyPart httpResponseBodyPart) throws Exception {
                    // 注意：此处一旦接收到数据流，即可向用户播放或者用于其他处理，以提升响应速度。
                    // 注意：请不要在此回调接口中执行耗时操作，可以以异步或者队列形式将二进制TTS语音流推送到另一线程中。
                    logger.info("onBodyPartReceived " + httpResponseBodyPart.getBodyPartBytes().toString());
                    if(httpCode != 200) {
                        System.err.write(httpResponseBodyPart.getBodyPartBytes());
                    }
                    if (firstRecvBinary) {
                        firstRecvBinary = false;
                        // 统计第一包数据的接收延迟。实际上接收到第一包数据后就可以进行业务处理了，比如播放或者发送给调用方。注意：这里的首包延迟也包括了网络建立链接的时间。
                        logger.info("tts first latency " + (System.currentTimeMillis() - startTime) + " ms");
                    }
                    // 此处以将语音流保存到文件为例。
                    outs.write(httpResponseBodyPart.getBodyPartBytes());
                    return null;
                }
                @Override
                public void onThrowable(Throwable throwable) {
                    logger.error("throwable {}", throwable);
                    latch.countDown();
                }
                @Override
                public org.asynchttpclient.Response onCompleted() throws Exception {
                    logger.info("completed");
                    logger.info("tts total latency " + (System.currentTimeMillis() - startTime) + " ms");
                    outs.close();
                    latch.countDown();
                    return null;
                }
            };
            httpClient.prepareGet(url).execute(handler);
            // 等待合成完成
            latch.await();
            httpClient.close();
        }catch (Exception e) {
        }
    }
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("SpeechSynthesizerRestfulDemo need params: <token> <app-key>");
            System.exit(-1);
        }
        String token = args[0];
        String appkey = args[1];
        SpeechSynthesizerRestfulChunkedDemo demo = new SpeechSynthesizerRestfulChunkedDemo(appkey, token);
        String text = "我家的后面有一个很大的园，相传叫作百草园。现在是早已并屋子一起卖给朱文公的子孙了，连那最末次的相见也已经隔了七八年，其中似乎确凿只有一些野草；但那时却是我的乐园。";
        // 采用RFC 3986规范进行urlencode编码。
        String textUrlEncode = text;
        try {
            textUrlEncode = URLEncoder.encode(textUrlEncode, "UTF-8")
                .replace("+", "%20")
                .replace("*", "%2A")
                .replace("%7E", "~");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        System.out.println(textUrlEncode);
        String audioSaveFile = "syAudio.wav";
        String format = "wav";
        int sampleRate = 16000;
        // 最后一个参数为true表示使用http chunked机制。
        demo.processGETRequet(textUrlEncode, audioSaveFile, format, sampleRate, "aixia", true);
        System.out.println("### Game Over ###");
    }
}
```

## C++示例

**说明** 
* [下载C++示例](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20231011/umuk/NlsCommonSdk.zip)。  
C++示例使用第三方函数库curl处理HTTPS的请求和响应，使用jsoncpp处理POST请求体的JSON字符串。
* Linux环境下，运行环境最低要求：Glibc 2.5及以上， Gcc4或Ccc5。
* Windows下需解压lib目录下的windows.zip库编译使用。

示例目录说明如下：

* CMakeLists.txt：示例工程的CMakeList文件。
* demo：示例文件。  
| **文件名**            | **描述**             |  
| ------------------ | ------------------ |  
| restfulTtsDemo.cpp | 语音合成RESTful API示例。 |
* include  
| **目录名** | **描述**         |  
| ------- | -------------- |  
| curl    | curl库头文件目录。    |  
| json    | jsoncpp库头文件目录。 |
* lib：包含curl、jsoncpp动态库。  
根据平台不同，使用如下版本软件加载库文件：  
   * linux（Glibc：2.5及以上，Gcc4或Gcc5）  
   * windows（VS2013、VS2015）
* readme.txt：说明文件。
* release.log：更新记录。
* version：版本号。
* build.sh：示例编译脚本。

编译运行操作步骤：

假设示例文件已解压至`path/to`路径下，在Linux终端依次执行如下命令编译运行程序。

* 支持Cmake：  
   1. 确认本地系统已安装Cmake 2.4及以上版本。  
   2. `cd path/to/sdk/lib`。  
   3. `tar -zxvpf linux.tar.gz`。  
   4. `cd path/to/sdk`。  
   5. `./build.sh`。  
   6. `cd path/to/sdk/demo`。  
   7. `./restfulTtsDemo <your-token> <your-appkey>`。
* 不支持Cmake：  
   1. `cd path/to/sdk/lib`。  
   2. `tar -zxvpf linux.tar.gz`。  
   3. `cd path/to/sdk/demo`。  
   4. `g++ -o restfulTtsDemo restfulTtsDemo.cpp -I path/to/sdk/include -L path/to/sdk/lib/linux -ljsoncpp -lssl -lcrypto -lcurl -D_GLIBCXX_USE_CXX11_ABI=0`。  
   5. `export LD_LIBRARY_PATH=path/to/sdk/lib/linux/`。  
   6. `./restfulTtsDemo <your-token> <your-appkey>`。

示例代码如下：

```
#ifdef _WIN32
#include <Windows.h>
#endif
#include <iostream>
#include <string>
#include <map>
#include <fstream>
#include <sstream>
#include "curl/curl.h"
#include "json/json.h"
using namespace std;
#ifdef _WIN32
string GBKToUTF8(const string &strGBK) {
    string strOutUTF8 = "";
    WCHAR * str1;
    int n = MultiByteToWideChar(CP_ACP, 0, strGBK.c_str(), -1, NULL, 0);
    str1 = new WCHAR[n];
    MultiByteToWideChar(CP_ACP, 0, strGBK.c_str(), -1, str1, n);
    n = WideCharToMultiByte(CP_UTF8, 0, str1, -1, NULL, 0, NULL, NULL);
    char * str2 = new char[n];
    WideCharToMultiByte(CP_UTF8, 0, str1, -1, str2, n, NULL, NULL);
    strOutUTF8 = str2;
    delete[] str1;
    str1 = NULL;
    delete[] str2;
    str2 = NULL;
    return strOutUTF8;
}
#endif
void stringReplace(string& src, const string& s1, const string& s2) {
    string::size_type pos = 0;
    while ((pos = src.find(s1, pos)) != string::npos) {
        src.replace(pos, s1.length(), s2);
        pos += s2.length();
    }
}
string urlEncode(const string& src) {
    CURL* curl = curl_easy_init();
    char* output = curl_easy_escape(curl, src.c_str(), src.size());
    string result(output);
    curl_free(output);
    curl_easy_cleanup(curl);
    return result;
}
size_t responseHeadersCallback(void* ptr, size_t size, size_t nmemb, void* userdata)
{
    map<string, string> *headers = (map<string, string>*)userdata;
    string line((char*)ptr);
    string::size_type pos = line.find(':');
    if (pos != line.npos)
    {
        string name = line.substr(0, pos);
        string value = line.substr(pos + 2);
        size_t p = 0;
        if ((p = value.rfind('\r')) != value.npos) {
            value = value.substr(0, p);
        }
        headers->insert(make_pair(name, value));
    }
    return size * nmemb;
}
size_t responseBodyCallback(void* ptr, size_t size, size_t nmemb, void* userData) {
    size_t len = size * nmemb;
    char* pBuf = (char*)ptr;
    string* bodyContent = (string*)userData;
    (*bodyContent).append(string(pBuf, pBuf + len));
    return len;
}
int processGETRequest(string appKey, string token, string text, 
                      string audioSaveFile, string format, int sampleRate) {
    CURL* curl = NULL;
    CURLcode res;
    curl = curl_easy_init();
    if (curl == NULL) {
        return -1;
    }
    string url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
    /**
     * 设置HTTPS URL请求参数
     */
    ostringstream oss;
    oss << url;
    oss << "?appkey=" << appKey;
    oss << "&token=" << token;
    oss << "&text=" << text;
    oss << "&format=" << format;
    oss << "&sample_rate=" << sampleRate;
    // voice 发音人，可选，默认是xiaoyun。
    // oss << "&voice=" << "xiaoyun";
    // volume 音量，范围是0~100，可选，默认50。
    // oss << "&volume=" << 50;
    // speech_rate 语速，范围是-500~500，可选，默认是0。
    // oss << "&speech_rate=" << 0;
    // pitch_rate 语调，范围是-500~500，可选，默认是0。
    // oss << "&pitch_rate=" << 0;
    string request = oss.str();
    cout << request << endl;
    curl_easy_setopt(curl, CURLOPT_URL, request.c_str());
    /**
     * 设置获取响应的HTTPS Headers回调函数
     */
    map<string, string> responseHeaders;
    curl_easy_setopt(curl, CURLOPT_HEADERFUNCTION, responseHeadersCallback);
    curl_easy_setopt(curl, CURLOPT_HEADERDATA, &responseHeaders);
    /**
     * 设置获取响应的HTTPS Body回调函数
     */
    string bodyContent = "";
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, responseBodyCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &bodyContent);
    /**
     * 发送HTTPS GET请求
     */
    res = curl_easy_perform(curl);
    /**
     * 释放资源
     */
    curl_easy_cleanup(curl);
    if (res != CURLE_OK) {
        cerr << "curl_easy_perform failed: " << curl_easy_strerror(res) << endl;
        return -1;
    }
    /**
     * 处理服务端返回的响应
     */
    map<string, string>::iterator it = responseHeaders.find("Content-Type");
    if (it != responseHeaders.end() && it->second.compare("audio/mpeg") == 0) {
        ofstream fs;
        fs.open(audioSaveFile.c_str(), ios::out | ios::binary);
        if (!fs.is_open()) {
            cout << "The audio save file can not open!";
            return -1;
        }
        fs.write(bodyContent.c_str(), bodyContent.size());
        fs.close();
        cout << "The GET request succeed!" << endl;
    }
    else {
        cout << "The GET request failed: " + bodyContent << endl;
        return -1;
    }
    return 0;
}
int processPOSTRequest(string appKey, string token, string text,
                       string audioSaveFile, string format, int sampleRate) {
    CURL* curl = NULL;
    CURLcode res;
    curl = curl_easy_init();
    if (curl == NULL) {
        return -1;
    }
    string url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
    /**
     * 设置HTTPS POST URL
     */
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    /**
     * 设置HTTPS POST请求头部
     */
    struct curl_slist* headers = NULL;
    // Content-Type
    headers = curl_slist_append(headers, "Content-Type:application/json");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    /**
     * 设置HTTPS POST请求体
     */
    Json::Value root;
    Json::FastWriter writer;
    root["appkey"] = appKey;
    root["token"] = token;
    root["text"] = text;
    root["format"] = format;
    root["sample_rate"] = sampleRate;
    // voice 发音人，可选，默认是xiaoyun。
    // root["voice"] = "xiaoyun";
    // volume 音量，范围是0~100，可选，默认50。
    // root["volume"] = 50;
    // speech_rate 语速，范围是-500~500，可选，默认是0。
    // root["speech_rate"] = 0;
    // pitch_rate 语调，范围是-500~500，可选，默认是0。
    // root["pitch_rate"] = 0;
    string task = writer.write(root);
    cout << "POST request Body: " << task << endl;
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, task.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, task.length());
    /**
     * 设置获取响应的HTTPS Headers回调函数
     */
    map<string, string> responseHeaders;
    curl_easy_setopt(curl, CURLOPT_HEADERFUNCTION, responseHeadersCallback);
    curl_easy_setopt(curl, CURLOPT_HEADERDATA, &responseHeaders);
    /**
     * 设置获取响应的HTTPS Body回调函数
     */
    string bodyContent = "";
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, responseBodyCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &bodyContent);
    /**
     * 发送HTTPS POST请求
     */
    res = curl_easy_perform(curl);
    /**
     * 释放资源
     */
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    if (res != CURLE_OK) {
        cerr << "curl_easy_perform failed: " << curl_easy_strerror(res) << endl;
        return -1;
    }
    /**
     * 处理服务端返回的响应
     */
    map<string, string>::iterator it = responseHeaders.find("Content-Type");
    if (it != responseHeaders.end() && it->second.compare("audio/mpeg") == 0) {
        ofstream fs;
        fs.open(audioSaveFile.c_str(), ios::out | ios::binary);
        if (!fs.is_open()) {
            cout << "The audio save file can not open!";
            return -1;
        }
        fs.write(bodyContent.c_str(), bodyContent.size());
        fs.close();
        cout << "The POST request succeed!" << endl;
    }
    else {
        cout << "The POST request failed: " + bodyContent << endl;
        return -1;
    }
    return 0;
}
int main(int argc, char* argv[]) {
    if (argc < 3) {
        cerr << "params is not valid. Usage: ./demo your_token your_appkey" << endl;
        return -1;
    }
    string token = argv[1];
    string appKey = argv[2];
    string text = "今天是周一，天气挺好的。";
#ifdef _WIN32
    text = GBKToUTF8(text);
#endif
    string textUrlEncode = urlEncode(text);
    stringReplace(textUrlEncode, "+", "%20");
    stringReplace(textUrlEncode, "*", "%2A");
    stringReplace(textUrlEncode, "%7E", "~");
    string audioSaveFile = "syAudio.wav";
    string format = "wav";
    int sampleRate = 16000;
    // 全局只初始化一次。
    curl_global_init(CURL_GLOBAL_ALL);
    processGETRequest(appKey, token, textUrlEncode, audioSaveFile, format, sampleRate);
    //processPOSTRequest(appKey, token, text, audioSaveFile, format, sampleRate);
    curl_global_cleanup();
    return 0;
}
```

## Python示例

**说明** 
* Python 2.x请使用httplib模块；Python 3.x请使用http.client模块。
* 创建HTTP/HTTPS连接时，Python 2.x使用httplib模块，Python 3.x使用http.client模块：  
## Python 2.x  
## 创建HTTP连接  
```  
import httplib  
host = 'nls-gateway-cn-shanghai.aliyuncs.com'  
conn = httplib.HTTPConnection(host)  
```  
## 创建HTTPS连接  
```  
import httplib  
host = 'nls-gateway-cn-shanghai.aliyuncs.com'  
conn = httplib.HTTPSConnection(host)  
```  
## Python 3.x  
## 创建HTTP连接  
```  
import http.client  
host = 'nls-gateway-cn-shanghai.aliyuncs.com'  
conn = http.client.HTTPConnection(host)  
```  
## 创建HTTPS连接  
```  
import http.client  
host = 'nls-gateway-cn-shanghai.aliyuncs.com'  
conn = http.client.HTTPSConnection(host)  
```
* 采用RFC 3986规范进行urlencode编码，Python 2.x请使用urllib模块的urllib.quote，Python 3.x请使用urllib.parse模块的urllib.parse.quote\_plus。

```
# -*- coding: UTF-8 -*-
# Python 2.x引入httplib模块。
# import httplib
# Python 3.x引入http.client模块。
import http.client
# Python 2.x引入urllib模块。
# import urllib
# Python 3.x引入urllib.parse模块。
import urllib.parse
import json
def processGETRequest(appKey, token, text, audioSaveFile, format, sampleRate) :
    host = 'nls-gateway-cn-shanghai.aliyuncs.com'
    url = 'https://' + host + '/stream/v1/tts'
    # 设置URL请求参数
    url = url + '?appkey=' + appKey
    url = url + '&token=' + token
    url = url + '&text=' + text
    url = url + '&format=' + format
    url = url + '&sample_rate=' + str(sampleRate)
    # voice 发音人，可选，默认是xiaoyun。
    # url = url + '&voice=' + 'xiaoyun'
    # volume 音量，范围是0~100，可选，默认50。
    # url = url + '&volume=' + str(50)
    # speech_rate 语速，范围是-500~500，可选，默认是0。
    # url = url + '&speech_rate=' + str(0)
    # pitch_rate 语调，范围是-500~500，可选，默认是0。
    # url = url + '&pitch_rate=' + str(0)
    print(url)
    # Python 2.x请使用httplib。
    # conn = httplib.HTTPSConnection(host)
    # Python 3.x请使用http.client。
    conn = http.client.HTTPSConnection(host)
    conn.request(method='GET', url=url)
    # 处理服务端返回的响应。
    response = conn.getresponse()
    print('Response status and response reason:')
    print(response.status ,response.reason)
    contentType = response.getheader('Content-Type')
    print(contentType)
    body = response.read()
    if 'audio/mpeg' == contentType :
        with open(audioSaveFile, mode='wb') as f:
            f.write(body)
        print('The GET request succeed!')
    else :
        print('The GET request failed: ' + str(body))
    conn.close()
def processPOSTRequest(appKey, token, text, audioSaveFile, format, sampleRate) :
    host = 'nls-gateway-cn-shanghai.aliyuncs.com'
    url = 'https://' + host + '/stream/v1/tts'
    # 设置HTTPS Headers。
    httpHeaders = {
        'Content-Type': 'application/json'
        }
    # 设置HTTPS Body。
    body = {'appkey': appKey, 'token': token, 'text': text, 'format': format, 'sample_rate': sampleRate}
    body = json.dumps(body)
    print('The POST request body content: ' + body)
    # Python 2.x请使用httplib。
    # conn = httplib.HTTPSConnection(host)
    # Python 3.x请使用http.client。
    conn = http.client.HTTPSConnection(host)
    conn.request(method='POST', url=url, body=body, headers=httpHeaders)
    # 处理服务端返回的响应。
    response = conn.getresponse()
    print('Response status and response reason:')
    print(response.status ,response.reason)
    contentType = response.getheader('Content-Type')
    print(contentType)
    body = response.read()
    if 'audio/mpeg' == contentType :
        with open(audioSaveFile, mode='wb') as f:
            f.write(body)
        print('The POST request succeed!')
    else :
        print('The POST request failed: ' + str(body))
    conn.close()
appKey = '您的appkey'
token = '您的token'
text = '今天是周一，天气挺好的。'
# 采用RFC 3986规范进行urlencode编码。
textUrlencode = text
# Python 2.x请使用urllib.quote。
# textUrlencode = urllib.quote(textUrlencode, '')
# Python 3.x请使用urllib.parse.quote_plus。
textUrlencode = urllib.parse.quote_plus(textUrlencode)
textUrlencode = textUrlencode.replace("+", "%20")
textUrlencode = textUrlencode.replace("*", "%2A")
textUrlencode = textUrlencode.replace("%7E", "~")
print('text: ' + textUrlencode)
audioSaveFile = 'syAudio.wav'
format = 'wav'
sampleRate = 16000
# GET请求方式
processGETRequest(appKey, token, textUrlencode, audioSaveFile, format, sampleRate)
# POST请求方式
# processPOSTRequest(appKey, token, text, audioSaveFile, format, sampleRate)
```

## PHP示例

**重要** 

PHP示例中使用了cURL函数，要求PHP版本在4.0.2以上，并且确保已安装cURL扩展。

```
<?php
function processGETRequest($appkey, $token, $text, $audioSaveFile, $format, $sampleRate) {
    $url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
    $url = $url . "?appkey=" . $appkey;
    $url = $url . "&token=" . $token;
    $url = $url . "&text=" . $text;
    $url = $url . "&format=" . $format;
    $url = $url . "&sample_rate=" . strval($sampleRate);
    // voice 发音人，可选，默认是xiaoyun。
    // $url = $url . "&voice=" . "xiaoyun";
    // volume 音量，范围是0~100，可选，默认50。
    // $url = $url . "&volume=" . strval(50);
    // speech_rate 语速，范围是-500~500，可选，默认是0。
    // $url = $url . "&speech_rate=" . strval(0);
    // pitch_rate 语调，范围是-500~500，可选，默认是0。
    // $url = $url . "&pitch_rate=" . strval(0);
    print $url . "\n";
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
    /**
     * 设置HTTPS GET URL。
     */
    curl_setopt($curl, CURLOPT_URL, $url);
    /**
     * 设置返回的响应包含HTTPS头部信息。
     */
    curl_setopt($curl, CURLOPT_HEADER, TRUE);
    /**
     * 发送HTTPS GET请求。
     */
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);
    $response = curl_exec($curl);
    if ($response == FALSE) {
        print "curl_exec failed!\n";
        curl_close($curl);
        return ;
    }
    /**
     * 处理服务端返回的响应。
     */
    $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $bodyContent = substr($response, $headerSize);
    curl_close($curl);
    if (stripos($headers, "Content-Type: audio/mpeg") != FALSE || stripos($headers, "Content-Type:audio/mpeg") != FALSE) {
        file_put_contents($audioSaveFile, $bodyContent);
        print "The GET request succeed!\n";
    }
    else {
        print "The GET request failed: " . $bodyContent . "\n";
    }
}
function processPOSTRequest($appkey, $token, $text, $audioSaveFile, $format, $sampleRate) {
    $url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
    /**
     * 请求参数，以JSON格式字符串填入HTTPS POST请求的Body中。
     */
    $taskArr = array(
        "appkey" => $appkey,
        "token" => $token,
        "text" => $text,
        "format" => $format,
        "sample_rate" => $sampleRate
        // voice 发音人，可选，默认是xiaoyun。
        // "voice" => "xiaoyun",
        // volume 音量，范围是0~100，可选，默认50。
        // "volume" => 50,
        // speech_rate 语速，范围是-500~500，可选，默认是0。
        // "speech_rate" => 0,
        // pitch_rate 语调，范围是-500~500，可选，默认是0。
        // "pitch_rate" => 0
    );
    $body = json_encode($taskArr);
    print "The POST request body content: " . $body . "\n";
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
    /**
     * 设置HTTPS POST URL。
     */
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_POST, TRUE);
    /**
     * 设置HTTPS POST请求头部。
     * */
    $httpHeaders = array(
        "Content-Type: application/json"
    );
    curl_setopt($curl, CURLOPT_HTTPHEADER, $httpHeaders);
    /**
     * 设置HTTPS POST请求体。
     */
    curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    /**
     * 设置返回的响应包含HTTPS头部信息。
     */
    curl_setopt($curl, CURLOPT_HEADER, TRUE);
    /**
     * 发送HTTPS POST请求。
     */
    $response = curl_exec($curl);
    if ($response == FALSE) {
        print "curl_exec failed!\n";
        curl_close($curl);
        return ;
    }
    /**
     * 处理服务端返回的响应。
     */
    $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $bodyContent = substr($response, $headerSize);
    curl_close($curl);
    if (stripos($headers, "Content-Type: audio/mpeg") != FALSE || stripos($headers, "Content-Type:audio/mpeg") != FALSE) {
        file_put_contents($audioSaveFile, $bodyContent);
        print "The POST request succeed!\n";
    }
    else {
        print "The POST request failed: " . $bodyContent . "\n";
    }
}
$appkey = "您的appkey";
$token = "您的token";
$text = "今天是周一，天气挺好的。";
$textUrlEncode = urlencode($text);
$textUrlEncode = preg_replace('/\+/', '%20', $textUrlEncode);
$textUrlEncode = preg_replace('/\*/', '%2A', $textUrlEncode);
$textUrlEncode = preg_replace('/%7E/', '~', $textUrlEncode);
$audioSaveFile = "syAudio.wav";
$format = "wav";
$sampleRate = 16000;
processGETRequest($appkey, $token, $textUrlEncode, $audioSaveFile, $format, $sampleRate);
// processPOSTRequest($appkey, $token, $text, $audioSaveFile, $format, $sampleRate);
?>
```

## Node.js示例

**说明** 

首先安装request依赖，请在您的示例文件所在目录执行如下命令：

```
npm install request --save
```

```
const request = require('request');
const fs = require('fs');
function processGETRequest(appkey, token, text, audioSaveFile, format, sampleRate) {
    var url = 'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts';
    /**
     * 设置URL请求参数。
     */
    url = url + '?appkey=' + appkey;
    url = url + '&token=' + token;
    url = url + '&text=' + text;
    url = url + '&format=' + format;
    url = url + '&sample_rate=' + sampleRate;
    // voice 发音人，可选，默认是xiaoyun。
    // url = url + "&voice=" + "xiaoyun";
    // volume 音量，范围是0~100，可选，默认50。
    // url = url + "&volume=" + 50;
    // speech_rate 语速，范围是-500~500，可选，默认是0。
    // url = url + "&speech_rate=" + 0;
    // pitch_rate 语调，范围是-500~500，可选，默认是0。
    // url = url + "&pitch_rate=" + 0;
    console.log(url);
    /**
     * 设置HTTPS GET请求。
     * encoding必须设置为null，HTTPS响应的Body为二进制Buffer类型。
     */
    var options = {
        url: url,
        method: 'GET',
        encoding: null
    };
    request(options, function (error, response, body) {
        /**
         * 处理服务端的响应。
         */
        if (error != null) {
            console.log(error);
        }
        else {
            var contentType = response.headers['content-type'];
            if (contentType === undefined || contentType != 'audio/mpeg') {
                console.log(body.toString());
                console.log('The GET request failed!');
            }
            else {
                fs.writeFileSync(audioSaveFile, body);
                console.log('The GET request is succeed!');
            }
        }
    });
}
function processPOSTRequest(appkeyValue, tokenValue, textValue, audioSaveFile, formatValue, sampleRateValue) {
    var url = 'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts';
    /**
     * 请求参数，以JSON格式字符串填入HTTPS POST请求的Body中。
    */
    var task = {
        appkey : appkeyValue,
        token : tokenValue,
        text : textValue,
        format : formatValue,
        sample_rate : sampleRateValue
        // voice 发音人，可选，默认是xiaoyun。
        // voice : 'xiaoyun',
        // volume 音量，范围是0~100，可选，默认50。
        // volume : 50,
        // speech_rate 语速，范围是-500~500，可选，默认是0。
        // speech_rate : 0,
        // pitch_rate 语调，范围是-500~500，可选，默认是0。
        // pitch_rate : 0
    };
    var bodyContent = JSON.stringify(task);
    console.log('The POST request body content: ' + bodyContent);
    /**
     * 设置HTTPS POST请求头部。
     */
    var httpHeaders = {
        'Content-type' : 'application/json'
    }
    /**
     * 设置HTTPS POST请求。
     * encoding必须设置为null，HTTPS响应的Body为二进制Buffer类型。
     */
    var options = {
        url: url,
        method: 'POST',
        headers: httpHeaders,
        body: bodyContent,
        encoding: null
    };
    request(options, function (error, response, body) {
        /**
         * 处理服务端的响应。
         */
        if (error != null) {
            console.log(error);
        }
        else {
            var contentType = response.headers['content-type'];
            if (contentType === undefined || contentType != 'audio/mpeg') {
                console.log(body.toString());
                console.log('The POST request failed!');
            }
            else {
                fs.writeFileSync(audioSaveFile, body);
                console.log('The POST request is succeed!');
            }
        }
    });
}
var appkey = '您的appkey';
var token = '您的token';
var text = '今天是周一，天气挺好的。';
var textUrlEncode = encodeURIComponent(text)
                    .replace(/[!'()*]/g, function(c) {
                        return '%' + c.charCodeAt(0).toString(16);
                    });
console.log(textUrlEncode);
var audioSaveFile = 'syAudio.wav';
var format = 'wav';
var sampleRate = 16000;
processGETRequest(appkey, token, textUrlEncode, audioSaveFile, format, sampleRate);
// processPOSTRequest(appkey, token, text, audioSaveFile, format, sampleRate);
```

## .Net示例

**说明** 

示例使用依赖System.Net.Http、System.Web、Newtonsoft.Json.Linq。

```
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Net.Http;
using System.Web;
using Newtonsoft.Json.Linq;
namespace RESTfulAPI
{
    class SpeechSynthesizerRESTfulDemo
    {
        private string appkey;
        private string token;
        public SpeechSynthesizerRESTfulDemo(string appkey, string token)
        {
            this.appkey = appkey;
            this.token = token;
        }
        public void processGETRequest(string text, string audioSaveFile, string format, int sampleRate)
        {
            /**
             * 设置HTTPS GET请求：
             * 1.使用HTTPS协议
             * 2.语音识别服务域名：nls-gateway-cn-shanghai.aliyuncs.com
             * 3.语音识别接口请求路径：/stream/v1/tts
             * 4.设置必须请求参数：appkey、token、text、format、sample_rate
             * 5.设置可选请求参数：voice、volume、speech_rate、pitch_rate
             */
            string url = "http://nls-gateway.aliyuncs.com/stream/v1/tts";
            url = url + "?appkey=" + appkey;
            url = url + "&token=" + token;
            url = url + "&text=" + text;
            url = url + "&format=" + format;
            url = url + "&sample_rate=" + sampleRate.ToString();
            // voice 发音人，可选，默认是xiaoyun。
            // url = url + "&voice=" + "xiaoyun";
            // volume 音量，范围是0~100，可选，默认50。
            // url = url + "&volume=" + 50;
            // speech_rate 语速，范围是-500~500，可选，默认是0。
            // url = url + "&speech_rate=" + 0;
            // pitch_rate 语调，范围是-500~500，可选，默认是0。
            // url = url + "&pitch_rate=" + 0;
            System.Console.WriteLine(url);
            /**
             * 发送HTTPS GET请求，处理服务端的响应。
             */
            HttpClient client = new HttpClient();
            HttpResponseMessage response = null;
            response = client.GetAsync(url).Result;
            string contentType = null;
            if (response.IsSuccessStatusCode)
            {
                string[] typesArray = response.Content.Headers.GetValues("Content-Type").ToArray();
                if (typesArray.Length > 0)
                {
                    contentType = typesArray.First();
                }
            }
            if ("audio/mpeg".Equals(contentType))
            {
                byte[] audioBuff = response.Content.ReadAsByteArrayAsync().Result;
                FileStream fs = new FileStream(audioSaveFile, FileMode.Create);
                fs.Write(audioBuff, 0, audioBuff.Length);
                fs.Flush();
                fs.Close();
                System.Console.WriteLine("The GET request succeed!");
            }
            else
            {
                // ContentType 为 null 或者为 "application/json"
                System.Console.WriteLine("Response status code and reason phrase: " +
                    response.StatusCode + " " + response.ReasonPhrase);
                string responseBodyAsText = response.Content.ReadAsStringAsync().Result;
                System.Console.WriteLine("The GET request failed: " + responseBodyAsText);
            }
        }
        public void processPOSTRequest(string text, string audioSaveFile, string format, int sampleRate)
        {
            /**
             * 设置HTTPS POST请求：
             * 1.使用HTTPS协议
             * 2.语音合成服务域名：nls-gateway-cn-shanghai.aliyuncs.com
             * 3.语音合成接口请求路径：/stream/v1/tts
             * 4.设置必须请求参数：appkey、token、text、format、sample_rate
             * 5.设置可选请求参数：voice、volume、speech_rate、pitch_rate
             */
            string url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts";
            JObject obj = new JObject();
            obj["appkey"] = appkey;
            obj["token"] = token;
            obj["text"] = text;
            obj["format"] = format;
            obj["sample_rate"] = sampleRate;
            // voice 发音人，可选，默认是xiaoyun。
            // obj["voice"] = "xiaoyun";
            // volume 音量，范围是0~100，可选，默认50。
            // obj["volume"] = 50;
            // speech_rate 语速，范围是-500~500，可选，默认是0。
            // obj["speech_rate"] = 0;
            // pitch_rate 语调，范围是-500~500，可选，默认是0。
            // obj["pitch_rate"] = 0;
            String bodyContent = obj.ToString();
            StringContent content = new StringContent(bodyContent, Encoding.UTF8, "application/json");
            /**
             * 发送HTTPS POST请求，处理服务端的响应。
             */
            HttpClient client = new HttpClient();
            HttpResponseMessage response = client.PostAsync(url, content).Result;
            string contentType = null;
            if (response.IsSuccessStatusCode)
            {
                string[] typesArray = response.Content.Headers.GetValues("Content-Type").ToArray();
                if (typesArray.Length > 0)
                {
                    contentType = typesArray.First();
                }
            }
            if ("audio/mpeg".Equals(contentType))
            {
                byte[] audioBuff = response.Content.ReadAsByteArrayAsync().Result;
                FileStream fs = new FileStream(audioSaveFile, FileMode.Create);
                fs.Write(audioBuff, 0, audioBuff.Length);
                fs.Flush();
                fs.Close();
                System.Console.WriteLine("The POST request succeed!");
            }
            else
            {
                System.Console.WriteLine("Response status code and reason phrase: " +
                    response.StatusCode + " " + response.ReasonPhrase);
                string responseBodyAsText = response.Content.ReadAsStringAsync().Result;
                System.Console.WriteLine("The POST request failed: " + responseBodyAsText);
            }
        }
        static void Main(string[] args)
        {
            if (args.Length < 2)
            {
                System.Console.WriteLine("SpeechSynthesizerRESTfulDemo need params: <token> <app-key>");
                return;
            }
            string token = args[0];
            string appkey = args[1];
            SpeechSynthesizerRESTfulDemo demo = new SpeechSynthesizerRESTfulDemo(appkey, token);
            string text = "今天是周一，天气挺好的。";
            // 采用RFC 3986规范进行urlencode编码。
            string textUrlEncode = text;
            textUrlEncode = HttpUtility.UrlEncode(textUrlEncode, Encoding.UTF8)
                .Replace("+", "%20")
                .Replace("*", "%2A")
                .Replace("%7E", "~");
            System.Console.WriteLine(textUrlEncode);
            string audioSaveFile = "syAudio.wav";
            string format = "wav";
            int sampleRate = 16000;
            demo.processGETRequest(textUrlEncode, audioSaveFile, format, sampleRate);
            //demo.processPOSTRequest(text, audioSaveFile, format, sampleRate);
        }
    }
}
```

## GO示例

```
package main
import (
    "fmt"
    "net/url"
    "net/http"
    "io/ioutil"
    "encoding/json"
    "strconv"
    "os"
    "bytes"
    "strings"
)
func processGETRequest(appkey string, token string, text string, audioSaveFile string, format string, sampleRate int) {
    /**
     * 设置HTTPS GET请求：
     * 1.使用HTTPS协议
     * 2.语音识别服务域名：nls-gateway-cn-shanghai.aliyuncs.com
     * 3.语音识别接口请求路径：/stream/v1/tts
     * 4.设置必须请求参数：appkey、token、text、format、sample_rate
     * 5.设置可选请求参数：voice、volume、speech_rate、pitch_rate
     */
    var url string = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts"
    url = url + "?appkey=" + appkey
    url = url + "&token=" + token
    url = url + "&text=" + text
    url = url + "&format=" + format
    url = url + "&sample_rate=" + strconv.Itoa(sampleRate)
    // voice 发音人，可选，默认是xiaoyun。
    // url = url + "&voice=" + "xiaoyun"
    // volume 音量，范围是0~100，可选，默认50。
    // url = url + "&volume=" + strconv.Itoa(50)
    // speech_rate 语速，范围是-500~500，可选，默认是0。
    // url = url + "&speech_rate=" + strconv.Itoa(0)
    // pitch_rate 语调，范围是-500~500，可选，默认是0。
    // url = url + "&pitch_rate=" + strconv.Itoa(0)
    fmt.Println(url)
    /**
     * 发送HTTPS GET请求，处理服务端的响应。
     */
    response, err := http.Get(url)
    if err != nil {
        fmt.Println("The GET request failed!")
        panic(err)
    }
    defer response.Body.Close()    
    contentType := response.Header.Get("Content-Type")
    body, _ := ioutil.ReadAll(response.Body)
    if ("audio/mpeg" == contentType) {
        file, _ := os.Create(audioSaveFile)
        defer file.Close()
        file.Write([]byte(body))
        fmt.Println("The GET request succeed!")
    } else {
        // ContentType 为 null 或者为 "application/json"
        statusCode := response.StatusCode
        fmt.Println("The HTTP statusCode: " + strconv.Itoa(statusCode))
        fmt.Println("The GET request failed: " + string(body))
    }
}
func processPOSTRequest(appkey string, token string, text string, audioSaveFile string, format string, sampleRate int) {
    /**
     * 设置HTTPS POST请求：
     * 1.使用HTTPS协议
     * 2.语音合成服务域名：nls-gateway-cn-shanghai.aliyuncs.com
     * 3.语音合成接口请求路径：/stream/v1/tts
     * 4.设置必须请求参数：appkey、token、text、format、sample_rate
     * 5.设置可选请求参数：voice、volume、speech_rate、pitch_rate
     */
    var url string = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts"
    bodyContent := make(map[string]interface{})
    bodyContent["appkey"] = appkey
    bodyContent["text"] = text
    bodyContent["token"] = token
    bodyContent["format"] = format
    bodyContent["sample_rate"] = sampleRate
    // voice 发音人，可选，默认是xiaoyun。
    // bodyContent["voice"] = "xiaoyun"
    // volume 音量，范围是0~100，可选，默认50。
    // bodyContent["volume"] = 50
    // speech_rate 语速，范围是-500~500，可选，默认是0。
    // bodyContent["speech_rate"] = 0
    // pitch_rate 语调，范围是-500~500，可选，默认是0。
    // bodyContent["pitch_rate"] = 0
    bodyJson, err := json.Marshal(bodyContent)
    if err != nil {
        panic(nil)
    }
    fmt.Println(string(bodyJson))
    /**
     * 发送HTTPS POST请求，处理服务端的响应。
     */
    response, err := http.Post(url, "application/json;charset=utf-8", bytes.NewBuffer([]byte(bodyJson)))
    if err != nil {
        panic(err)
    }
    defer response.Body.Close()
    contentType := response.Header.Get("Content-Type")
    body, _ := ioutil.ReadAll(response.Body)
    if ("audio/mpeg" == contentType) {
        file, _ := os.Create(audioSaveFile)
        defer file.Close()
        file.Write([]byte(body))
        fmt.Println("The POST request succeed!")
    } else {
        // ContentType 为 null 或者为 "application/json"
        statusCode := response.StatusCode
        fmt.Println("The HTTP statusCode: " + strconv.Itoa(statusCode))
        fmt.Println("The POST request failed: " + string(body))
    }    
}
func main() {
    var appkey string = "您的appkey"
    var token  string = "您的token"
    var text string = "今天是周一，天气挺好的。"
    var textUrlEncode = text
    textUrlEncode = url.QueryEscape(textUrlEncode)
    textUrlEncode = strings.Replace(textUrlEncode, "+", "%20", -1)
    textUrlEncode = strings.Replace(textUrlEncode, "*", "%2A", -1)
    textUrlEncode = strings.Replace(textUrlEncode, "%7E", "~", -1)
    fmt.Println(textUrlEncode)
    var audioSaveFile string = "syAudio.wav"
    var format string = "wav"
    var sampleRate int = 16000
    processGETRequest(appkey, token, textUrlEncode, audioSaveFile, format, sampleRate)
    // processPOSTRequest(appkey, token, text, audioSaveFile, format, sampleRate)
}
```

[上一篇：接口说明](/zh/isi/developer-reference/overview-of-speech-synthesis)[下一篇：移动端SDK](/zh/isi/developer-reference/nui-sdk-for-mobile-clients-2/)

该文章对您有帮助吗？

反馈

```json
{
      "@context": "https://schema.org",
      "@type": "WebPage",
      "url": "https://help.aliyun.com/zh/isi/developer-reference/restful-api-3",
      "publisher": {
        "@type": "Organization",
        "name": "阿里云计算",
        "url": "https://www.aliyun.com/",
        "logo": "https://img.alicdn.com/imgextra/i1/O1CN01BEqugB1KebzCRyIJl_!!6000000001189-55-tps-48-48.svg"
      }
    }
```
