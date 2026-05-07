import request from "@/utils/request";
import axios from "axios";

export const uploadVoice = (data) => {
    return request({
        url: "/deal/speechToText",
        method: "post",
        data,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
}

export const uploadVoice1 = (data) => {
    return axios({
        url: "https://asr-proxy.cucvir.workers.dev/api/asr/recognize",
        method: "post",
        data,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
}
// 语音转文字
export const apiSpeechToText = (data) => {
    return request({
        url: "/deal/speechToText",
        method: "post",
        data,
        headers: { "Content-Type": "multipart/form-data" },
    })
}
// 文字转语音 (注意这里用 axios 处理二进制流的方式)
export const apiTextToSpeech = (text) => {
    return request({
        url: "/deal/textToSpeech3",
        method: "get",
        params: { text },
        responseType: 'arraybuffer' // 关键！告诉 axios 这是二进制音频，不是 JSON
    })
}
// LLM 聊天对话
export const apiLlmChat = (data) => {
    return request({
        url: "/conversation/chat",
        method: "post",
        data
    })
}
// 生成报告
export const apiGenerateReport = (data) => {
    return request({
        url: "/conversation/report",
        method: "post",
        data
    })
}
// 获取通话记录列表 (带分页)
export const apiGetCallSessions = (params) => {
    return request({
        url: "/callsessions", 
        method: "get",
        params: params // Axios 会自动把对象变成 ?PageNumber=1&PageSize=20 拼在 URL 后面
    })
}
// 获取单个通话记录详情
export const apiGetCallSessionDetail = (id) => {
    return request({
        url: `/callsessions/${id}`,
        method: "get"
    })
}

// 删除单个通话记录会话
export const apiDeleteCallSession = (id) => {
    return request({
        url: `/callsessions/${id}`,
        method: "delete"
    })
}