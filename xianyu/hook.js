//com.taobao.idlefish

function fastjson_parse(instance) {
    try {
        var fastjson = Java.use('com.alibaba.fastjson.JSON');
        return fastjson.toJSONString(instance)
    } catch (error) {
        console.log(error)
        return JSON.stringify(instance)
    }
}

function hookAllOverloads(targetClass, targetMethod) {
    Java.perform(function () {
        console.log("entering....")
        var targetClassMethod = targetClass + '.' + targetMethod;
        var hook = Java.use(targetClass);
        var overloadCount = hook[targetMethod].overloads.length;
        for (var i = 0; i < overloadCount; i++) {
            hook[targetMethod].overloads[i].implementation = function () {
                var retval = this[targetMethod].apply(this, arguments);
                var out_puts = []
                for (var i = 0; i < arguments.length; i++) {
                    out_puts.push(json_parse(arguments[i]))
                }
                out_puts.push(retval)
                console.log(out_puts.join("\n"))
                return retval;
            }
        }
    });
}

// anet.channel.strategy.dispatch.AmdcRuntimeInfo.a ==> iamdsign 
// anet.channel.strategy.dispatch.DispatchParamBuilder 
// anet.channel.SessionCenter$1  实现 iamdsign 
// anet.channel.Config.appkey 
// anet/channel/Config$Builder.b print_stack  ->get_appkey 
// anet.channel.strategy.dispatch.IAmdcSign.sign 

//密码
// com.ali.user.mobile.rpc.safe.Rsa.encrypt 
// rsa
// key 默认

// appName
function hook_appName() {
    console.log("hooking ")
    var Config = Java.use("anet.channel.Config");
    Config.a.overload('java.lang.String', 'anet.channel.entity.ENV').implementation = function (appkey2, env) {
        console.log("args:", appkey2, env)
        var config = this.a.apply(this, arguments)
        console.log("appkey:", config.appkey.value)
        return config
    }
}

// com.ali.user.mobile.app.dataprovider.DataProvider.getTTID
// "1569390668508@fleamarket_android_6.9.30"

function print_stack() {
    return Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new())
}

function Log(input_str) {
    var logs = ""
    logs += "=====================================================\n"
    logs += (input_str.join('\n') +"\n")
    logs += "=====================================================\n"
    console.log(logs)
}


function hook_utdid() {
    var UTDevice = Java.use("com.ta.utdid2.device.UTDevice");
    UTDevice.getUtdid.implementation = function (context) {
        var result = this.getUtdid(context);
        // console.log("UTDevice >>> context:", fastjson_parse(context))
        console.log("UTDevice >>> result:", result)
        return result
    }
}


function hookTelephonyManager() {
    var TelephonyManager = Java.use("android.telephony.TelephonyManager")
    TelephonyManager.getSubscriberId.overload().implementation = function () {
        var result = this.getSubscriberId()
        console.log("getIMSI >>>", result)
        return result
    }
    TelephonyManager.getDeviceId.overload().implementation = function () {
        var result = this.getDeviceId()
        console.log("getIMEI >>>", result)
        return result
    }
}


function bypassSSL() {
    var array_list = Java.use("java.util.ArrayList");
    var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
    ApiClient.checkTrustedRecursive.implementation = function (a1, a2, a3, a4, a5, a6) {
        var k = array_list.$new();
        return k;
    }
}

function hook_UnifiedSign(){

     var InnerSignImpl = Java.use("mtopsdk.security.InnerSignImpl");
     var getUnifiedSign = null;

     InnerSignImpl.getUnifiedSign.implementation = function (params, ext, appKey, authCode, useWua, requestId) {
            // /HashMap<String, String> params, HashMap<String, String> ext, String appKey, String authCode, boolean useWua, String
            var logs = []
            logs.push(">>> params:" + fastjson_parse(params))
            // md5(params["data"])
            logs.push(">>> ext:" + fastjson_parse(ext))
            logs.push(">>> appkey:" + appKey)
            logs.push(">>> authCode:" + authCode)
            logs.push(">>> useWua:" + useWua)
            logs.push(">>> requestId:" + requestId)
            var result = this.getUnifiedSign.apply(this, arguments);
            logs.push(">>> result:" + result)
            Log(logs)
            getUnifiedSign = result;

            // 打印 this 查找接口
            var fields = Java.cast(this.getClass(),Java.use('java.lang.Class')).getDeclaredFields();
			console.log(fields);
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                field.setAccessible(true);
                var name = field.getName();
                var value =field.get(this)
                console.log("name:"+name+"\tvalue:"+value);
            }
            return result
        }

}

function hook_java() {
    Java.perform(function () {
        bypassSSL()
        // hookTelephonyManager()
        // hook_utdid()
        // hook_UnifiedSign()

        var  targetClass = "com.alibaba.wireless.security.middletierplugin.b.a.a$a";
        Java.enumerateClassLoaders({
            onMatch: function (loader) {
                try {
                    var iUseCls = loader.findClass(targetClass);
                    if(iUseCls){
                        console.log("loader find: " + loader);
                    }
                } catch (error) {
                    //console.log("classloader failed" + error);
                }
            }, onComplete: function () {
            }
        });
    })
}

function main() {
    hook_java()
}

setImmediate(main)