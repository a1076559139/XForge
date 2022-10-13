/**
 * 将URL中的参数字符串转成object
 */
 const parseQueryString = function (queryStr: string) {
    if (!queryStr) { return {}; }
    queryStr = queryStr.split('?').pop();
    if (!queryStr) { return {}; }

    queryStr = decodeURIComponent(queryStr);

    const arrQuery = queryStr.split('&'), oQuery = {};
    for (let i = 0, ii = arrQuery.length; i < ii; i++) {
        const arrTmp = arrQuery[i].split('=');
        if (arrTmp.length === 2) {
            oQuery[arrTmp[0]] = arrTmp[1];
        }
    }
    return oQuery;
};

/**
 * 将object转成URL参数的格式
 */
const stringifyQueryString = function (params: string | object) {
    if (typeof params === 'string') {
        return params;
    } else if (params === null || typeof params !== 'object') {
        return encodeURIComponent(JSON.stringify(params));
    } else {
        let qs = '';
        for (let i in params) {
            if (params[i] !== undefined) {
                if (typeof params[i] === 'object') {
                    qs += '&' + i + '=' + encodeURIComponent(JSON.stringify(params[i]));
                } else {
                    qs += '&' + i + '=' + encodeURIComponent(params[i]);
                }
            }
        }
        return qs.slice(1);
    }
};

const bufferType = [
    'Blob',
    'ArrayBuffer',
    'Int8Array',        // 1byte  -128 to 127
    'Uint8Array',       // 1byte  0 to 255
    'Uint8ClampedArray', // 1byte  0 to 255
    'Int16Array',       // 2byte  -32768 to 32767
    'Uint16Array',      // 2byte  0 to 65535
    'Int32Array',       // 4byte  -2147483648 to 2147483647
    'Uint32Array',      // 4byte  0 to 4294967295
    'Float32Array',     // 4byte  1.2x10^-38 to 3.4x10^38
    'Float64Array',     // 8byte  5.0x10^-324 to 1.8x10^308
    'BigInt64Array',    // 8byte  -2^63 to (2^63)-1
    'BigUint64Array'    // 8byte  0 to (2^64)-1
];
const isBuffer = function (param: any) {
    const type = Object.prototype.toString.call(param).slice(8, -1);
    return bufferType.indexOf(type) > -1;
};

interface option {
    url: string,
    data?: any,
    method?: 'post' | 'get' | 'GET' | 'POST',
    timeout?: number,
    responseType?: XMLHttpRequestResponseType,
    headers?: object
}

interface callback {
    (error: string, data?: any, request?: XMLHttpRequest): void
}

interface verification {
    (data?: any): string
}

export default class http {
    /**
     * 发文本、json、二进制
     * 收文本、json、二进制
     */
    static quest(option: option, callback: callback): XMLHttpRequest {
        // 请求类型
        let method = option.method || 'GET';
        // responseType
        let responseType: XMLHttpRequestResponseType = option.responseType || ''; //arraybuffer
        // 超时时间
        let timeout = option.timeout || 5000;
        // 请求头
        let headers = option.headers || { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }; // application/json text/plain

        // 请求网址、数据、数据类型
        let url = '';
        let data = null;
        let buffer = false;
        if (method === 'post' || method === 'POST') {
            if (option.data) {
                url = option.url;
                data = option.data;
            } else {
                url = option.url.split('?')[0];
                data = parseQueryString(option.url);
            }
            buffer = isBuffer(data);
        } else {
            if (option.data) {
                if (option.url.indexOf('?') >= 0) {
                    url = option.url + '&' + stringifyQueryString(option.data);
                } else {
                    url = option.url + '?' + stringifyQueryString(option.data);
                }
            } else {
                url = option.url;
            }
        }

        // 请求实例
        let request = new XMLHttpRequest();
        request.open(method.toLocaleLowerCase(), url, true);

        // responseType 一般为'arraybuffer'或''
        if (responseType) request.responseType = responseType;

        // 设置超时时间
        if (timeout > 0) request.timeout = timeout;

        // 是否是json
        let isJson = buffer ? false : (data !== null && typeof data !== 'string');
        if (isJson && (!option.headers || !option.headers['Content-Type'])) {
            headers['Content-Type'] = 'application/json; charset=UTF-8';
        }

        // 设置请求头
        for (let key in headers) { request.setRequestHeader(key, headers[key]); }

        // 发送请求
        request.send(isJson ? JSON.stringify(data) : data);

        // 进度
        // request.onprogress = function () {
        // }

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                if (responseType === 'arraybuffer') {
                    callback && callback(null, request.response, request);
                } else {
                    try {
                        callback && callback(null, JSON.parse(request.responseText), request);
                    } catch (e) {
                        callback && callback(null, request.responseText, request);
                    }
                }
            } else {
                callback && callback('status: ' + request.status, request.responseText, request);
            }
            callback = null;
        };

        const ontimeout = function () {
            if (callback) {
                callback('timeout');
                callback = null;
                console.log('[http] %c连%c接%c超%c时 %s', 'color:red', 'color:orange', 'color:purple', 'color:green', url);
            }
        };
        request.ontimeout = ontimeout;

        request.onerror = function () {
            if (callback) {
                callback('error');
                callback = null;
                console.log('[http] %c连%c接%c失%c败 %s', 'color:red', 'color:orange', 'color:purple', 'color:green', url);
            }
        };
        request.onabort = function () {
            if (callback) {
                callback('abort');
                callback = null;
                console.log('[http] %c连%c接%c终%c止 %s', 'color:red', 'color:orange', 'color:purple', 'color:green', url);
            }
        };

        if (timeout) {
            setTimeout(() => {
                if (callback) {
                    ontimeout();
                    request.abort();
                }
            }, timeout);
        }

        return request;
    }

    /**
     * http.get('login?code=asdi1239028sadadhjk213h', function(){})
     * http.get({url:'login', data:{code:'asdi1239028sadadhjk213h'}}, function(){})
     * http.get({url:'login', data:{code:'asdi1239028sadadhjk213h'}, responseType:'arraybuffer'}, function(){})
     * 
     */
    static get(url: string | option, callback?: callback, verification?: verification) {
        const option: option = typeof url === 'string' ? { url: url } : url;
        option.method = 'get';
        return this.quest(option, function (err, res) {
            if (!err && verification) {
                err = verification(res);
            }
            callback && callback(err, res);
        });
    }
    /**
     * http.post('login', function(){})
     * http.post('login?code=asdi1239028sadadhjk213h', function(){})
     * http.post({ url:'login', data:{code:'asdi1239028sadadhjk213h'} }, function(){})
     * http.post({ url:'login', data:{code:'asdi1239028sadadhjk213h'}, responseType:'arraybuffer' }, function(){})
     */
    static post(url: string | option, callback?: callback, verification?: verification) {
        const option: option = typeof url === 'string' ? { url: url } : url;
        option.method = 'post';
        return this.quest(option, function (err, res) {
            if (!err && verification) {
                err = verification(res);
            }
            callback && callback(err, res);
        });
    }

    /**
     * 加载二进制
     */
    static downloadBinary(url: string | option, callback?: callback) {
        const option: option = typeof url === 'string' ? { url: url } : url;
        option.responseType = 'arraybuffer';

        return this.get(option, function (err, res) {
            if (isBuffer(res)) res = new Uint8Array(res);
            callback && callback(err, res);
        });
    }
}