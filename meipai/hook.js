// com.meitu.meipaimv
function hook_java() {
    Java.perform(function () {
        var SigEntityClass = Java.use('com.meitu.secret.SigEntity');
        SigEntityClass.generatorSigWithFinal.overload('java.lang.String', '[Ljava.lang.String;', 'java.lang.String', 'java.lang.Object').implementation = function (str1, str2, str3, obj) {
            var SigEntity = this.generatorSigWithFinal(str1, str2, str3, obj);
            console.log("str1:", str1, "str2:", str2, "str3:", str3, "obj:", obj)
            console.log("sig:", SigEntity.sig.value, "sigTime : ", SigEntity.sigTime.value, "sigVersion : ", SigEntity.sigVersion.value, "finalString:", SigEntity.finalString.value)
            return SigEntity
        }
    })
}

function hook_native() {
    console.log("hook native  starting ....")
    var module_base = Module.getBaseAddress('librelease_sig.so')
    var addr_calcute = Module.getExportByName('librelease_sig.so', '_Z13MD5_CalculatePKcjPc');
    if (addr_calcute) {
        Interceptor.attach(addr_calcute, {
            onEnter: function (args) {
                this.arg0 = args[0]
                this.arg1 = args[1]
                this.arg2 = args[2]
                console.log("addr_calcute onEnter:\r\n", hexdump( args[0]  , { length :  parseInt(  args[1])})  , args[1], "\r\n", hexdump(args[2])
                )
            }, onLeave: function (retval) {
                console.log("addr_calcute onLeave:\r\n", hexdump(this.arg2))
            }
        })
    }

    var addr_md5_update = Module.getExportByName('librelease_sig.so', '_Z10MD5_UpdateP10MD5ContextPhj')
    if (addr_md5_update) {
        Interceptor.attach(addr_md5_update, {
            onEnter: function (args) {
                this.arg0 = args[0]
                this.arg1 = args[1]
                this.arg2 = args[2]
                this.logs = []
                // console.log("md5 update:", args[0], args[1], args[2])
                this.logs.push("addr_md5_update onEnter :\r\n", hexdump(args[0]), "\r\n", hexdump(args[1]), args[2])
            }, onLeave: function (retval) {
                this.logs.push("addr_md5_update onLeave  this.arg1 :\r\n", hexdump(this.arg1))
                this.logs.push("addr_md5_update onLeave  retval: \r\n", hexdump(retval))
                console.log(this.logs.join('\n'))
            }
        })
    }
    var sub_52A4 = module_base.add(0x52A4 + 1)
    // Interceptor.attach(sub_52A4, {
    //     onEnter: function (args) {
    //         this.arg0 = args[0]
    //         this.arg1 = args[1]
    //         this.arg2 = args[2]
    //         console.log("sub_52A4 onEnter:", hexdump(args[0]), "\r\n",
    //             hexdump(args[1]), "\r\n", hexdump(args[2]))
    //     }, onLeave: function (retval) {
    //         console.log("sub_52A4  onLeave ", hexdump(this.arg0), '\r\n', hexdump(this.arg1), "\r\n", hexdump(this.arg2))
    //     }
    // })

}


function call_sign() {
    Java.perform(function () {
        Java.choose('com.meitu.secret.SigEntity', {
            onMatch: function (instance) {
                console.log("call_sign .... ")
                var stringClass = Java.use("java.lang.String");
                var BaseApplication = Java.use("com.meitu.library.application.BaseApplication")
                var application2 = BaseApplication.getApplication();
                const strArray = Java.array('java.lang.String', ["1", "22", "333", "4444", '5555555'])
                var SigEntity = instance.generatorSigWithFinal(
                    stringClass.$new("common/interact.json"),
                    strArray,
                    stringClass.$new("10001"),
                    application2
                );
                console.log("sig:", SigEntity.sig.value, "sigTime : ",
                    SigEntity.sigTime.value, "sigVersion : ", SigEntity.sigVersion.value, "finalString:", SigEntity.finalString.value)
            }, onComplete: function (retval) {
                console.log('heap search over!', retval)
            }
        })

    })
}

function main() {
    // hook_java()
    hook_native()
}

setImmediate(main)
