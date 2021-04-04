

function toJson(javaObject) {
    var gsonClz = Java.use("com.google.gson.Gson");
    var toJsonMethod = gsonClz.toJson.overload("java.lang.Object");
    return toJsonMethod.call(gsonClz.$new(), javaObject);
};

function trace_class(class_name) {
    var SharkUtils = Java.use(class_name);
    var methods = SharkUtils.class.getDeclaredMethods();
    for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        var substring = method.toString().substr(method.toString().indexOf(class_name) + class_name.length + 1);
        var finalMethodString = substring.substr(0, substring.indexOf("("));
        traceMethod(SharkUtils, finalMethodString);
    }

    function traceMethod(HookClass, targetMethod) {
        var overloads = HookClass[targetMethod];
        for (var i = 0; i < overloads.length; i++) {
            HookClass[targetMethod].overloads[i].implementation = function () {
                var retval = overloads[i].apply(this, arguments);
                console.log(targetMethod, "return:", retval)
                return retval;
            }
        }
    }
}


function hook__NS_sig3() {
    Java.perform(function () {

        var target__class = "p.c0.x.a.a0.q";
        var findloader = false;
        Java.enumerateClassLoaders({
            onMatch: function (loader) {
                try {
                    var loadclass = loader.loadClass(target__class);
                    findloader = true;
                    // console.log(loader + "-->loadclass " + target__class + " success!");
                    Java.classFactory.loader = loader;

                } catch (e) {
                    //console.log("error", e);
                }

            },
            onComplete: function () {
                //console.log("find  Classloader instance over");
            }
        })

        if (findloader) {
            // var k = Java.use("p.c0.n.s.k");
            // k.a.overload('okhttp3.OkHttpClient$Builder').implementation = function () {
            //     return true;
            // }
            var class_name = "p.c0.x.a.a0.q";
            trace_class(class_name)

            // q.a.overload('okhttp3.Request', 'java.util.Map', 'java.util.Map', 'java.lang.String').implementation = function (request, map, map2, str) {
            //     //(Request request, Map<String, String> map, Map<String, String> map2, String str) 
            //     console.log("request:", toJson(request))
            //     console.log("map:", toJson(map))
            //     console.log("map2:", toJson(map2))
            //     console.log("str:", str)
            //     var result = this.a.apply(this, arguments);
            //     console.log('q.a :result:', result)
            //     return result;
            // }

        }


    })


}

function main() {


    Java.perform(function () {

        // var threadef = Java.use('java.lang.Thread');
        // var threadinstance = threadef.$new();

        // 干掉 Android SSL Pinning
        //*
        var array_list = Java.use("java.util.ArrayList");
        var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');

        ApiClient.checkTrustedRecursive.implementation = function (a1, a2, a3, a4, a5, a6) {
            console.log('Bypassing SSL Pinning');
            var k = array_list.$new();
            return k;
        }



        var k7 = Java.use("p.c1.i.r3.k6.k7");
        k7.a.overload('com.yxcorp.gifshow.activity.GifshowActivity', 'com.yxcorp.gifshow.entity.QPhoto', 'com.yxcorp.gifshow.entity.QPreInfo', 'int', 'boolean', 'android.view.View$OnClickListener', 'u.c.j0.g').implementation = function(r16,  r17,  r18,  r19,  r20,  r21, r22){

            for (var i= 0;i<arguments.length; i++){
                console.log("i:" +JSON.stringify(arguments[i])  )
            }
            var result = this.a.apply(this , arguments);
            console.log("call " ,result)
            return result 
        }
        // */



        // // 让Charles可以抓包 支持 8.x+
        // var strCls = Java.use("java.lang.StringBuilder");
        // strCls.toString.implementation = function () {
        //     var result = this.toString();
        //     if (result.toString().indexOf("enable_quic") >= 0 && result.toString().length < 200) {
        //         console.log(result.toString());
        //         // var stack = threadinstance.currentThread().getStackTrace();
        //         // console.log("Rc Full call stack:" + Where(stack));
        //             return "{\"enable_quic\": false, \"preconnect_num_streams\": 2, \"quic_idle_timeout_sec\": 180, \"quic_use_bbr\": false, \"altsvc_broken_time_max\": 600, \"altsvc_broken_time_base\": 60, \"proxy_host_blacklist\": []}";
        //     }

        //     if (result.toString().indexOf("kwailink_use_quic") >= 0 && result.toString().length < 200) {
        //         console.log(result.toString());
        //         var stack = threadinstance.currentThread().getStackTrace();
        //         console.log("Rc Full call stack:" + Where(stack));
        //         return "fenfei";
        //     }
        //     return result;
        // }

        var class_name = "p.c0.x.a.a0.q";
        trace_class(class_name)

       // hook__NS_sig3()

    })


}

setImmediate(main)
