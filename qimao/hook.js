function hook_java() {
    Java.perform(function () {
        var Security = Java.use("com.km.encryption.api.Security");
        Security.sign.implementation = function (jbytes) {
            var result = this.sign(jbytes);
            console.log('sign:', result)
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            //4de6ea7178e4a077e3e2f88ad89dea8a
            return result
        }
    })

}

function hook_sign() {
    Java.perform(function () {
        var clazz = Java.use('com.km.core.b.a');
        clazz.a.overload('java.lang.String').implementation = function (str) {
            var result = this.a(str);
            console.log("com.km.core.b.a : ", str, "result:", result);
            return result
        }
    })

}

function attach(name, address) {
    console.log("attaching ", name);
    Interceptor.attach(address, {
        onEnter: function (args) {
            console.log("Entering => ", name)
            console.log("args[0] => ", hexdump(args[0]))
            // console.log("args[1] => ",args[1].readCString())
            // console.log("args[2] => ",args[2])
            // console.log('attach called from: ' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
        }, onLeave: function (retval) {
            console.log("retval is => ", retval)
        }
    })

}

function call_sign() {
    Java.perform(function () {
        var clazz = Java.use('com.km.core.b.a');
        var result = clazz.a(Java.use('java.lang.String').$new("chapterId=1632chapter_ver=19id=135580is_all_update=0"));
        console.log("call_sign result:", result);
        // md5("chapterId=1632chapter_ver=19id=135580is_all_update=0" + "d3dGiJc651gSQ8w1")
        // com.km.core.b.a :   result: afcf9a9ffb9c6c4348c2499c3c799e5b
        return result
    })

}

function traceNativeExport() {
    var modules = Process.enumerateModules();
    for (var i = 0; i < modules.length; i++) {
        var module = modules[i];
        if (module.name.indexOf('libcommon') >= 0) {
            var exports = module.enumerateExports();
            for (var j = 0; j < exports.length; j++) {
                if (exports[j].name.toString().indexOf("Java_com_km_encryption_api_Security_sign") >= 0) {
                    console.log(exports[j].address.sub(module.base))
                    attach('Java_com_km_encryption_api_Security_sign', exports[j].address)
                }

                // if (exports[j].name.toString().indexOf("_ZN12AndroidUtils13isCheckFailedEv") >= 0) {
                //     console.log(exports[j].address.sub(module.base))
                //     attach('_ZN12AndroidUtils13isCheckFailedEv', exports[j].address )
                // }
            }
        }
    }
}


function hook_native() {
    var encryption_base_addr = Module.findBaseAddress("libcommon-encryption.so");
    if (encryption_base_addr) {
        console.log(encryption_base_addr)
        var sub_F1D4 = encryption_base_addr.add(0xF1D4 + 1)
        Interceptor.attach(sub_F1D4, {
            onEnter: function (args) {
                this.arg0 = args[0]
                this.arg1 = args[1]
                this.arg2 = args[2]
                console.log('sub_F1D4 onEnter: ', ptr(args[1]).readCString(), "'\r\n", hexdump(args[1]), "\r\n", hexdump(args[2]));
            }, onLeave: function (retval) {
                console.log('sub_F1D4 onLeave: ', hexdump(this.arg0), "\r\n", hexdump(this.arg1), "\r\n", hexdump(retval), "\r\n", hexdump(this.arg2));
            }
        })


        var sub_EE30 = encryption_base_addr.add(0xEE30 + 1);
        Interceptor.attach(sub_EE30, {
            onEnter: function (args) {
                this.arg2 = args[2]
                console.log("sub_EE30 onEnter: ", hexdump(args[0]), "\r\n", hexdump(args[1]), "\r\n", hexdump(args[2]))
            }, onLeave: function (retval) {
                // 64 33 64 47 69 4a 63 36 35 31 67 53
                // d3dGiJc651gSQ8w1
                console.log("sub_EE30 onLeave:", hexdump(retval), "\r\n", hexdump(this.arg2))
            }
        })

    }

}


function main() {
    // traceNativeExport()
    // hook_java()
    hook_native()
}

setImmediate(main , 20000)