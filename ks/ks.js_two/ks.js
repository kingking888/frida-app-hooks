// frida -U -f com.smile.gifmaker -l ks.js --no-pause

console.log('Android ks hook start!');

var Cls_Call = "okhttp3.Call";
var Cls_CallBack = "okhttp3.Callback";
var Cls_OkHttpClient = "okhttp3.OkHttpClient";
var Cls_Request = "okhttp3.Request";
var Cls_Response = "okhttp3.Response";
var Cls_ResponseBody = "okhttp3.ResponseBody";
var Cls_okio_Buffer = "f0.f";
var F_header_namesAndValues = "namesAndValues";
var F_req_body = "body";
var F_req_headers = "headers";
var F_req_method = "method";
var F_req_url = "url";
var F_rsp$builder_body = "body";
var F_rsp_body = "body";
var F_rsp_code = "code";
var F_rsp_headers = "headers";
var F_rsp_message = "message";
var F_rsp_request = "request";
var M_CallBack_onFailure = "onFailure";
var M_CallBack_onResponse = "onResponse";
var M_Call_enqueue = "enqueue";
var M_Call_execute = "execute";
var M_Call_request = "request";
var M_Client_newCall = "newCall";
var M_buffer_readByteArray = "readByteArray";
var M_contentType_charset = "charset";
var M_reqbody_contentLength = "contentLength";
var M_reqbody_contentType = "contentType";
var M_reqbody_writeTo = "writeTo";
var M_rsp$builder_build = "build";
var M_rspBody_contentLength = "contentLength";
var M_rspBody_contentType = "contentType";
var M_rspBody_create = "create";
var M_rspBody_source = "source";
var M_rsp_newBuilder = "newBuilder";


//----------------------------------
var JavaStringWapper = null;
var JavaIntegerWapper = null;
var JavaStringBufferWapper = null;
var GsonWapper = null;
var ListWapper = null;
var ArrayListWapper = null;
var ArraysWapper = null;
var CharsetWapper = null;
var CharacterWapper = null;

var OkioByteStrngWapper = null;
var OkioBufferWapper = null;

var OkHttpClientWapper = null;
var ResponseBodyWapper = null;
var BufferWapper = null;
var Utils = null;
//----------------------------------
var CallCache = []
var hookedArray = []
var filterArray = ["JPG", "jpg", "PNG", "png", "WEBP", "webp", "JPEG", "jpeg", "GIF", "gif", ".zip", ".data"] // , "feed/hot"]

var showArray = ["abtest"]


/**
 * hex to string
 */
function hexToUtf8(hex) {
    try {
        return decodeURIComponent('%' + hex.match(/.{1,2}/g).join('%'));
    } catch (error) {
        return "hex[" + hex + "]";
    }
}

/**
 */
function getFieldValue(object, fieldName) {
    var field = object.class.getDeclaredField(fieldName);
    field.setAccessible(true)
    var fieldValue = field.get(object)
    if (null == fieldValue) {
        return null;
    }
    var FieldClazz = Java.use(fieldValue.$className)
    var fieldValueWapper = Java.cast(fieldValue, FieldClazz)
    return fieldValueWapper
}

/**
 */
function getWrapper(javaobject) {
    return Java.cast(javaobject, Java.use(javaobject.$className))
}

/**
 */
function headersToList(headers) {
    var gson = GsonWapper.$new()
    var namesAndValues = getFieldValue(headers, F_header_namesAndValues)
    var jsonString = gson.toJson(namesAndValues)
    var namesAndValuesList = Java.cast(gson.fromJson(jsonString, ListWapper.class), ListWapper)
    return namesAndValuesList;
}

function getHeaderSize(namesAndValuesList) {
    return namesAndValuesList.size() / 2
}


function getHeaderName(namesAndValuesList, index) {
    return namesAndValuesList.get(index * 2)
}
function getHeaderValue(namesAndValuesList, index) {
    return namesAndValuesList.get((index * 2) + 1)
}

