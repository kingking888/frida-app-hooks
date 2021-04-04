// tv.danmaku.bili
// JNItrace
// 动态注册
// com.bilibili.nativelibrary.LibBili.s

function json_parse(instance) {
    try {
        var JSON = Java.use('com.alibaba.fastjson.JSON');
        return JSON.toJSONString(instance)

    } catch (error) {
        console.log(error)
        console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()))

    }
}

function call_sign() {
    Java.perform(function () {
        var LibBili = Java.use("com.bilibili.nativelibrary.LibBili");
        var sortedMapClass = Java.use("java.util.TreeMap");
        var sortedMap = sortedMapClass.$new()

        sortedMap.put("access_key", "f5a7851ee7be0f2cd84f857a7b349931");
        sortedMap.put("appkey", "1d8b6e7d45233436");
        sortedMap.put("build", "6200400");
        sortedMap.put("c_locale", "zh-Hans_CN");
        sortedMap.put("channel", "shenma114")
        sortedMap.put("fnval", "400");
        sortedMap.put("fnver", "0");
        sortedMap.put("force_host", "0");
        sortedMap.put("fourk", "1");
        sortedMap.put("mobi_app", "android")
        sortedMap.put("order", "");
        sortedMap.put("platform", "android");
        sortedMap.put("player_net", "1");
        sortedMap.put("pn", "1");
        sortedMap.put("ps", "10")
        sortedMap.put("qn", "32")
        sortedMap.put("s_locale", "zh-Hans_CN")
        sortedMap.put("vmid", "440261030")
        var statistics_map = sortedMapClass.$new()
        statistics_map.put("appId", "1")
        statistics_map.put("platform", "3")
        statistics_map.put("version", "6.20.0")
        statistics_map.put("abtest", "")
        sortedMap.put("statistics", json_parse(statistics_map))

        var sign = LibBili.s(sortedMap);
        var query_ = Java.cast(sign, Java.use('com.bilibili.nativelibrary.SignedQuery'))
        console.log("call_sign:" + query_.toString());
    })

}

function hook_java() {
    Java.perform(function () {
        console.log("hooking java")

        /*
        * key e08be2d68aaaaf27
        * iv 16-Bytes--String
        * aes cbc
        * */

        // 个人主页
        // var c_class = Java.use("b2.d.b.j.c");
        // c_class.b.implementation = function (str, str2) {
        //     var result = this.b(str, str2);
        //     console.log(str, str2, "result:\n", result)
        //     return result
        // }

        var LibBili = Java.use("com.bilibili.nativelibrary.LibBili");
        LibBili.s.implementation = function (sortedMap) {
            console.log("sortedMap =>" + json_parse(sortedMap));
            var result = this.s(sortedMap);
            console.log("result native hook  sign result :" + result);
            return result;
        }

        // var SignedQuery = Java.use("com.bilibili.nativelibrary.SignedQuery");
        // SignedQuery.toString.implementation = function () {
        //     console.log("hooking toString ")
        //     var result = this.toString();
        //     console.log("SignedQuery tostring  result :" + result);
        //     return result;


    })

}


// md5(input + "560c52ccd288fed045859ed18bffd973")
function hook_native() {
    var libnativelibmodule = Process.getModuleByName("libbili.so");
    var module_base = libnativelibmodule.base;
    console.log(module_base)
    if (module_base) {
        var sub_2AE0 = module_base.add(0x2AE0 + 1);
        Interceptor.attach(sub_2AE0, {
            onEnter: function (args) {
                this.arg0 = args[0];
            }, onLeave: function (retval) {
                // sign result
                console.log("MD5 dofinal onLeave:", hexdump(this.arg0, {length: parseInt(this.arg0)}))
            }
        })


        var sub_2B64 = module_base.add(0x2B64 + 1);
        Interceptor.attach(sub_2B64, {
            onEnter: function (args) {
                this.arg0 = args[0];
                this.arg2 = args[2]; //out_len
                console.log("sub_2B64 onEnter :", hexdump(args[0]), "\r\n", hexdump(args[1]), args[2])
            }, onLeave: function (retval) {
                console.log("sub_2B64 onLeave:", hexdump(this.arg0, {length: this.arg2}))

            }
        })

        var sub_22B0 = module_base.add(0x22B0 + 1);
        Interceptor.attach(sub_22B0, {
            onEnter: function (args) {
                this.arg0 = args[0];
                this.arg1 = args[1];
                this.arg2 = args[2];
                console.log("MD5update  onEnter:", hexdump(args[1], {length: parseInt(args[2])}), args[2])
            }, onLeave: function (retval) {
                // console.log("sub_22B0 onLeave:", hexdump(retval), "\r\n", hexdump(this.arg0))
            }
        })


    }
}

function main() {
    // hook_java()
    hook_native()
}

setImmediate(main)



