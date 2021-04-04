// frida -U -l idle.js com.taobao.idlefish

function hook_java() {
    Java.perform(function () {

        console.log('hooking ')

        var signimp = Java.use("mtopsdk.security.InnerSignImpl");
        signimp.getUnifiedSign.implementation = function (params, ext, appKey, authCode, useWua, requestId) {
            //    HashMap<String, String> params, HashMap<String, String> ext, String appKey, String authCode, boolean useWua, String requestId
            var retval = this.getUnifiedSign.apply(this, arguments);
            console.log(retval.class.getName())
            console.log(">>> params = " + params.entrySet().toArray());
            console.log(">>> ext = " + ext.entrySet().toArray());
            console.log(">>> appKey = " + appKey);
            console.log(">>> authCode = " + authCode);
            console.log(">>> useWua = " + useWua);
            console.log(">>> requestId = " + requestId);
            console.log(">>> rc= " + retval.entrySet().toArray());
            var fields = Java.cast(this.getClass(), Java.use('java.lang.Class')).getDeclaredFields();
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                field.setAccessible(true);
                var name = field.getName();
                var value = field.get(this)
                console.log("name:" + name + "\tvalue:" + value);
            }
            return retval
        }
    })
}

function hook_native() {
}

function main() {
    hook_java()
    hook_native()
}

setImmediate(main)