function getByHeader(namesAndValuesList, name) {
    var nameString = JavaStringWapper.$new(name)
    Java.perform(function () {
        var length = namesAndValuesList.size()
        var nameByList = "";
        do {
            length -= 2;
            if (length < 0) {
                return null;
            }
            // console.log("namesAndValuesList: "+namesAndValuesList.$className)
            nameByList = namesAndValuesList.get(JavaIntegerWapper.valueOf(length).intValue())
        } while (!nameString.equalsIgnoreCase(nameByList));
        return namesAndValuesList.get(length + 1);

    })
}

function bodyEncoded(namesAndValuesList) {
    if (null == namesAndValuesList) return false;
    var contentEncoding = getByHeader(namesAndValuesList, "Content-Encoding")
    var bodyEncoded = contentEncoding != null && !JavaStringWapper.$new("identity").equalsIgnoreCase(contentEncoding)
    return bodyEncoded

}

function hasBody(response, namesAndValuesList) {
    var request = getFieldValue(response, F_rsp_request)
    var m = getFieldValue(request, F_req_method);
    if (JavaStringWapper.$new("HEAD").equals(m)) {
        return false;
    }
    var Transfer_Encoding = "";
    var respHeaderSize = getHeaderSize(namesAndValuesList)
    for (var i = 0; i < respHeaderSize; i++) {
        if (JavaStringWapper.$new("Transfer-Encoding").equals(getHeaderName(namesAndValuesList, i))) {
            Transfer_Encoding = getHeaderValue(namesAndValuesList, i);
            break
        }
    }
    var code = getFieldValue(response, F_rsp_code)
    if (((code >= 100 && code < 200) || code == 204 || code == 304)
        && response[M_rspBody_contentLength] == -1
        && !JavaStringWapper.$new("chunked").equalsIgnoreCase(Transfer_Encoding)
    ) {
        return false;
    }
    return true;
}

function isPlaintext(byteString) {
    try {
        var bufferSize = byteString.size()
        var buffer = NewBuffer(byteString)
        for (var i = 0; i < 16; i++) {
            if (bufferSize == 0) {
                console.log("bufferSize == 0")
                break
            }
            var codePoint = buffer.readUtf8CodePoint()
            if (CharacterWapper.isISOControl(codePoint) && !CharacterWapper.isWhitespace(codePoint)) {
                return false;
            }
        }
        return true;
    } catch (error) {
        // console.log(error)
        // console.log(Java.use("android.util.Log").getStackTraceString(error))
        return false;
    }
}

function getByteString(buffer) {
    var bytearray = buffer[M_buffer_readByteArray]();
    var byteString = OkioByteStrngWapper.of(bytearray)
    return byteString;
}

function NewBuffer(byteString) {
    var buffer = OkioBufferWapper.$new()
    byteString.write(buffer)
    return buffer;
}

function readBufferString(byteString, chatset) {
    var byteArray = byteString.toByteArray();
    var str = JavaStringWapper.$new(byteArray, chatset)
    return str;
}

function splitLine(string, tag) {
    var newSB = JavaStringBufferWapper.$new()
    var newString = JavaStringWapper.$new(string)
    var lineNum = Math.ceil(newString.length() / 150)
    for (var i = 0; i < lineNum; i++) {
        var start = i * 150;
        var end = (i + 1) * 150
        newSB.append(tag)
        if (end > newString.length()) {
            newSB.append(newString.substring(start, newString.length()))
        } else {
            newSB.append(newString.substring(start, end))
        }
        newSB.append("\n")
    }
    var lineStr = "";
    if (newSB.length() > 0) {
        lineStr = newSB.deleteCharAt(newSB.length() - 1).toString()
    }
    return lineStr
}

/**
 * 
 */
function alreadyHook(str) {
    for (var i = 0; i < hookedArray.length; i++) {
        if (str == hookedArray[i]) {
            return true;
        }
    }
    return false;
}

