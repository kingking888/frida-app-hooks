//frida -U -f com.ss.android.ugc.aweme --no-pause  -l hook2.js

/*
base 0xa8e5b000
* go into _ZN3art9ArtMethod14RegisterNativeEPKvb---artmethodptr:0xad2a40dc---
* methodidx:2658--addr:0xa8e661d5----
* name:com.bytedance.frameworks.encryptor.EncryptorUtil.ttEncrypt
* */

//bytesToString
function bytesToString(arr) {
    var str = '';
    arr = new Uint8Array(arr);
    for (var i in arr) {
        str += String.fromCharCode(arr[i]);
    }
    return str;
}


function hook_java() {
    Java.perform(function () {

        var NetUtil = Java.use("com.ss.android.common.applog.NetUtil");
        NetUtil.addCommonParams.implementation = function (sParams, bclone) {
            var result = this.addCommonParams.apply(this, arguments);
            for (let i = 0; i < arguments.length; i++) {
                console.log("arg" + i + ":" + JSON.stringify(arguments[i]))
            }
            console.log("addCommonParams result:", result)
            return result;
        }
        // sendEncryptLog
        NetUtil.sendEncryptLog.overload('java.lang.String', '[B', 'android.content.Context', 'boolean').implementation = function (str, bArr, context, z) {
            var result = this.sendEncryptLog.apply(this, arguments);
            console.log(">> str:", str)
            console.log(">> bArr:", bytesToString(bArr))
            console.log(">> context:", JSON.stringify(context))
            console.log(">> z bool:", z)
            console.log("sendEncryptLog result:", result)
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()))
            return result
        }

        // compress
        NetUtil.compressAndEncryptData.implementation = function (context, bArr) {
            console.log('>>>  compressAndEncryptData context:', JSON.stringify(context));
            console.log('>>>  compressAndEncryptData bArr:', bytesToString(bArr), "json:", JSON.stringify(bArr));
            var result = this.compressAndEncryptData.apply(this, arguments);
            console.log("compressAndEncryptData result:", result)
            // console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()))
            return result
        }

        // com.bytedance.frameworks.encryptor.EncryptorUtil
        var EncryptorUtil = Java.use("com.bytedance.frameworks.encryptor.EncryptorUtil");
        EncryptorUtil.a.implementation = function (barr, length) {
            console.log('>>>  EncryptorUtil.a barr:', bytesToString(barr), "json:", JSON.stringify(barr));
            console.log('>>>  EncryptorUtil.a length:', length);
            var result = this.a.apply(this, arguments);
            console.log("EncryptorUtil.a:", result)
            return result
        }
    })
}

function hook_native() {
    var Moudle = Process.getModuleByName("libEncryptor.so")
    console.log(Moudle.base)
    console.log(ptr(0xa8e661d5).sub(Moudle.base))
}

function main() {
    // hook_java()
    hook_native()
}

setImmediate(main )