// 抓包显示
function printAll(responseObject, logString) {
    try {
        var request = getFieldValue(responseObject, F_rsp_request)
        printerRequest(request, logString)
    } catch (error) {
        console.log("print request error : ", error.stack)
        return responseObject;
    }
    var newResponse = printerResponse(responseObject, logString)
    return newResponse;
}


function printerRequest(request, logString) {
    var defChatset = CharsetWapper.forName("UTF-8")
    //URL
    var httpUrl = getFieldValue(request, F_req_url)
    logString.append("| URL: " + httpUrl).append("\n")
    logString.append("|").append("\n")
    logString.append("| Method: " + getFieldValue(request, F_req_method)).append("\n")
    logString.append("|").append("\n")
    var requestBody = getFieldValue(request, F_req_body);
    var hasRequestBody = true
    if (null == requestBody) {
        hasRequestBody = false
    }
    //Headers
    var requestHeaders = getFieldValue(request, F_req_headers)
    var headersList = headersToList(requestHeaders)
    var headersSize = getHeaderSize(headersList)

    logString.append("| Request Headers: ").append("" + headersSize).append("\n")
    if (hasRequestBody) {
        var requestBody = getWrapper(requestBody)
        var contentType = requestBody[M_reqbody_contentType]()
        if (null != contentType) {
            logString.append("|   ┌─" + "Content-Type: " + contentType).append("\n")
        }
        var contentLength = requestBody[M_reqbody_contentLength]()
        if (contentLength != -1) {
            var tag = headersSize == 0 ? "└─" : "┌─"
            logString.append("|   " + tag + "Content-Length: " + contentLength).append("\n")
        }
    }
    if (headersSize == 0) {
        logString.append("|     no headers").append("\n")
    }
    for (var i = 0; i < headersSize; i++) {
        var name = getHeaderName(headersList, i)
        if (!JavaStringWapper.$new("Content-Type").equalsIgnoreCase(name) && !JavaStringWapper.$new("Content-Length").equalsIgnoreCase(name)) {
            var value = getHeaderValue(headersList, i)
            var tag = i == (headersSize - 1) ? "└─" : "┌─"
            logString.append("|   " + tag + name + ": " + value).append("\n")
        }
    }
    var shielded = filterUrl(httpUrl.toString())
    if (shielded) {
        logString.append("|" + "     File Request Body Omit.....").append("\n")
        return;
    }
    logString.append("|").append("\n")
    if (!hasRequestBody) {
        logString.append("|" + "--> END ").append("\n")
    } else if (bodyEncoded(headersList)) {
        logString.append("|" + "--> END  (encoded body omitted > bodyEncoded)").append("\n")
    } else {
        logString.append("| Request Body:").append("\n")

        // add fenfei 只适配 8.3.30.17506
        // var buffer = BufferWapper.$new();

        var KsBufferWapper = Java.use("f0.f");
        var buffer = KsBufferWapper.$new();
        // end

        requestBody[M_reqbody_writeTo](buffer)
        var reqByteString = getByteString(buffer)

        var charset = defChatset
        var contentType = requestBody[M_reqbody_contentType]()
        if (null != contentType) {
            var appcharset = contentType[M_contentType_charset](defChatset);
            if (null != appcharset) {
                charset = appcharset;
            }
        }
        //LOG Request Body
        try {
            if (isPlaintext(reqByteString)) {
                logString.append(splitLine(readBufferString(reqByteString, charset), "|   ")).append("\n")
                logString.append("|").append("\n")
                logString.append("|" + "--> END ").append("\n")
            } else {
                logString.append(splitLine(hexToUtf8(reqByteString.hex()), "|   ")).append("\n")
                logString.append("|").append("\n");
                logString.append("|" + "--> END  (binary body omitted -> isPlaintext)").append("\n")
            }
        } catch (error) {
            logString.append(splitLine(hexToUtf8(reqByteString.hex()), "|   ")).append("\n")
            logString.append("|").append("\n");
            logString.append("|" + "--> END  (binary body omitted -> isPlaintext)").append("\n")
        }
    }
    logString.append("|").append("\n");
}

function printerResponse(response, logString) {
    var newResponse = null;
    try {
        var defChatset = CharsetWapper.forName("UTF-8")

        var request = getFieldValue(response, F_rsp_request)
        var url = getFieldValue(request, F_req_url)
        var shielded = filterUrl(url.toString())
        if (shielded) {
            logString.append("|" + "     File Response Body Omit.....").append("\n")
            return response;
        }
        //URL
        logString.append("| URL: " + url).append("\n")
        logString.append("|").append("\n")
        logString.append("| Status Code: " + getFieldValue(response, F_rsp_code) + " / " + getFieldValue(response, F_rsp_message)).append("\n")
        logString.append("|").append("\n")
        var responseBodyObj = getFieldValue(response, F_rsp_body)
        var responseBody = getWrapper(responseBodyObj)
        var contentLength = responseBody[M_rspBody_contentLength]()
        //Headers
        var resp_headers = getFieldValue(response, F_rsp_headers)
        var respHeadersList = headersToList(resp_headers)
        var respHeaderSize = getHeaderSize(respHeadersList)
        logString.append("| Response Headers: ").append("" + respHeaderSize).append("\n")
        if (respHeaderSize == 0) {
            logString.append("|     no headers").append("\n")
        }
        for (var i = 0; i < respHeaderSize; i++) {
            var tag = i == (respHeaderSize - 1) ? "└─" : "┌─"
            logString.append("|   " + tag + getHeaderName(respHeadersList, i) + ": " + getHeaderValue(respHeadersList, i)).append("\n")
        }
        //Body
        var content = "";
        var nobody = !hasBody(response, respHeadersList)
        if (nobody) {
            logString.append("| No Response Body : " + response).append("\n")
            logString.append("|" + "<-- END HTTP").append("\n")
        } else if (bodyEncoded(respHeadersList)) {
            logString.append("|" + "<-- END HTTP (encoded body omitted)").append("\n")
        } else {
            logString.append("| ").append("\n");
            logString.append("| Response Body:").append("\n")
            var source = responseBody[M_rspBody_source]()
            var rspByteString = getByteString(source)
            var charset = defChatset
            var contentType = responseBody[M_rspBody_contentType]()
            if (null != contentType) {
                var appcharset = contentType[M_contentType_charset](defChatset)
                if (null != appcharset) {
                    charset = appcharset
                }
            }
            //newResponse
            var mediaType = responseBody[M_rspBody_contentType]()
            var newBody = null;
            try {
                newBody = ResponseBodyWapper[M_rspBody_create](mediaType, rspByteString.toByteArray())
            } catch (error) {
                newBody = ResponseBodyWapper[M_rspBody_create](mediaType, readBufferString(rspByteString, charset))
            }
            var newBuilder = null;
            if ("" == M_rsp_newBuilder) {
                var ResponseBuilderClazz = response.class.getDeclaredClasses()[0]
                newBuilder = Java.use(ResponseBuilderClazz.getName()).$new(response)
            } else {
                newBuilder = response[M_rsp_newBuilder]()
            }
            var bodyField = newBuilder.class.getDeclaredField(F_rsp$builder_body)
            bodyField.setAccessible(true)
            bodyField.set(newBuilder, newBody)
            newResponse = newBuilder[M_rsp$builder_build]()

            if (!isPlaintext(rspByteString)) {
                logString.append("|" + "<-- END HTTP (binary body omitted)").append("\n");
            }
            if (contentLength != 0) {
                try {
                    var content = readBufferString(rspByteString, charset)
                    logString.append(splitLine(content, "|   ")).append("\n")
                } catch (error) {
                    logString.append(splitLine(hexToUtf8(rspByteString.hex()), "|   ")).append("\n")
                }

                logString.append("| ").append("\n");
            }
            logString.append("|" + "<-- END HTTP").append("\n");
        }
    } catch (error) {
        logString.append("print response error : " + error).append("\n")
        if (null == newResponse) {
            return response;
        }
    }
    return newResponse;
}

function buildNewResponse(responseObject) {
    var newResponse = null;
    Java.perform(function () {
        try {
            var logString = JavaStringBufferWapper.$new()

            logString.append("").append("\n");
            logString.append("┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n");

            newResponse = printAll(responseObject, logString)

            logString.append("└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────").append("\n");
            logString.append("").append("\n");

            console.log(logString)
        } catch (error) {
            console.log("printAll ERROR : " + error);
        }
    })
    return newResponse;
}

function ks_httpcat() {
    Java.openClassFile("/data/local/tmp/okhttpfind.dex").load()

    Utils = Java.use("com.singleman.okhttp.Utils")
    //Init common
    JavaStringWapper = Java.use("java.lang.String")
    JavaStringBufferWapper = Java.use("java.lang.StringBuilder")
    JavaIntegerWapper = Java.use("java.lang.Integer")
    GsonWapper = Java.use("com.singleman.gson.Gson")
    ListWapper = Java.use("java.util.List")
    ArraysWapper = Java.use("java.util.Arrays")
    ArrayListWapper = Java.use("java.util.ArrayList")
    CharsetWapper = Java.use("java.nio.charset.Charset")
    CharacterWapper = Java.use("java.lang.Character")

    OkioByteStrngWapper = Java.use("com.singleman.okio.ByteString")
    OkioBufferWapper = Java.use("com.singleman.okio.Buffer")

    //Init OKHTTP
    OkHttpClientWapper = Java.use(Cls_OkHttpClient)
    ResponseBodyWapper = Java.use(Cls_ResponseBody)
    BufferWapper = Java.use(Cls_okio_Buffer)

    //异步 貌似没啥用，ks 8.x没有用异步
    /*
    Java.use(RealCallCls)[M_Call_enqueue].overload(Cls_CallBack).implementation = function (callback) {
        console.log("-------------------------------------HOOK SUCCESS 异步--------------------------------------------------")
        var realCallBack = Java.use(callback.$className)
        realCallBack[M_CallBack_onResponse].overload(Cls_Call,Cls_Response).implementation = function(call, response){
            // var newResponse = buildNewResponse(response)
            // this[M_CallBack_onResponse](call,newResponse)
            buildNewResponse(response)
            this[M_CallBack_onResponse](call,response)
        }
        this[M_Call_enqueue](callback)
        realCallBack.$dispose
    }
    */

    // 同步
    // /*
    Java.use(RealCallCls)[M_Call_execute].overload().implementation = function () {
        var response = this[M_Call_execute]();

        buildNewResponse(response);
        return response;
    }
    // */
}

/**
 *  fenfei 过滤url
 *  false 显示
 *  true  拦截 不显示 返回信息
 */
function filterUrl(url) {
    //*
    for (var j = 0; j < showArray.length; j++) {
        if (url.indexOf(showArray[j]) != -1) {
            // console.log(url + " ?? " + showArray[i])
            return false;
        }
    }

    return true;
    // */

    for (var i = 0; i < filterArray.length; i++) {
        if (url.indexOf(filterArray[i]) != -1) {
            // console.log(url + " ?? " + filterArray[i])
            return true;
        }
    }
    return false;
}


function Where(stack) {
    var at = ""
    for (var i = 0; i < stack.length; ++i) {
        at += stack[i].toString() + "\n"
    }
    return at
}

function bytesToString(arr) {
    if (typeof arr === 'string') {
        return arr;
    }

    var str = '',
        _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
}

setImmediate(function () {

    Java.perform(function () {
        var threadef = Java.use('java.lang.Thread');
        var threadinstance = threadef.$new();

        // 干掉 Android SSL Pinning
        //*
        var array_list = Java.use("java.util.ArrayList");
        var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');

        ApiClient.checkTrustedRecursive.implementation = function (a1, a2, a3, a4, a5, a6) {
            // console.log('Bypassing SSL Pinning');
            var k = array_list.$new();
            return k;
        }
        // */

        Java.choose("com.kuaishou.android.security.KSecurity" , {
            onMatch: function(instance ){
                console.log('com.kuaishou.android.security.KSecurity.sChangeQuickRedirect' ,instance.sChangeQuickRedirect)

            },onComplete : function(){

            }
        })
        // 让Charles可以抓包 支持 8.x+
        var strCls = Java.use("java.lang.StringBuilder");
        strCls.toString.implementation = function () {
            var result = this.toString();
            if (result.toString().indexOf("enable_quic") >= 0 && result.toString().length < 200) {
                console.log(result.toString());

                // var stack = threadinstance.currentThread().getStackTrace();
                console.log("Rc Full call stack:" + Where(stack));

                return "{\"enable_quic\": false, \"preconnect_num_streams\": 2, \"quic_idle_timeout_sec\": 180, \"quic_use_bbr\": false, \"altsvc_broken_time_max\": 600, \"altsvc_broken_time_base\": 60, \"proxy_host_blacklist\": []}";
            }

            if (result.toString().indexOf("kwailink_use_quic") >= 0 && result.toString().length < 200) {
                console.log(result.toString());

                var stack = threadinstance.currentThread().getStackTrace();
                console.log("Rc Full call stack:" + Where(stack));
                return "fenfei";
            }
            return result;
        }


        // sig

        var signCls = Java.use('com.yxcorp.gifshow.util.CPU');
        signCls.getClock.implementation = function (a, b, c) {
            var result = this.getClock(a, b, c);
            console.log(bytesToString(b));
            console.log(result);

            var stack = threadinstance.currentThread().getStackTrace();
            console.log("Full call stack:" + Where(stack));

            return result;
        }

        // __NS_sig3
        var IKSecurityBaseCls = Java.use("com.kuaishou.android.security.matrix.m");
        IKSecurityBaseCls.atlasSign.implementation = function (a, b, c, d) {
            var result = this.atlasSign(a, b, c, d);
            var stack = threadinstance.currentThread().getStackTrace();
            // console.log("Full call stack:" + Where(stack));
            console.log(a + ">>> atlasSignA " + result);
            return result;
        }


        var IKSecurityExCls = Java.use("com.kuaishou.android.security.KSecurity");
        IKSecurityExCls.atlasSign.implementation = function (a) {
            var result = this.atlasSign(a);
            var stack = threadinstance.currentThread().getStackTrace();
            // console.log("Full call stack:" + Where(stack));
            console.log(a + ">>> atlasSignB " + result);
            return result;
        }


        var OkHttpClient = Java.use("okhttp3.OkHttpClient");
        OkHttpClient.newCall.implementation = function (request) {
            var result = this.newCall(request);
            if(request.toString().indexOf("abtest/config") >= 0 ){
                console.log(request.toString());
            }
            // console.log(request.toString());
            return result;
        };
        //*/

        var OkHttpRealCall = Java.use("okhttp3.RealCall");
        OkHttpRealCall.execute.implementation = function(){
            var result = this.execute();
            if(result.toString().indexOf("abtest/config") >= 0 ){
                console.log(result.toString());
            }

            console.log(result.toString());
            return result;
        }

        //  public okhttp3.Response intercept
        // var OkResponseCls = Java.use("j.a.v.f");
        // OkResponseCls.intercept.implementation = function(a){
        //     var result = this.intercept(a);
        //
        //     // console.log(result.toString());
        //     try {
        //         if(result.toString().indexOf("abtest") >= 0 ){
        //             console.log(result.toString());
        //             var stack = threadinstance.currentThread().getStackTrace();
        //             console.log("Rc Full call stack:" + Where(stack));
        //
        //         }
        //     } catch (error) {
        //         console.log("printAll ERROR : " + error);
        //     }
        //
        //
        //     return result;
        // }
        // */
    });
    // */		
});
